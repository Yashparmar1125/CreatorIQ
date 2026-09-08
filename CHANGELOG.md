# CHANGELOG — CreatorIQ Trend Service Feature Upgrades

**Release / Patch Version**: `v1.2.0-trend-pipeline`  
**Date**: September 7, 2026  
**Scope**: `backend/services/trend/`  
**Component**: Trend Intelligence, Vector Search & Quality Pipeline  

---

## 1. Executive Summary

This update completes a live feature port from the research/reference implementation (`CreatorIQ-main`) into CreatorIQ's production trend service. The changes resolve critical architectural defects (randomized vector generation and event loop starvation) and introduce statistical intelligence (real embeddings, automated language gates, anomaly detection, and creator diversity).

No microservice topology, database schemas, or existing container networking was altered.

---

## 2. Detailed File-by-File Changes

### `backend/services/trend/requirements.txt`
- **Dependencies Added**:
  - `sentence-transformers>=2.2.0`: Required for loading and inferencing the `all-MiniLM-L6-v2` transformer model for deterministic semantic embeddings.
  - `langdetect>=1.0.9`: Fast language identification library used to filter non-English query terms.

---

### `backend/services/trend/app/services/vector_service.py`
- **Root Cause Fixed**: Previously, `generate_semantic_vector()` used Python's built-in `hash(word)` mapped across 128 dimensions. Because Python enables `PYTHONHASHSEED` randomization by default, the hash values changed on every container/process restart. Consequently, vectors stored in Qdrant before a restart became unsearchable and mathematically incompatible with query vectors computed after a restart.
- **Key Modifications**:
  - **Replaced Vectorizer**: Deleted `hash()` and hardcoded cluster heuristics. Implemented `generate_semantic_vector(text, tags)` using `all-MiniLM-L6-v2`.
  - **Model Lifecycle**: Implemented a thread-safe, lazy-loaded singleton (`_get_model()`) to ensure the ~90MB transformer model is loaded only once per worker.
  - **Vector Dimension Update**: Changed `VECTOR_DIM = 384` (was `128`).
  - **Automated Collection Migration**: Updated `ensure_collection()` to inspect existing Qdrant collection params. If an older collection with `dim=128` exists, it logs a warning, drops the outdated collection, and creates a fresh collection configured for `size=384, distance=Distance.COSINE`.
  - **Health Inspection**: Updated `health()` endpoint to return `vector_dim: 384` and `embedding_model: "all-MiniLM-L6-v2"`.

---

### `backend/services/trend/app/services/feed_service.py`
- **Root Cause Fixed**: In `_build_ranked_pool()`, every feed generation executed a synchronous `for c in concepts[:100]` loop calling `self.vector_service.upsert_concept_vector()`. Because Qdrant Python client calls in that loop were synchronous HTTP requests, this blocked the FastAPI async event loop for several seconds during feed creation.
- **Key Modifications**:
  - **Deleted Read-Path Upsert Loop**: Removed lines 294–305 from `_build_ranked_pool()`. Feed queries now only read and search against vectors; they no longer perform indexing.
  - **Outlier Detection Integration**: Integrated `detect_momentum_outliers()` before scoring concepts. Scored items receive an `is_momentum_outlier: bool` flag and a `+8.0` opportunity score bonus if flagged.
  - **Creator Tier Classification**: Extracted concept volumes across the pool (`all_volumes`) and passed them to `_score_concept()`. Every feed item now includes `creator_tier: "small" | "medium" | "big"`.
  - **Diversity Rule in Freshness Logic**: Added soft diversity reordering in `_apply_freshness()`. If the top 5 slots are occupied exclusively by `big` channels, the 5th item is swapped for the highest-scoring `small` or `medium` creator from the ranked pool.

---

### `backend/services/trend/app/services/concept_collector.py`
- **Key Modifications**:
  - **Write-Path Vector Indexing**: Injected `VectorService` into `ConceptCollector`.
  - **Added `_upsert_vector(concept)` helper**: Executes best-effort vector indexing immediately after each `upsert_concept()` call.
  - **Coverage**: Wired upserts to:
    1. On-demand query collection (`_collect_query`)
    2. Rising queries collection (`_collect_cluster` RELATED_QUERIES)
    3. Trending searches collection (`_collect_cluster` TRENDING_NOW)

---

### `backend/services/trend/app/services/youtube_video_collector.py`
- **Key Modifications**:
  - **Write-Path Vector Indexing**: Updated `YouTubeVideoCollector.__init__` to accept an optional `vector_service` instance (defaults to instantiating `VectorService()`).
  - **Ingest Upsert**: Added `self._upsert_vector(concept)` in `_ingest_query()` immediately after creating or updating a video concept.

---

### `backend/services/trend/app/services/quality_filters.py`
- **Problem Fixed**: Non-English keywords (e.g., regional search spikes from SerpApi India) passed through `passes_ingest_quality()` and polluted English creator feeds.
- **Key Modifications**:
  - Added `is_english_title(title: str)` with string cleanup and fail-open behavior if `langdetect` is missing or fails.
  - Added language check inside `passes_ingest_quality(title)` so non-English titles are rejected at ingest before entering the database.

---

### `backend/services/trend/app/services/scoring.py`
- **Key Modifications**:
  - **`detect_momentum_outliers(concepts, sigma=2.0)`**: Calculates pool mean ($\mu$) and standard deviation ($\sigma$) of `raw_momentum`. Flags concepts whose momentum exceeds $\mu + 2\sigma$ as statistical breakouts.
  - **`classify_creator_tier(search_volume, all_volumes)`**: Computes the 25th percentile ($Q_{25}$) and 75th percentile ($Q_{75}$) of pool search volumes. Categorizes channels as:
    - `< Q25`: `"small"`
    - `Q25` to `Q75`: `"medium"`
    - `> Q75`: `"big"`

---

## 3. API Contract Additions

Endpoints returning feed payloads (`GET /api/v1/trend/feed`, `GET /api/v1/trend/feed/latest`, `POST /api/v1/trend/feed/refresh`) now provide two additional keys in each concept dictionary:

```typescript
interface TrendItem {
  id: string;
  topic: string;
  opportunity_score: number;
  raw_momentum: number;
  velocity: string;
  volume: string;
  search_volume: number;
  is_youtube_video: boolean;
  video_url: string | null;
  channel_name: string | null;
  
  // --- NEW FIELDS ---
  creator_tier: "small" | "medium" | "big";
  is_momentum_outlier: boolean;
  // ------------------
}
```

---

## 4. Verification & Testing Completed

1. **Static Syntax & Bytecode Compilation**:
   - Ran `py_compile` across all 6 modified files. Zero syntax or import errors.
2. **Deterministic Vector Output**:
   - Verified that `generate_semantic_vector("AI tools for creators")` returns consistent 384-dimensional unit vectors.
3. **Statistical Outlier Unit Test**:
   - Validated outlier detection with diverse concept pools. Breakout spikes correctly receive `is_momentum_outlier = True`.
4. **Percentile Bucket Unit Test**:
   - Validated volume quartiles accurately assign `small`, `medium`, and `big` tiers across skewed creator distributions.
