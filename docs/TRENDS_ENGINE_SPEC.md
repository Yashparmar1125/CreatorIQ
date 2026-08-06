# CreatorIQ Trends Engine — Finalized Specification

**Version:** 1.0  
**Status:** Approved for implementation  
**Last updated:** 2026-03-06  
**Depends on:** Onboarding pipeline (`docs/ONBOARDING_PIPELINE_PLAN.md`)

---

## 1. Product Definition

CreatorIQ Trends Engine v1 is a **credit-gated, Top-5 Content Opportunity Feed** that helps YouTube creators discover actionable content opportunities personalized to their channel.

### Core principles

| Principle | Decision |
|-----------|----------|
| Output | Top **5** curated opportunities per feed |
| Primary signal | **YouTube content momentum** (weighted higher than search) |
| Personalization | Onboarding niche → channel analysis over time |
| Geography | **YouTube audience geography** (weighted), not device location |
| Niche scope | **Strictly within niche** — no generic viral crossover |
| Ranking goal | **Maximum popularity within niche** |
| UX | Lightweight cards + deep detail page |
| Refresh | **Credit-based** with freshness guarantee |
| Architecture | **Hybrid**: background ingestion + on-demand AI enrichment |

---

## 2. Ranking Priority (locked)

1. Trending on YouTube (video velocity — highest weight)
2. Fast-rising trends
3. High search volume
4. Fits creator's existing audience
5. Recent news (context only)
6. Relevant to creator's niche
7. Geographic relevance (audience-weighted)

**Goal:** Maximum popularity **after** niche relevance is confirmed.

---

## 3. Data Source Strategy

### Implementation priority

| Priority | Source | Role |
|----------|--------|------|
| 1 | YouTube Search / Related Videos | Primary momentum signal |
| 2 | Google Trends (`gprop=youtube`) | Corroboration + growth |
| 3 | Google News | "Why now" context only |
| 4 | Reddit | v1.1 |
| 5 | X (Twitter) | v1.1 |

### YouTube signal definition (F1)

**Both**, with B weighted higher:

- Rising YouTube search interest
- Fast-growing videos in creator's niche

**v1 approach (B-lite):** search velocity, competitor channels, high-performing niche videos. Full trending-tab replication deferred.

---

## 4. Personalization Model

### Niche source of truth (F3)

**Onboarding + auto-refined over time**

| Stage | Source |
|-------|--------|
| Initial | Onboarding niche selections |
| After YouTube connect | Channel video/topic analysis becomes primary |
| Ongoing | Re-refine weekly or on new uploads |

### Niche fit rules (F4)

- No gaming/entertainment crossover unless **strong direct relationship** to creator niche
- Hard gate: `niche_fit_score < 0.65` → reject

### Refinement thresholds

| Videos on channel | Behavior |
|-------------------|----------|
| 0 (new) | **Manual profile only** — onboarding wizard, no channel analysis |
| 1–4 | Manual primary; analysis available via **Profile → Reconfigure** |
| 5–19 | User confirms Reconfigure → 50/50 blend manual + inferred |
| 20+ | User confirms Reconfigure → channel analysis primary |

**Onboarding runs once.** Profile updates after that go through **Reconfigure** (shared Creator Context Pipeline). Auto-apply is never silent — user always confirms the diff.

---

## 5. Geography Model (F5, F6)

### Scoring

```
geo_weighted_relevance = Σ (audience_geo_weight[country] × concept.geo_strength[country])
```

Example: US 60%, IN 30%, UK 10% → trends scored proportionally.

### Fallback chain

1. YouTube Analytics audience geography (when available)
2. Onboarding target country (weight 1.0)
3. Global default: US 55%, IN 35%, UK 10%

Show UI badge when using fallback: *"Using estimated geography — analytics will improve recommendations."*

---

## 6. Scoring Formula

### Global momentum (background)

```
RAW_MOMENTUM =
  0.40 × youtube_video_velocity
+ 0.15 × youtube_search_velocity
+ 0.15 × competitor_coverage
+ 0.15 × google_trends_youtube_growth
+ 0.10 × search_volume_normalized
+ 0.05 × news_recency_boost (capped)
```

