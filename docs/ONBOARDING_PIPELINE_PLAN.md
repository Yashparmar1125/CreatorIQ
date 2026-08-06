# Onboarding Pipeline — Implementation Plan

**Version:** 1.1  
**Status:** Ready to implement  
**Last updated:** 2026-03-06  
**Blocks:** Trends Engine Phase 1 (`docs/TRENDS_ENGINE_SPEC.md`)

### Product decision (locked)

| Channel state | First-time setup | Ongoing updates |
|---------------|------------------|-----------------|
| **New** | **Manual profile** via onboarding wizard (niche, format, tone, country) | Auto-prompt or Profile → **Reconfigure** once channel is established |
| **Emerging / Established** | Onboarding wizard + **channel analysis** enriches profile | Profile → **Reconfigure** re-runs context pipeline anytime |

**Onboarding runs once.** **Reconfigure** is the reusable pipeline for profile updates after that.

---

## 1. Why onboarding comes first

The Trends Engine cannot personalize without a reliable **Creator Profile**. Every downstream system reads from this profile:

| Consumer | Needs from onboarding |
|----------|----------------------|
| Trends Engine | Niche vector, geo weights, format, tone, channel maturity |
| Strategy | Niche, tone, format, channel baseline |
| Analytics | Channel ID, audience geo fallback |
| Planner | Posting frequency, format preference |
| Credit system | Plan tier, onboarding completion trigger for free feed |

**If onboarding is wrong or incomplete, trends will stay generic.**

---

## 2. Current state (gaps)

### What works today

- 5-step wizard UI (`OnboardingWizard.tsx`)
- `PATCH /auth/onboarding/complete` saves niche, format, frequency, tone, country on `users` table
- Google OAuth + essential YouTube sync (`auth_service._sync_essential`)
- Deep sync attempts topic/video analysis (`auth_service._sync_deep`)
- Channel upsert to `channels` table

### Critical bugs / gaps

| Issue | Location | Impact |
|-------|----------|--------|
| Frontend calls non-existent `GET /internal/channels/me` | `onboardingStore.ts:74` | Channel never loads in onboarding |
| Deep sync sends partial payload (no `youtube_channel_id`) | `auth_service._sync_deep` | Deep sync upsert likely fails |
| User prefs on `users` table; channel prefs on `channels` table — **not synced** on complete | auth + channel services | Trends reads channel; onboarding writes user |
| Tone mismatch: UI `Educational/Magnetic/Expert/Casual` vs enum `educational/entertaining/...` | `PreferencesStep.tsx` | Wrong tone stored |
| Format mismatch: `long-form` vs `long_form` | onboarding → channel | Format filter breaks |
| OAuth users **auto-skip** Connect step | `OnboardingWizard.tsx:54-57` | May skip without YouTube channel |
| No `CreatorProfile` / maturity model | — | New vs established channels treated same |
| No audience geography capture | — | Trends geo weighting impossible |
| `content_formats` never set on channel create | `channel_repository.py:77` | Empty array default |
| No analysis status / progress UI | — | User doesn't know sync state |

---

## 3. Target: Creator Profile output

Onboarding must produce this artifact (stored, queryable by all services):

```json
{
  "user_id": "uuid",
  "channel_id": "uuid | null",
  "onboarding_completed_at": "timestamp",

  "profile_maturity": "new | emerging | established",
  "analysis_confidence": 0.0,

  "niches": {
    "onboarding_selected": ["Tech", "Education"],
    "inferred_from_channel": ["AI", "Productivity"],
    "effective": ["Tech", "Education"],
    "source": "onboarding | blended | channel_primary"
  },

  "content_format": "long_form | shorts | both",
  "posting_frequency": "daily | weekly | ...",
  "tone": "educational | entertaining | ...",

  "geo": {
    "source": "youtube_analytics | onboarding_country | global_default",
    "target_country": "United States",
    "audience_weights": { "US": 0.6, "IN": 0.3, "UK": 0.1 }
  },

  "channel_stats": {
    "subscriber_count": 0,
    "video_count": 0,
    "view_count": 0,
    "avg_views_recent": null,
    "engagement_rate": null
  },

  "sync_status": "pending | essential_complete | analysis_complete | analysis_limited"
}
```

