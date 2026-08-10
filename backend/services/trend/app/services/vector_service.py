"""Qdrant Vector DB Service — Semantic Search & Embeddings for Trend Concepts."""

from __future__ import annotations

import logging
import math
import re
from typing import Any
import numpy as np

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)

from app.core.config import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "trend_concepts"
VECTOR_DIM = 128


def generate_semantic_vector(text: str, tags: list[str] | None = None) -> list[float]:
    """
    Fast, lightweight semantic feature vectorization (128-dimensional).
    Maps text tokens, n-grams, and niche semantic clusters to a normalized unit hypersphere.
    """
    clean_text = (text + " " + " ".join(tags or [])).lower().strip()
    words = re.findall(r"\w+", clean_text)
    
    vec = np.zeros(VECTOR_DIM, dtype=np.float32)
    
    # 1. Word hashing into 96 dimensions
    for word in words:
        if len(word) < 2:
            continue
        h = abs(hash(word)) % 96
        vec[h] += 1.0
        # Character trigrams for typo/inflection robustness
        for i in range(len(word) - 2):
            th = abs(hash(word[i : i + 3])) % 96
            vec[th] += 0.3

    # 2. Semantic Cluster Highlighting (Dimensions 96-127 for explicit niche domain anchors)
    cluster_anchors = {
        "tech": range(96, 99),
        "ai": range(96, 99),
        "gadget": range(96, 99),
        "phone": range(96, 99),
        "gaming": range(99, 102),
        "game": range(99, 102),
        "esports": range(99, 102),
        "finance": range(102, 105),
        "stock": range(102, 105),
        "investing": range(102, 105),
        "money": range(102, 105),
        "fitness": range(105, 108),
        "health": range(105, 108),
        "workout": range(105, 108),
        "entertainment": range(108, 111),
        "movie": range(108, 111),
        "show": range(108, 111),
        "education": range(111, 114),
        "study": range(111, 114),
        "tutorial": range(111, 114),
        "travel": range(114, 117),
        "beauty": range(117, 120),
        "cooking": range(120, 123),
        "food": range(120, 123),
        "music": range(123, 126),
        "vlog": range(126, 128),
    }

    for word in words:
        for kw, dim_range in cluster_anchors.items():
            if kw in word or word in kw:
                for d in dim_range:
                    vec[d] += 2.5

    # L2 normalization to unit vector
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm

    return vec.tolist()


class VectorService:
    def __init__(self) -> None:
        self._client: QdrantClient | None = None
        self._initialized = False

    def get_client(self) -> QdrantClient | None:
        if self._client is not None:
            return self._client
        try:
            url = settings.qdrant_url
            self._client = QdrantClient(url=url, timeout=5.0)
            return self._client
        except Exception as e:
            logger.warning(f"Could not connect to Qdrant at {settings.qdrant_url}: {e}")
            return None

    def ensure_collection(self) -> bool:
        client = self.get_client()
        if not client:
            return False
        try:
            collections = [c.name for c in client.get_collections().collections]
            if COLLECTION_NAME not in collections:
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
            
            # Perform vector similarity search
            results = client.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                limit=limit,
                with_payload=True,
            )

            hits = []
            for res in results:
                hits.append({
                    "concept_id": str(res.id),
                    "score": float(res.score),
                    "title": res.payload.get("title", ""),
                    "niche_tags": res.payload.get("niche_tags", []),
                    "raw_momentum": res.payload.get("raw_momentum", 0.0),
                })
            return hits
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
            }
        except Exception:
            return {"status": "degraded", "reason": "collection_not_created"}
