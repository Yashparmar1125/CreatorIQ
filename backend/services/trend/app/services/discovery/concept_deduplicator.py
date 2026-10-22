"""
Semantic Concept Deduplication Gate.
Prevents concept fragmentation by comparing new candidates against existing Qdrant vectors.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.concept_models import Concept, TrendConcept
from app.services.vector_service import VectorService

logger = logging.getLogger(__name__)

SIMILARITY_DUPLICATE_THRESHOLD = 0.72


@dataclass
class DeduplicationResult:
    is_duplicate: bool
    matched_id: str | None
    matched_title: str | None
    similarity_score: float
    action: str  # "merge_alias", "approve_new", "exact_match"


class ConceptDeduplicator:
    """Evaluates proposed concepts to prevent semantic collisions and duplicate topics."""

    def __init__(self, vector_service: VectorService | None = None) -> None:
        self.vector_service = vector_service or VectorService()

    async def evaluate_candidate(
        self,
        db: AsyncSession,
        proposed_name: str,
        category: str,
        description: str | None = None,
    ) -> DeduplicationResult:
        clean_name = proposed_name.strip()

        # 1. Exact or case-insensitive match in `concepts` table
        exact_res = await db.execute(
            select(Concept).where(func.lower(Concept.name) == clean_name.lower())
        )
        exact_concept = exact_res.scalar_one_or_none()
        if exact_concept:
            return DeduplicationResult(
                is_duplicate=True,
                matched_id=exact_concept.id,
                matched_title=exact_concept.name,
                similarity_score=1.0,
                action="exact_match",
            )

        # 2. Semantic Vector search via Qdrant (global cross-niche check, clean text)
        query_text = f"{clean_name}. {description or ''}".strip()
        matches = self.vector_service.search_similar(query_text, niche_tags=None, limit=5)

        if matches:
            top_match = matches[0]
            # Handle both "score" and "similarity" keys from vector service
            score = float(
                top_match.get("score")
                if top_match.get("score") is not None
                else top_match.get("similarity", 0.0)
            )
            payload = top_match.get("payload") or {}
            matched_title = top_match.get("title") or payload.get("title") or top_match.get("concept_id")

            if score >= SIMILARITY_DUPLICATE_THRESHOLD:
                logger.info(
                    "Concept candidate '%s' matches existing '%s' (similarity: %.3f >= %.2f)",
                    clean_name,
                    matched_title,
                    score,
                    SIMILARITY_DUPLICATE_THRESHOLD,
                )
                return DeduplicationResult(
                    is_duplicate=True,
                    matched_id=top_match.get("concept_id"),
                    matched_title=matched_title,
                    similarity_score=score,
                    action="merge_alias",
                )

        # 3. Novel Topic confirmed
        top_score = 0.0
        if matches:
            top_score = float(
                matches[0].get("score")
                if matches[0].get("score") is not None
                else matches[0].get("similarity", 0.0)
            )
        return DeduplicationResult(
            is_duplicate=False,
            matched_id=None,
            matched_title=None,
            similarity_score=top_score,
            action="approve_new",
        )