---

## 4. Channel maturity model

### Profile maturity tiers

| Tier | Criteria | `analysis_confidence` |
|------|----------|----------------------|
| **new** | 0 videos OR channel created < 30 days ago OR < 100 total views | 0.2–0.4 |
| **emerging** | 1–19 videos OR subs < 1,000 | 0.4–0.7 |
| **established** | 20+ videos AND subs ≥ 1,000 (or 10k+ views) | 0.7–1.0 |

### What changes per tier

| Aspect | New channel | Emerging | Established |
|--------|-------------|----------|-------------|
| First-time setup | **100% manual** (wizard only) | Manual + channel analysis enriches | Manual + channel analysis drives profile |
| Niche source | **Manual selections only** | Blended | Channel analysis primary |
| Detected niches from YT | **Not used** at onboarding | Pre-select if match | Pre-select + allow edit |
| Audience geo | Manual target country only | Partial analytics if any | YouTube Analytics geography |
| Video analysis at onboarding | **Skipped** | Run analysis pipeline | Run full analysis pipeline |
| Ongoing updates | Profile → **Reconfigure** when ready | Profile → **Reconfigure** | Profile → **Reconfigure** |
| Trends feed quality banner | "Profile set manually — reconfigure when your channel grows" | "Based on your content + preferences" | Full personalization |
| Free initial trends feed | Yes — **manual-profile-weighted** | Yes — blended | Yes — full pipeline |

### New channel UX (0 videos) — manual profile only

**Do not block onboarding.** New creators are a valid segment. **Do not attempt channel analysis** — the user sets the profile manually.

1. **Connect YouTube** — required (ownership + enables future reconfigure)
2. **Niche step** — **mandatory manual selection** (no "DETECTED" badges; copy: *"Set your niche manually. Once your channel grows, use Reconfigure in Profile to auto-update from your content."*)
3. **Preferences** — required (format, tone, target country)
4. **Review step** — show `profile_maturity: new`, `profile_mode: manual`
5. **On complete** — `build_creator_profile(mode=manual)`; **no** video analysis job
6. **When channel becomes established** — in-app prompt: *"Your channel has enough data — Reconfigure your profile for better recommendations"*

### Established channel UX — analysis-assisted onboarding

1. Connect YouTube → essential + deep sync
2. Analysis step runs channel context pipeline (videos, topics, engagement)
3. Niche step — **pre-filled from analysis**, user confirms or edits
4. Preferences — pre-filled where inferable (format from video duration mix)
5. Review — show detected vs manual fields
6. On complete — `build_creator_profile(mode=analysis_assisted)`

### Profile → Reconfigure (post-onboarding, all users)

Available in **Settings / Profile** after `onboarding_completed = true`.

**Purpose:** Re-run the **Creator Context Pipeline** to refresh niche, geo, format, tone, and maturity — without repeating the full first-time onboarding wizard.

**When to show:**
- Always visible for established users
- Shown as CTA for new users once `profile_maturity` upgrades to `emerging` or `established`
- Optional manual trigger anytime ("My content focus changed")

**What Reconfigure does:**

```
POST /creator-profile/reconfigure
  → Refresh channel stats from YouTube
  → Re-classify profile_maturity
  → IF maturity != new:
       Run channel analysis (videos, topics, audience geo)
       Merge inferred data with existing manual selections
       Present diff for user confirmation (inline UI or short review modal)
  → ELSE (still new):
       Open manual edit form only (same fields as onboarding preferences)
  → Save creator_profiles + profile_history snapshot
  → Optionally invalidate trends feed cache (user may need refresh credit)
```

---

## 5. Two flows, one shared pipeline

### Shared backend: Creator Context Pipeline

Both **onboarding** and **reconfigure** call the same core service:

```
CreatorContextPipeline.run(
  user_id,
  mode: "onboarding" | "reconfigure",
  manual_input?: { niche, format, tone, frequency, country },
  run_analysis: bool,   # false for new channels at onboarding
)
```

