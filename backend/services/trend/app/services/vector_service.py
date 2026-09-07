"""Qdrant Vector DB Service — Semantic Search & Embeddings for Trend Concepts."""

from __future__ import annotations

import logging
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
)

from app.core.config import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "trend_concepts"
VECTOR_DIM = 384  # all-MiniLM-L6-v2 output dimension

# Lazy-loaded singleton — model is ~90MB, only loaded once per process
_sentence_model = None


def _get_model():
    """Returns the loaded SentenceTransformer model (lazy singleton)."""
    global _sentence_model
    if _sentence_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
            _sentence_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("SentenceTransformer model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load SentenceTransformer model: {e}")
            raise
    return _sentence_model


def generate_semantic_vector(text: str, tags: list[str] | None = None) -> list[float]:
    """
    Deterministic 384-dim embedding using all-MiniLM-L6-v2.
    Replaces the broken hash()-based vectorizer which produced random vectors
    across process restarts (due to PYTHONHASHSEED randomization).
    """
    combined = (text + " " + " ".join(tags or [])).strip()
    if not combined:
        return [0.0] * VECTOR_DIM
    try:
        model = _get_model()
        embedding = model.encode([combined])[0]
        return embedding.tolist()
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return [0.0] * VECTOR_DIM


class VectorService:
    def __init__(self) -> None:
        self._client: QdrantClient | None = None
        self._initialized = False

    def get_client(self) -> QdrantClient | None:
        if self._client is not None:
            return self._client
        try:
            self._client = QdrantClient(url=settings.qdrant_url, timeout=5.0)
            return self._client
        except Exception as e:
            logger.warning(f"Could not connect to Qdrant at {settings.qdrant_url}: {e}")
            return None

    def ensure_collection(self) -> bool:
        client = self.get_client()
        if not client:
            return False
        try:
            existing = [c.name for c in client.get_collections().collections]

            if COLLECTION_NAME in existing:
                # Check for dimension mismatch — old collection (128-dim hash) must be recreated
                try:
                    info = client.get_collection(COLLECTION_NAME)
                    existing_dim = info.config.params.vectors.size
                    if existing_dim != VECTOR_DIM:
                        logger.warning(
                            f"Qdrant collection '{COLLECTION_NAME}' has dim={existing_dim} "
                            f"but expected {VECTOR_DIM}. Dropping and recreating."
                        )
                        client.delete_collection(COLLECTION_NAME)
                        existing = []  # Force recreation below
                except Exception as e:
                    logger.warning(f"Could not inspect existing collection dim: {e}")

            if COLLECTION_NAME not in existing:
                client.create_collection(
                    collection_name=COLLECTION_NAME,
                    vectors_config=VectorParams(size=VECTOR_DIM, distance=Distance.COSINE),
                )
                logger.info(f"Created Qdrant collection '{COLLECTION_NAME}' (dim={VECTOR_DIM})")

            self._initialized = True
            return True
        except Exception as e:
            logger.warning(f"Failed to ensure Qdrant collection: {e}")
            return False

    def upsert_concept_vector(
        self,
        concept_id: str,
        title: str,
        niche_tags: list[str],
        raw_momentum: float = 0.0,
    ) -> bool:
        client = self.get_client()
        if not client:
            return False
        try:
            if not self._initialized:
                self.ensure_collection()

            vector = generate_semantic_vector(title, niche_tags)
            point = PointStruct(
                id=concept_id,
                vector=vector,
                payload={
                    "title": title,
                    "niche_tags": niche_tags,
                    "raw_momentum": raw_momentum,
                },
            )
            client.upsert(collection_name=COLLECTION_NAME, points=[point])
            return True
        except Exception as e:
            logger.exception(f"Failed to upsert vector for concept {concept_id}: {e}")
            return False

    def search_similar(
        self,
        query_text: str,
        niche_tags: list[str] | None = None,
        limit: int = 20,
    ) -> list[dict[str, Any]]:
        client = self.get_client()
        if not client:
            return []
        try:
            if not self._initialized:
                self.ensure_collection()

            query_vector = generate_semantic_vector(query_text, niche_tags)

            results = client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                limit=limit,
                with_payload=True,
            )

            return [
                {
                    "concept_id": str(res.id),
                    "score": float(res.score),
                    "title": res.payload.get("title", ""),
                    "niche_tags": res.payload.get("niche_tags", []),
                    "raw_momentum": res.payload.get("raw_momentum", 0.0),
                }
                for res in results
            ]
        except Exception as e:
            logger.warning(f"Vector search failed: {e}")
            return []

    def health(self) -> dict[str, Any]:
        client = self.get_client()
        if not client:
            return {"status": "unhealthy", "reason": "connection_failed"}
        try:
            info = client.get_collection(COLLECTION_NAME)
            return {
                "status": "healthy",
                "collection": COLLECTION_NAME,
                "vectors_count": info.points_count,
                "vector_dim": VECTOR_DIM,
                "embedding_model": "all-MiniLM-L6-v2",
            }
        except Exception:
            return {"status": "degraded", "reason": "collection_not_created"}