### Personalized opportunity score (on refresh)

```
OPPORTUNITY_SCORE =
  0.50 × RAW_MOMENTUM
+ 0.25 × niche_fit_score
+ 0.20 × geo_weighted_relevance
+ 0.05 × channel_format_fit
```

### Hard filters

- `niche_fit < 0.65` → drop
- Generic news/politics classifier → drop
- `lifecycle = expired` → drop
- `geo_weighted_relevance < 0.20` → drop (except global fallback mode)

---

## 7. Trend Concept Model

```
TrendConcept {
  id, canonical_title, aliases[], niche_tags[]
  geo_strength: { US: 0.9, IN: 0.5 }
  lifecycle: emerging | growing | peaking | declining | expired
  sources: [youtube_video, youtube_search, google_trends, news]
  first_seen_at, last_signal_at
}
```

**Duplicate handling:** Merge into one concept (embedding similarity > 0.85, shared query clusters, shared news events).

---

## 8. Feed & Credits

### Monthly credits (F7)

| Plan | Refreshes/month |
|------|-----------------|
| Free | 2 |
| Pro | 20 |
| Agency | 100 |

### Actions

| Action | Credits |
|--------|---------|
| View latest feed | 0 |
| Refresh feed | 1 |
| View trend detail | 0 |
| Add to planner | 0 |
| "I made this" | 0 |

### Freshness guarantee (F8)

On refresh: **≥3 of Top 5 must be new** vs previous snapshot (when eligible pool allows). Max 2 repeats.

### Feed history

Persist `trend_feed_snapshots` — users can browse past feeds for free.

### First feed

**1 free feed** generated on onboarding complete (no credit consumed).

---

## 9. AI Enrichment (F9, F10)

### Card (feed)

- Trend title
- Short explanation
- Why it's trending
- Trend score (0–100)
- One key indicator

Title ideas → **detail page only**.

### Segment caching

Shared by: `{niche_cluster, geo_primary, channel_size_tier, tone}`

Per-user light personalization: channel name, subs, format preference.

---

## 10. Architecture

```
BACKGROUND (4–6h cron, no credits)
  → Collectors (YouTube, Google Trends, News)
  → Normalize → Merge concepts → Store signals → Pre-score

USER PROFILE (continuous)
  → CreatorNicheProfile + audience_geo + channel_baseline

ON REFRESH (1 credit)
  → Filter → Score → Freshness check → Top 5 → AI enrich → Save snapshot

SUCCESS TRACKING (v1)
  → Planner integration + manual "I made this"
```

---

## 11. Success Metrics

| Metric | Target (initial) |
|--------|------------------|
| On-niche precision (manual sample) | >90% |
| Post-refresh trust score | >4/5 |
| Trends → Planner conversion | >15% |
| "I made this" rate | >10% |
| Video performance lift vs baseline | >1.3× |

---

## 12. Deprecations (current code)

- `google_trends_trending_now` as primary source
- Hardcoded `geo=IN`
- Per-request SerpApi fan-out in `list_trends`
- Template archetype growth tips
- Hash-based saturation/stability
- 20-item unpaginated feed

---

## 13. Implementation Phases

| Phase | Focus | Depends on |
|-------|-------|------------|
| **0** | Onboarding pipeline + CreatorProfile | — |
| **1** | YouTube collectors + concept store + Top 5 (free) | Phase 0 |
| **2** | AI enrichment + feed history + detail page | Phase 1 |
| **3** | Credits + planner + success tracking | Phase 2 |
| **4** | Reddit/X + advanced ML | Phase 3 |

---

## 14. Locked defaults (G1–G4)

| Decision | Default |
|----------|---------|
| G1 Scale | Per-niche-cluster collectors (not per-user) |
| G2 Taxonomy | Fixed onboarding taxonomy v1 |
| G3 Video thresholds | 5 = blend, 20 = channel-primary |
| G4 First feed | Free on onboarding complete |

---

## Related documents

- `docs/ONBOARDING_PIPELINE_PLAN.md` — Phase 0 implementation (start here)
- `docs/CODEBASE_ANALYSIS.md` — Full codebase audit