| Step | Pipeline action |
|------|-----------------|
| 1 | Fetch latest channel stats (YouTube API) |
| 2 | Classify `profile_maturity` |
| 3 | If `run_analysis` → analyze videos, infer niches, fetch audience geo |
| 4 | Merge manual input + inferred data (maturity rules) |
| 5 | Upsert `creator_profiles` |
| 6 | Append `creator_profile_history` snapshot |
| 7 | Return profile diff for UI review |

### Flow A — First-time onboarding (runs once)

| Step | Name | New channel | Established channel |
|------|------|-------------|---------------------|
| 1 | Welcome | Set expectations for manual profile | Set expectations for smart setup |
| 2 | Connect YouTube | OAuth + essential sync | OAuth + essential sync |
| 2b | Analysis | **Skip** — show "New channel" | Run pipeline with `run_analysis=true` |
| 3 | Niche | **Manual only** | Pre-filled from analysis, editable |
| 4 | Preferences | Manual required | Pre-filled where possible |
| 5 | Review | `mode=manual` summary | Detected vs confirmed summary |
| 6 | Ready | `onboarding_completed=true` | `onboarding_completed=true` |

User **never** goes through Flow A again after completion.

### Flow B — Profile Reconfigure (repeatable)

**Entry:** Settings → Profile → **Reconfigure recommendations**

| Step | UI | Backend |
|------|-----|---------|
| 1 | Confirm / explain what will update | `POST /creator-profile/reconfigure/preview` |
| 2 | Show analysis progress (if established) | Pipeline with `mode=reconfigure` |
| 3 | Review changes (diff: old vs new niches, geo, maturity) | Return `profile_diff` |
| 4 | User confirms or edits | `PATCH /creator-profile` or confirm endpoint |
| 5 | Success toast + link to refresh trends | Profile history saved |

**New channel reconfigure:** Manual edit form only (no analysis until maturity ≠ new).

**Established channel reconfigure:** Full pipeline + diff review before apply.

### Connect step rules (fix auto-skip)

```
IF user.is_google_authenticated:
  → Still show Connect step
  → Auto-fetch /channels
  IF channel connected:
    → Show channel card + maturity badge
    → Enable Continue
  ELSE:
    → Prompt OAuth (may already have Google login; re-auth for YouTube scope)
    → Allow "I'll connect later" ONLY for email signup (not recommended; trends limited)

IF NOT connected at step 3:
  → Allow continue with warning banner
  → profile_maturity forced to onboarding-only mode
  → trends use onboarding niche + country only
```

**Recommendation:** YouTube connect **required** for full product value, but allow skip with degraded mode (no analytics geo, no video-inferred niche).

---

## 6. Backend implementation

### 6.1 New service module: Creator Profile

**Location:** `backend/services/channel/` (channel owns creator context)

**New table:** `creator_profiles`

```sql
creator_profiles (
  id                  UUID PK
  user_id             UUID UNIQUE NOT NULL
  channel_id          UUID FK nullable
  profile_maturity    ENUM(new, emerging, established)
  analysis_confidence NUMERIC(3,2)
  niches_onboarding   TEXT[]
  niches_inferred     TEXT[]
  niches_effective    TEXT[]
  niche_source        ENUM(onboarding, blended, channel_primary)
  content_format      ENUM(long_form, shorts, both)
  posting_frequency   VARCHAR(50)
  tone                ENUM(...)
  geo_source          ENUM(youtube_analytics, onboarding_country, global_default)
  geo_target_country  VARCHAR(100)
  audience_geo_weights JSONB  -- { "US": 0.6, ... }
  channel_stats       JSONB   -- snapshot at last analysis
  profile_mode        ENUM(manual, analysis_assisted)  -- how profile was last built
  sync_status         ENUM(pending, essential_complete, analysis_complete, analysis_limited)
  last_analyzed_at    TIMESTAMPTZ
  last_reconfigured_at TIMESTAMPTZ
  created_at, updated_at
)
```

**New table:** `creator_profile_history` (audit + reconfigure diff)

```sql
creator_profile_history (
  id              UUID PK
  user_id         UUID FK
  snapshot        JSONB NOT NULL       -- full profile at point in time
  trigger         ENUM(onboarding, reconfigure, scheduled, channel_growth)
  profile_diff    JSONB                -- what changed vs previous
  created_at      TIMESTAMPTZ
)
```

