"""
Discovery Engine — Master Orchestrator for Dynamic Trend Discovery.
Harvests signals across YouTube mostPopular, Google Trends, and Tavily,
extracts canonical concepts via LLM, deduplicates via Qdrant, and autonomously
promotes validated emerging trends into PostgreSQL `concepts` table.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import numpy as np
from sqlalchemy import delete, func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.concept_models import Concept, ConceptCandidate, TrendConcept
from app.services.discovery.concept_deduplicator import ConceptDeduplicator
from app.services.discovery.llm_concept_extractor import LLMConceptExtractor
from app.services.discovery.tavily_harvester import TavilyTrendHarvester
from app.services.discovery.trends_harvester import GoogleTrendsHarvester
from app.services.discovery.youtube_popular_harvester import YouTubePopularHarvester
from app.services.vector_service import VectorService, generate_semantic_vector

logger = logging.getLogger(__name__)


class DiscoveryEngine:
    """End-to-end autonomous discovery and concept lifecycle manager."""

    def __init__(self) -> None:
        self.popular_harvester = YouTubePopularHarvester()
        self.trends_harvester = GoogleTrendsHarvester()
        self.tavily_harvester = TavilyTrendHarvester()
        self.llm_extractor = LLMConceptExtractor()
        self.vector_service = VectorService()
        self.deduplicator = ConceptDeduplicator(vector_service=self.vector_service)

    async def run_discovery_cycle(
        self,
        db: AsyncSession,
        *,
        categories: list[str] | None = None,
        max_promotions_per_cycle: int = 5,
    ) -> dict[str, Any]:
        """
        Executes a complete 6-hour discovery cycle:
        1. Harvests raw signals from low-quota & zero-quota sources.
        2. Clusters signals and extracts canonical concepts via LLM.
        3. Evaluates semantic novelty in Qdrant vector space.
        4. Autonomously promotes high-confidence candidates into `concepts`.
        5. Rotates out stale dynamic concepts (14-day inactivity prune).
        """
        logger.info("Starting autonomous Dynamic Trend Discovery cycle...")
        summary: dict[str, Any] = {
            "harvested_youtube": 0,
            "harvested_trends": 0,
            "harvested_tavily": 0,
            "proposed_candidates": 0,
            "promoted_concepts": [],
            "merged_duplicates": 0,
            "pruned_concepts": 0,
        }

        # 1. Harvest Signals across Low-Cost Sources
        yt_videos = await self.popular_harvester.fetch_popular_videos(
            regions=["IN", "US"],
            max_results_per_cat=20,
        )
        summary["harvested_youtube"] = len(yt_videos)

        gt_signals = await self.trends_harvester.fetch_rising_trends(geo="IN")
        summary["harvested_trends"] = len(gt_signals)

        tav_signals = await self.tavily_harvester.search_emerging_topics(
            niches=categories or ["Tech", "Fitness", "Gaming", "Finance", "Lifestyle", "Education"]
        )
        summary["harvested_tavily"] = len(tav_signals)

        # 2. Group signals by category
        all_signals = yt_videos + gt_signals + tav_signals
        by_category: dict[str, list[dict[str, Any]]] = {}
        for s in all_signals:
            cat = s.get("category", "General")
            by_category.setdefault(cat, []).append(s)

        # 3. Process each category
        promotions_count = 0
        batch_promoted_vectors: list[dict[str, Any]] = []

        for category, signals in by_category.items():
            if len(signals) < 3:
                continue

            # Fetch existing concept names in this category to prevent duplicate proposals
            existing_res = await db.execute(
                select(Concept.name).where(Concept.category == category)
            )
            existing_names = [r[0] for r in existing_res.fetchall()]

            # Call LLM Concept Normalizer
            extracted = await self.llm_extractor.extract_concepts_from_signals(
                category=category,
                signals=signals,
                existing_concept_names=existing_names,
            )

            for cand in extracted:
                name = (cand.get("proposed_name") or "").strip()
                if not name or len(name) < 4:
                    continue

                desc = cand.get("description")
                inc_terms = cand.get("include_terms") or [name.lower()]
                exc_terms = cand.get("exclude_terms") or []
                conf = float(cand.get("confidence_score") or 0.70)

                # Precompute candidate vector for fast in-batch and persistent checks
                cand_text = f"{name}. {desc or ''}".strip()
                cand_vec = np.array(generate_semantic_vector(cand_text), dtype=np.float64)
                cand_norm = np.linalg.norm(cand_vec)
                if cand_norm > 0:
                    cand_vec /= cand_norm

                # In-batch duplicate check against concepts promoted within this exact discovery cycle
                in_batch_dup = False
                for prev in batch_promoted_vectors:
                    sim = float(np.dot(cand_vec, prev["vector"]))
                    if sim >= 0.72:
                        summary["merged_duplicates"] += 1
                        logger.info(
                            "Candidate '%s' matches in-batch candidate '%s' (similarity: %.3f >= 0.72), skipping.",
                            name,
                            prev["name"],
                            sim,
                        )
                        in_batch_dup = True
                        break

                if in_batch_dup:
                    continue

                summary["proposed_candidates"] += 1

                # 4. Semantic Deduplication Gate (Qdrant & PostgreSQL)
                dedup = await self.deduplicator.evaluate_candidate(
                    db,
                    proposed_name=name,
                    category=category,
                    description=desc,
                )

                if dedup.is_duplicate:
                    summary["merged_duplicates"] += 1
                    logger.info(
                        "Candidate '%s' merged into existing concept '%s' (action=%s, sim=%.2f)",
                        name,
                        dedup.matched_title,
                        dedup.action,
                        dedup.similarity_score,
                    )
                    continue

                # 5. Persist candidate to `concept_candidates` table with savepoint
                try:
                    async with db.begin_nested():
                        cand_signals_sample = [s.get("title") for s in signals[:5]]

                        cand_stmt = select(ConceptCandidate).where(
                            func.lower(ConceptCandidate.proposed_name) == name.lower()
                        )
                        existing_cand = (await db.execute(cand_stmt)).scalar_one_or_none()

                        if existing_cand:
                            existing_cand.confidence_score = max(existing_cand.confidence_score, conf)
                            existing_cand.raw_signals = cand_signals_sample
                            existing_cand.category = category
                            if desc:
                                existing_cand.description = desc
                            db_candidate = existing_cand
                        else:
                            cand_id = uuid.uuid4()
                            db_candidate = ConceptCandidate(
                                id=cand_id,
                                proposed_name=name,
                                category=category,
                                description=desc,
                                include_terms=inc_terms,
                                exclude_terms=exc_terms,
                                discovery_source="discovery_engine",
                                raw_signals=cand_signals_sample,
                                confidence_score=conf,
                                status="pending",
                            )
                            db.add(db_candidate)

                        await db.flush()

                        # 6. Autonomous Promotion Gate
                        # If confidence is solid, not already promoted, and quota limit has headroom, promote immediately
                        if (
                            db_candidate.status != "promoted"
                            and conf >= 0.70
                            and promotions_count < max_promotions_per_cycle
                        ):
                            # Double check that the concept doesn't already exist in concepts table
                            existing_concept = (
                                await db.execute(select(Concept).where(func.lower(Concept.name) == name.lower()))
                            ).scalar_one_or_none()

                            if not existing_concept:
                                new_concept_id = str(uuid.uuid4())
                                promoted_concept = Concept(
                                    id=new_concept_id,
                                    name=name,
                                    category=category,
                                    description=desc,
                                    active=True,
                                    is_dynamic=True,
                                    discovery_source="discovery_engine",
                                    confidence_score=conf,
                                    include_terms=inc_terms,
                                    exclude_terms=exc_terms,
                                )
                                db.add(promoted_concept)
                                db_candidate.status = "promoted"
                                promotions_count += 1
                                batch_promoted_vectors.append({"name": name, "vector": cand_vec})

                                # Index new concept into Qdrant
                                if settings.enable_vector_search:
                                    try:
                                        self.vector_service.upsert_concept_vector(
                                            concept_id=new_concept_id,
                                            title=f"{name} {desc or ''}",
                                            niche_tags=[category] + inc_terms[:3],
                                            raw_momentum=60.0,
                                        )
                                    except Exception as v_err:
                                        logger.warning("Vector upsert for promoted concept failed: %s", v_err)

                                summary["promoted_concepts"].append(
                                    {
                                        "id": new_concept_id,
                                        "name": name,
                                        "category": category,
                                        "confidence": conf,
                                    }
                                )
                                logger.info("PROMOTED new dynamic concept: '%s' [%s]", name, category)
                            else:
                                db_candidate.status = "promoted"
                except Exception as cand_err:
                    logger.warning("Failed candidate persistence/promotion for '%s': %s", name, cand_err)

        # 7. Self-Pruning & Archival of Stale Dynamic Concepts (>14 days inactive)
        pruned = await self._prune_stale_dynamic_concepts(db)
        summary["pruned_concepts"] = pruned

        await db.commit()
        logger.info(
            "Discovery cycle complete: %d signals harvested, %d candidates proposed, %d concepts promoted, %d pruned.",
            summary["harvested_youtube"] + summary["harvested_trends"] + summary["harvested_tavily"],
            summary["proposed_candidates"],
            len(summary["promoted_concepts"]),
            summary["pruned_concepts"],
        )
        return summary

    async def _prune_stale_dynamic_concepts(self, db: AsyncSession) -> int:
        """Deactivate dynamic concepts that have had zero signal activity for 14+ days."""
        cutoff = datetime.now(timezone.utc) - timedelta(days=14)
        stmt = (
            select(Concept)
            .where(
                Concept.is_dynamic == True,
                Concept.active == True,
                Concept.updated_at < cutoff,
            )
        )
        res = await db.execute(stmt)
        stale = list(res.scalars().all())
        for c in stale:
            c.active = False
            logger.info("Archived stale dynamic concept '%s' to reclaim quota slot.", c.name)
        return len(stale)
