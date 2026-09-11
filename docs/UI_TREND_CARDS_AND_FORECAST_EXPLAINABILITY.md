# CreatorIQ: UI Trend Cards, Expectancy Metrics & Prophet Chart Viva Guide

**Target Audience:** Technical Interviewers, System Evaluators, and Viva Examiners  
**Scope:** Frontend Data Visualization, Trend Card Anatomy, The 3 Expectancy Metrics above the forecast graph, Mathematical View Estimation formulas, and SVG Chart rendering of Prophet Bayesian intervals.

---

## Table of Contents
1. [Trend Card Elements & Anatomical Breakdown](#1-trend-card-elements--anatomical-breakdown)
   - [Visual Layout](#visual-layout)
   - [Component Elements & Meaning](#component-elements--meaning)
   - [Opportunity Score ("Fit Pill") Calculation](#opportunity-score-fit-pill-calculation)
   - [Creator Tiering Logic](#creator-tiering-logic)
2. [The 3 Expectancy Metrics Above the Prophet Graph](#2-the-3-expectancy-metrics-above-the-prophet-graph)
   - [Visual Layout](#visual-layout-1)
   - [Metric 1: Estimated Views & Format Breakdown](#metric-1-estimated-views--format-breakdown)
   - [Metric 2: Optimal Publishing Window & Urgency](#metric-2-optimal-publishing-window--urgency)
   - [Metric 3: Reach Multiplier & Algorithmic Discovery](#metric-3-reach-multiplier--algorithmic-discovery)
3. [The Prophet Graph Visualization (Interactive SVG)](#3-the-prophet-graph-visualization-interactive-svg)
   - [Visual Representation](#visual-representation)
   - [What the User Sees on the Graph](#what-the-user-sees-on-the-graph)
   - [The 95% Bayesian Credible Interval Corridor](#the-95-bayesian-credible-interval-corridor)
   - [28-Point Downsampling Architecture](#28-point-downsampling-architecture)
   - [Transparent Calculation Model Accordion](#transparent-calculation-model-accordion)
4. [Summary Cheatsheet for Viva Presentation](#4-summary-cheatsheet-for-viva-presentation)

---

# 1. Trend Card Elements & Anatomical Breakdown

### Visual Layout
```
┌───────────────────────────────────────────────────────────────────────────┐
│ [Tech] [AI]  [Viral Breakout]  [88% Vector Match]            [88 Fit Pill]│
│                                                                           │
│  "Cursor AI Agent Workflows"                                              │
│  The ultimate AI coding agent taking over developer YouTube               │
│  Source: Fireship · Watch [↗]                                             │
│                                                                           │
│  ┌─ Video Concept Highlight ───────────────────────────────────────────┐  │
│  │ ✨ VIDEO CONCEPT                    [🎬 Shorts] [📋 Copy Concept]    │  │
│  │ "I let Cursor AI build my entire startup in 24 hours..."            │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  💡 Why Predicted: High search momentum in AI + 88% similarity to your tone│
│  🎯 Action Plan: Publish a 60s comparison before market saturation        │
│                                                                           │
│  Velocity: +48%           Reach: 850K Searches      Stability: 72%        │
│  [💡 Generate Strategy]                             [🔖 Save Trend]       │
└───────────────────────────────────────────────────────────────────────────┘
```

### Component Elements & Meaning
When an examiner asks: *"Walk me through the trend card and what each piece of data represents"*, break it down as follows:

1. **Header Badges:**
   - **Niche Tags:** (e.g., `Tech`, `AI`) — Primary content taxonomy clusters.
   - **Archetype:** (e.g., `Viral Breakout`, `Steady Compounder`, `Early Adopter`) — Describes trend behavior dynamics.
   - **Vector Match Badge:** (e.g., `88% Vector Match`) — Displays the cosine similarity score between the creator's profile and the concept vector in Qdrant.
   - **Fit Pill:** (e.g., `88 Fit`) — The final multi-attribute Opportunity Score (0 to 100).
2. **Title & Headline:**
   - Canonical trend topic (cleaned and normalized) plus an AI-curated headline summarizing the news hook.
3. **Source Channel & Direct YouTube Link:**
   - If harvested from live YouTube video velocity, displays the channel name (e.g., *Fireship*) and a direct link to the source video (`Watch source ↗`).
4. **Video Concept Highlight Box:**
   - An actionable, high-CTR content hook (e.g., *"I let Cursor AI build my startup in 24 hours"*).
   - Includes format indicator (`Shorts` vs `Video`) and an interactive **Copy Concept** button.
5. **"Why Predicted" & "Action Plan":**
   - Algorithmic explanation of creator-audience overlap.
   - Immediate tactical publishing advice.
6. **Bottom Stat Metrics:**
   - **Velocity:** Real-time speed indicator (e.g., `+48%` or `56K views/hr`).
   - **Reach:** Estimated monthly query volume (e.g., `850K`).
   - **Stability:** Score (0–100%) indicating if the trend is long-term sustainable vs. volatile.
7. **Action Triggers:**
   - **Strategy Button:** Dispatches the trend ID to the LLM Strategy Service (`ciq-strategy`) to generate a complete script brief.
   - **Save / Bookmark Toggle:** Persists the trend to the creator's saved library.

---

### Opportunity Score ("Fit Pill") Calculation
In `backend/services/trend/app/services/scoring.py`:

$$\text{TVS} = \left( 0.50 \times \frac{\text{Raw Momentum}}{100} + 0.25 \times \text{Niche Fit} + 0.20 \times \text{Geo Relevance} + 0.05 \times \text{Format Fit} \right) \times 100$$

- **Vector Semantic Boost:** If Qdrant finds a cosine match ($\ge 0.5$), it adds an additive boost:
  $$\text{Boost} = \text{Cosine Similarity} \times 15.0\text{ points}$$
- **Outlier Bonus:** If the concept's momentum exceeds the statistical pool threshold ($\mu + 2.0\sigma$), it receives $+8.0$ bonus points and is tagged with a `Flame` icon (*Breakout Spike*).

---

### Creator Tiering Logic
Channels are segmented to ensure fair distribution:
- **Small Creator:** $< 10\text{K}$ subscribers
- **Medium Creator:** $10\text{K} - 100\text{K}$ subscribers
- **Big Creator:** $> 100\text{K}$ subscribers

*(Used in `feed_service.py` to ensure top-5 feeds are not dominated solely by big creator channels).*

---

# 2. The 3 Expectancy Metrics Above the Prophet Graph

Located directly above the time-series chart in `TrendForecastChart.tsx`, these cards translate statistical numbers into creator actions:

### Visual Layout
```
┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────────────────┐
│ 👁️ Estimated Views      │  │ ⏰ Optimal Window       │  │ 📈 Reach Multiplier     │
│ [Potential]             │  │ [Timing]                │  │ [Velocity]              │
│                         │  │                         │  │                         │
│ 15K – 45K Views         │  │ Next 24 – 48 Hours      │  │ 2.8x Channel Average    │
│ 🎬 Shorts: 20K – 65K    │  │ Peak Breakout Urgency   │  │ Top 5% Virality Velocity│
│ 📺 Video:  12K – 38K    │  │ Releasing within 48 hrs │  │ Higher push than niche  │
│ Calibrated for tier     │  │ maximizes top placement │  │ baseline topics         │
└─────────────────────────┘  └─────────────────────────┘  └─────────────────────────┘
```

---

### Metric 1: Estimated Views & Format Breakdown
**Code Implementation:** [`viewEstimator.ts`: lines 81–146](file:///c:/Users/Yash/VS_PROJECTS/CreatorIQ/frontend/src/lib/viewEstimator.ts#L81-L146)

#### How It Is Calculated:
1. **Base Search Pool ($V$):** Extracted from search volume (e.g., $500,000$ queries).
2. **Creator Tier Capture Percentage:**
   - **Small Tier ($<10\text{K}$ subs):** Captures $0.8\% - 2.5\%$ of search pool.
   - **Medium Tier ($10\text{K}-100\text{K}$ subs):** Captures $2.0\% - 5.5\%$ of search pool.
   - **Big Tier ($>100\text{K}$ subs):** Captures $5.0\% - 14.0\%$ of search pool.
3. **Prophet Forecast Trajectory Boost:**
   Incorporates the 1-week projected growth rate from Prophet (`weekChangePct`):
   $$\text{Growth Boost} = 1.0 + \text{clamp}\left(-0.15, 0.50, \frac{\text{weekChangePct}}{100}\right)$$
4. **Format Multipliers:**
   - **Shorts:** multiplied by $1.35\text{x} - 1.45\text{x}$ (top-of-funnel algorithm push).
   - **Long-Form Video:** multiplied by $0.85\text{x} - 0.95\text{x}$ (high watch-time conversion).

*Output Display:* **`15K – 45K Views`** (Shorts: `20K – 65K` | Video: `12K – 38K`).

---

### Metric 2: Optimal Publishing Window & Urgency
**Code Implementation:** [`viewEstimator.ts`: lines 161–187](file:///c:/Users/Yash/VS_PROJECTS/CreatorIQ/frontend/src/lib/viewEstimator.ts#L161-L187)

#### How It Is Calculated:
Evaluates real-time view velocity ($vph$, views per hour) and the Opportunity Score:
- **`Next 24 – 48 Hours` (`Peak Breakout Urgency`):**
  Triggered if $vph \ge 50,000\text{ views/hr}$ or $\text{Opportunity Score} \ge 74$. Advises immediate upload before search volume peaks and decays.
- **`Next 2 – 4 Days` (`High Velocity Window`):**
  Triggered if $vph \ge 20,000\text{ views/hr}$ or $\text{Opportunity Score} \ge 68$. Strong algorithm momentum across recommendations.
- **`Next 4 – 7 Days` (`Early Wave Opportunity`):**
  Triggered if $vph \ge 5,000\text{ views/hr}$ or $\text{Opportunity Score} \ge 55$. Audience search interest is climbing.
- **`Next 1 – 2 Weeks` (`Sustained Opportunity`):**
  Evergreen or steady compounder trend with sustained long-term search retention.

---

### Metric 3: Reach Multiplier & Algorithmic Discovery
**Code Implementation:** [`viewEstimator.ts`: lines 148–160](file:///c:/Users/Yash/VS_PROJECTS/CreatorIQ/frontend/src/lib/viewEstimator.ts#L148-L160)

#### How It Is Calculated:
Quantifies expected impression distribution compared to the creator's baseline channel average:

$$\text{Multiplier} = 1.2 + \left(\frac{\text{Score}}{100} \times 2.0\right) + \max(0, \text{weekChangePct}) \times 0.012$$

- **Display Formatting:** Formats to single decimal (e.g., **`2.8x Channel Average`**).
- **Contextual Subtext:**
  - If $\ge 3.0\text{x}$: Displays `Top 5% Virality Velocity in [Niche]`.
  - If $\ge 2.2\text{x}$: Displays `+[Surge]% Search Demand Spike in [Niche]`.
  - Otherwise: Displays `Consistent [X]x Discovery in [Niche]`.

---

# 3. The Prophet Graph Visualization (Interactive SVG)

### Visual Representation
```
100% Peak ───────────────────────────────────────────────────────────
                           ╭───────╮ (Predicted Peak)
 75% High ─────────╭──────╯ • • • • ╰────────╮───────────────────────
                  ╱ ░░░░░░░░░░░░░░░░░░░░░░░░░ ╲  ◄── Shaded 95% Bayesian Band
 50% Med  ───────╱ ░░░░░░░░░░░░░░░░░░░░░░░░░░░ ╲──────────────────────
                ╱ ◄── Solid Line (Prophet yhat)
 25% Low  ─────╯─────────────────────────────────────────────────────
          Day 1      Day 7       Day 15      Day 22      Day 30
          (Now)    (Optimal)     (Peak)     (Decay)   (Baseline)
```

### What the User Sees on the Graph
1. **The Solid Trend Line ($\hat{y}$):**
   Rendered with an indigo-to-violet SVG gradient (`#818cf8` $\to$ `#4f46e5` $\to$ `#6366f1`). Represents Meta Prophet's **predicted audience demand trajectory** over the next 30 days.
2. **The Shaded Corridor (Uncertainty Area Fill):**
   A semi-transparent blue area bounded between $\hat{y}_{\text{lower}}$ and $\hat{y}_{\text{upper}}$ (`rgba(99, 102, 241, 0.22)` to `0.03`).
3. **The Y-Axis (Audience Demand Scale):**
   Normalized directly to a user-friendly 0–100% scale:
   - `100% Peak Demand`
   - `75% High Demand`
   - `50% Medium Demand`
   - `25% Low Demand`
4. **The X-Axis (Time Horizon):**
   Projects 30 days ahead from the observation cutoff date (`origin_date`).

---

### The 95% Bayesian Credible Interval Corridor
- **Narrow Corridor:** Indicates high data density and low volatility; Prophet's posterior changepoint samples have converged tightly.
- **Wide Corridor:** Indicates early-stage emergence or high variance in YouTube search velocity. It visually signals to the creator that virality is possible but carries breakout uncertainty.

---

### 28-Point Downsampling Architecture
In `TrendForecastChart.tsx`:
```typescript
const step = Math.max(1, Math.floor(trajectory.length / 28));
const rawPoints = trajectory.filter((_, idx) => idx % step === 0 || idx === trajectory.length - 1);
```
- **Why Downsample?** Rendering 90 daily points in SVG creates 90 separate path segments and DOM nodes, causing frame drops during hover and tooltip animations on mobile devices.
- **Visual Smoothing:** Downsampling to 28 points provides a smooth Bézier projection line while eliminating micro-noise.

---

### Transparent Calculation Model Accordion
Clicking **"How this is calculated"** opens an interactive drawer explaining the three estimation pillars:
1. **YouTube Topic Volume:** Monthly query count tracked across YouTube.
2. **Channel Scale Capture:** Account tier capture rate ($0.8\% - 14.0\%$).
3. **Format Algorithmic Push:** Shorts multiplier ($1.35\text{x}$) vs. long-form retention ($0.85\text{x}$).

---

# 4. Summary Cheatsheet for Viva Presentation

| Screen Element | What the User Sees | How It Is Computed / Sourced |
| :--- | :--- | :--- |
| **Fit Pill** | e.g. `88 Fit` | Multi-attribute TVS: $0.50 M + 0.25 N + 0.20 G + 0.05 F$ |
| **Vector Match Badge** | e.g. `88% Vector Match` | `all-MiniLM-L6-v2` Cosine similarity with user niche via Qdrant |
| **Video Concept Box** | e.g. *"I let Cursor AI build my startup"* | AI-enriched prompt hook generated via OpenRouter LLM |
| **Estimated Views** | e.g. `15K – 45K Views` | $\text{Search Volume} \times \text{Tier Capture \%} \times \text{Prophet Growth Boost}$ |
| **Optimal Window** | e.g. `Next 24 – 48 Hours` | Evaluates real-time views/hr velocity ($vph$) + Opportunity Score |
| **Reach Multiplier** | e.g. `2.8x Channel Average` | $1.2 + (\text{Score}/100 \times 2.0) + \max(0, \text{weekChangePct}) \times 0.012$ |
| **Prophet Line ($\hat{y}$)** | Continuous gradient curve | Meta Prophet additive model ($g(t) + s(t) + h(t)$) |
| **Shaded Band** | Shaded confidence corridor | 95% Bayesian credible interval bounded by $[\hat{y}_{\text{lower}}, \hat{y}_{\text{upper}}]$ |
| **Explainability Drawer** | 3-card transparent breakdown | Volume $\to$ Channel Capture $\to$ Format Multiplier |