**New table:** `channel_video_analysis` (for niche inference)

```sql
channel_video_analysis (
  id            UUID PK
  channel_id    UUID FK
  video_id      VARCHAR(64)
  title         TEXT
  tags          TEXT[]
  inferred_topics TEXT[]
  analyzed_at   TIMESTAMPTZ
)
```

### 6.2 New endpoints

| Method | Path | Service | Purpose |
|--------|------|---------|---------|
| `GET` | `/channels/me` | channel | Primary channel + stats for onboarding UI |
| `GET` | `/channels/me/analysis-status` | channel | Poll sync/analysis progress |
| `POST` | `/channels/me/analyze` | channel | Trigger (re)analysis after onboarding |
| `GET` | `/creator-profile` | channel | Full profile for trends/strategy |
| `PATCH` | `/creator-profile` | channel | Manual profile edit (new channels) |
| `POST` | `/creator-profile/reconfigure/preview` | channel | Run pipeline, return proposed diff (no save) |
| `POST` | `/creator-profile/reconfigure` | channel | Apply pipeline + save history |
| `GET` | `/creator-profile/history` | channel | Past snapshots (optional UI) |
| `PATCH` | `/auth/onboarding/complete` | auth | **Orchestrate** — save user fields + call pipeline once |

Gateway routes: `creator-profile` under `/channels` or dedicated `/creator-profile` prefix.

### 6.3 Fix channel sync pipeline

**Task A — Fix deep sync upsert**

`auth_service._sync_deep` must include `youtube_channel_id` + core fields when patching, or call new `PATCH /internal/channels/{id}/analysis` endpoint instead of reusing upsert with partial body.

**Task B — Sync onboarding → channel on complete**

On `complete_onboarding`:

1. Save fields on `users` (keep for auth context)
2. Call `channel_service.build_creator_profile(user_id)`:
   - Map format: `long-form` → `long_form`, `hybrid` → `both`
   - Map tone: `Educational` → `educational`, `Magnetic` → `entertaining`, `Expert` → `authoritative`, `Casual` → `conversational`
   - Update `channels.content_formats` and `channels.tone`
   - Merge `users.niche` into `channels.niches`
   - Compute `profile_maturity` from `video_count`, `subscriber_count`, `view_count`
   - Set `niche_source` based on maturity rules
   - Build `audience_geo_weights` (see §6.4)
3. Queue `analyze_channel` background job if `video_count > 0`
4. Set `onboarding_completed = true`
5. Emit event / call trends service: `POST /internal/trends/seed-user-feed` (Phase 1)

**Task C — Video-based niche inference**

For channels with videos:

```python
def infer_niches_from_videos(videos: list[VideoMeta]) -> list[str]:
    # v1: keyword extraction from titles + tags
    # Map to fixed taxonomy (NICHES list in onboarding)
    # Return top 3 inferred topics with confidence scores
```

For 0 videos: return `[]`, `niche_source = onboarding`.

**Task D — Audience geography**

```
IF youtube_analytics.available AND views >= 1000:
    audience_geo_weights = normalize(analytics.geography)
    geo_source = youtube_analytics
ELIF onboarding.country:
    audience_geo_weights = { country_code: 1.0 }
    geo_source = onboarding_country
ELSE:
    audience_geo_weights = { US: 0.55, IN: 0.35, UK: 0.10 }
    geo_source = global_default
```

Requires YouTube Analytics API scope — verify OAuth scopes include `yt-analytics.readonly` (currently only `youtube.readonly` — **may need scope expansion**).

### 6.4 OAuth scope decision

| Scope | Current | Needed |
|-------|---------|--------|
| `youtube.readonly` | ✅ | Channel metadata, videos |
| `yt-analytics.readonly` | ❌ | Audience geography, performance baseline |

**Action:** Add `yt-analytics.readonly` to OAuth scope list in `auth_service.google_oauth_build_url`. Existing users re-auth on next connect.

For **new channels** without analytics: onboarding country fallback (no blocker).

---

## 7. Frontend implementation

### 7.1 Fix immediate bugs

| File | Change |
|------|--------|
| `onboardingStore.ts` | `GET /channels` instead of `/internal/channels/me` |
| `OnboardingWizard.tsx` | Remove blind auto-skip of Connect step |
| `PreferencesStep.tsx` | Align tone/format values with backend enums |
| `ConnectStep.tsx` | Add maturity badge (New / Emerging / Established) |
| `ConnectStep.tsx` | Replace generic "Healthy" with sync status |

### 7.2 New UI components

| Component | Purpose |
|-----------|---------|
| `AnalysisStatusStep.tsx` | Poll `/channels/me/analysis-status` after connect |
| `ProfileReviewStep.tsx` | Summary before complete: niche, geo source, maturity |
| `MaturityBadge.tsx` | Visual indicator for new/emerging/established |
| `NewChannelBanner.tsx` | Explains limited analysis, onboarding drives recs |

### 7.3 Onboarding store additions

```typescript
interface OnboardingState {
  // existing fields...
  profileMaturity: 'new' | 'emerging' | 'established' | null;
  analysisStatus: 'pending' | 'essential_complete' | 'analysis_complete' | 'analysis_limited';
  analysisConfidence: number;
  pollAnalysisStatus: () => Promise<void>;
}
```

### 7.4 Post-complete

- Redirect to `/app/trends` (not dashboard) with "Generating your first opportunities..." state
- Or dashboard with CTA to trends when free feed ready

---

## 8. Implementation phases & tasks

### Sprint 1 — Fix broken path (2–3 days)

**Goal:** Onboarding reliably connects channel and saves consistent data.

- [ ] **B1** Fix `onboardingStore.fetchChannels` → `GET /channels`
- [ ] **B2** Fix deep sync — new `PATCH /internal/channels/{id}/analysis` endpoint
- [ ] **B3** Map tone/format enums on `complete_onboarding`
- [ ] **B4** Sync user onboarding fields → `channels` table (format, tone, niches)
- [ ] **B5** Remove Connect step auto-skip for Google OAuth users
- [ ] **B6** Add `GET /channels/me` convenience endpoint (alias primary channel)

**Acceptance criteria:**
- OAuth user sees connected channel in step 2
- `channels.content_formats` and `channels.tone` populated after onboarding
- Deep sync completes without error in logs

---

### Sprint 2 — Creator Profile + maturity (3–4 days)

**Goal:** Every completed onboarding produces a queryable Creator Profile.

- [ ] **P1** Migration: `creator_profiles` table
- [ ] **P2** `build_creator_profile()` service method
- [ ] **P3** Maturity classifier (`new` / `emerging` / `established`)
- [ ] **P4** `GET /creator-profile` endpoint (gateway routed)
- [ ] **P5** Geo fallback builder (onboarding country → global default)
- [ ] **P6** Wire `complete_onboarding` to profile build
- [ ] **P7** Frontend: maturity badge + new channel banner on Connect step
- [ ] **P8** Frontend: Profile Review step before Ready

**Acceptance criteria:**
- `GET /creator-profile` returns full profile after onboarding
- 0-video channel → `profile_maturity: new`, `niche_source: onboarding`
- 50-video channel → `profile_maturity: established`, inferred niches populated

---

### Sprint 3 — Channel analysis pipeline (3–4 days)

**Goal:** Auto-refine niche from video content; prepare for trends.

- [ ] **A1** Migration: `channel_video_analysis` table
- [ ] **A2** `analyze_channel_videos()` — fetch up to 50 videos, extract title/tags
- [ ] **A3** Niche inference from titles/tags → taxonomy mapping
- [ ] **A4** `GET /channels/me/analysis-status` + background job
- [ ] **A5** Frontend Analysis Status step (spinner → complete/limited)
- [ ] **A6** Re-analysis scheduler: 7 days after onboarding OR on manual sync
- [ ] **A7** Update `get_user_channel_context` to read from `creator_profiles`

**Acceptance criteria:**
- Channel with 10 tech videos → `niches_inferred` includes Tech
- Analysis status visible in onboarding UI
- Trends service can read `creator_profiles` instead of ad-hoc channel fetch

---

### Sprint 4 — Analytics geo + OAuth scope (2–3 days)

**Goal:** Audience geography from YouTube when available.

- [ ] **G1** Add `yt-analytics.readonly` OAuth scope
- [ ] **G2** Fetch audience geography in deep sync / analyze job
- [ ] **G3** Store in `creator_profiles.audience_geo_weights`
- [ ] **G4** Migration: `audience_snapshots` write path (table exists, unused)
- [ ] **G5** UI: show geo source in Profile Review ("Based on your audience" vs "Based on your target country")

**Acceptance criteria:**
- Established channel with analytics → real geo weights
- New channel → onboarding country fallback, UI explains why

---

### Sprint 5 — Profile Reconfigure (2–3 days)

**Goal:** Established users can refresh profile without repeating onboarding.

- [ ] **R1** Extract `CreatorContextPipeline` shared service (onboarding + reconfigure)
- [ ] **R2** `POST /creator-profile/reconfigure/preview` — returns `profile_diff`
- [ ] **R3** `POST /creator-profile/reconfigure` — apply + history snapshot
- [ ] **R4** `PATCH /creator-profile` — manual edit for new channels
- [ ] **R5** Frontend: Settings/Profile page with Reconfigure button
- [ ] **R6** Frontend: `ReconfigureReviewModal` — diff UI (old vs new niches, geo, maturity)
- [ ] **R7** Growth detection job → banner CTA (not auto-apply)
- [ ] **R8** After reconfigure: prompt to refresh trends feed (credit-aware)

**Acceptance criteria:**
- New channel user can manually edit profile in Settings without analysis
- Established user Reconfigure shows detected niche changes before apply
- `creator_profile_history` records every reconfigure
- Onboarding wizard does not reappear after `onboarding_completed`

---

## 9. New channel — end-to-end flow

```
User signs up
  → Step 1 Welcome (set expectations for new creators)
  → Step 2 Connect YouTube
       → Essential sync: video_count=0, subs=0
       → UI: "New Channel Detected — we'll use your preferences until you publish"
  → Step 2b Analysis (fast)
       → sync_status: analysis_limited
       → No video analysis run
  → Step 3 Niche (REQUIRED manual pick — no detected badges)
  → Step 4 Preferences (target country REQUIRED — becomes geo fallback)
  → Step 5 Review
       → Shows: maturity=new, niche source=onboarding, geo source=onboarding_country
  → Step 6 Complete
       → build_creator_profile()
       → Queue: check-again-in-7-days job
       → Redirect to trends with onboarding-weighted free feed (Phase 1)
```

### When new creator publishes first videos

**Do not auto-overwrite manual profile.** Notify and let user choose Reconfigure.

```
Scheduled job detects video_count: 0 → 3+
  → profile_maturity: new → emerging (classification only)
  → niches_inferred populated in background (not applied)
  → In-app banner: "Your channel is growing — Reconfigure your profile for smarter recommendations"
  → User opens Profile → Reconfigure
  → Pipeline preview shows diff (manual niches vs detected)
  → User confirms → profile updated, niche_source → blended
```

Auto-reconfigure is **off by default** — user always confirms the diff.

---

## 10. API contract: `GET /creator-profile`

Response shape for trends/strategy consumers:

```json
{
  "data": {
    "user_id": "...",
    "channel_id": "...",
    "profile_maturity": "new",
    "analysis_confidence": 0.35,
    "niches": {
      "effective": ["Tech", "Education"],
      "onboarding_selected": ["Tech", "Education"],
      "inferred": [],
      "source": "onboarding"
    },
    "content_format": "both",
    "tone": "educational",
    "posting_frequency": "weekly",
    "geo": {
      "source": "onboarding_country",
      "target_country": "India",
      "audience_weights": { "IN": 1.0 }
    },
    "channel_stats": {
      "subscriber_count": 0,
      "video_count": 0,
      "view_count": 0
    },
    "sync_status": "analysis_limited"
  }
}
```

---

## 11. Testing checklist

### Unit tests

- [ ] Maturity classifier: 0 videos → `new`
- [ ] Maturity classifier: 5 videos, 200 subs → `emerging`
- [ ] Maturity classifier: 25 videos, 5k subs → `established`
- [ ] Tone/format mapping from UI values
- [ ] Geo fallback chain
- [ ] Niche blend: 10 videos → 50/50 onboarding + inferred

### Integration tests

- [ ] OAuth → essential sync → channel row created
- [ ] complete_onboarding → creator_profile row created
- [ ] Deep sync with videos → niches_inferred populated
- [ ] 0-video channel → analysis_limited, no crash

### Manual QA scenarios

| Scenario | Expected |
|----------|----------|
| Brand new YT channel (0 videos) | Onboarding completes; maturity=new; manual niche required |
| Channel with 50 tech videos | Detected niches pre-filled; maturity=established |
| Skip YouTube connect | Degraded profile; warning shown; onboarding-only trends |
| Google OAuth signup | Still sees Connect step; channel loads |
| India target country, no analytics | geo weights `{ IN: 1.0 }` |
| New channel → 10 videos published | Banner prompts Reconfigure; profile unchanged until user confirms |
| Established user Reconfigure | Diff shown; profile updates on confirm; history row created |
| Reconfigure on still-new channel | Manual edit form only; no video analysis |

---

## 12. File change map

### Backend

```
backend/services/channel/
  app/models/creator_profile_models.py     [NEW]
  app/repositories/creator_profile_repository.py [NEW]
  app/services/creator_profile_service.py  [NEW]
  app/services/channel_analysis_service.py [NEW]
  app/api/v1/endpoints/channel.py          [MODIFY]
  migrations/versions/xxxx_creator_profiles.py [NEW]

backend/services/auth/
  app/services/auth_service.py             [MODIFY] deep sync, complete orchestration
  app/api/v1/endpoints/auth.py             [MODIFY] if needed

backend/services/api-gateway/
  app/core/routing.py                      [MODIFY] if creator-profile route needed
```

### Frontend

```
frontend/src/features/onboarding/
  stores/onboardingStore.ts                [MODIFY]
  components/OnboardingWizard.tsx          [MODIFY]
  components/steps/ConnectStep.tsx         [MODIFY]
  components/steps/AnalysisStatusStep.tsx  [NEW]
  components/steps/ProfileReviewStep.tsx   [NEW]
  components/MaturityBadge.tsx             [NEW]

frontend/src/features/profile/             [NEW — Sprint 5]
  pages/ProfileSettingsPage.tsx            [NEW]
  components/ReconfigureReviewModal.tsx    [NEW]
  components/ManualProfileForm.tsx         [NEW]
  components/ProfileGrowthBanner.tsx       [NEW]
  stores/useCreatorProfileStore.ts         [NEW]
```

---

## 13. Locked decisions

| # | Decision | Answer |
|---|----------|--------|
| D1 | New channel profile setup | **Manual only** at onboarding |
| D2 | Established channel updates | **Profile → Reconfigure** (re-runs context pipeline) |
| D3 | Auto-apply when channel grows | **No** — notify + user confirms via Reconfigure |
| D4 | Onboarding repeat | **Never** after `onboarding_completed` |
| D5 | `yt-analytics.readonly` scope | Sprint 4 |
| D6 | Post-onboarding redirect | Trends (free feed) |
| D7 | Reconfigure costs AI credit? | **No** for profile update; trends refresh still costs 1 credit |

---

## 14. Definition of done (onboarding pipeline)

Onboarding pipeline is **complete** when:

1. Every user who finishes onboarding has a `creator_profiles` row
2. New channels (0 videos) complete successfully with `maturity=new`
3. Established channels get inferred niches from video analysis
4. `GET /creator-profile` is the single source of truth for trends/strategy
5. Geo fallback chain works without YouTube Analytics
6. All enum mismatches fixed (tone, format)
7. Frontend no longer calls broken `/internal/channels/me`
8. Integration tests cover new/emerging/established paths
9. Profile Reconfigure works for established users with diff review
10. New channels stay manual until user explicitly Reconfigures after growth

**Then** proceed to Trends Engine Phase 1 (collectors + Top 5 feed).

---

## Related documents

- `docs/TRENDS_ENGINE_SPEC.md` — Full trends product spec
- `docs/CODEBASE_ANALYSIS.md` — Codebase audit
