# CreatorIQ — Psychology-Driven Product UI/UX Redesign

## 1. Your Role

Act as a senior product designer, UX psychologist, SaaS design-system architect, and senior frontend engineer.

Your task is to redesign and improve the CreatorIQ frontend so that every screen, component, interaction, and information hierarchy is intentionally designed around the needs and decision-making behaviour of YouTube content creators.

Do not create a generic AI dashboard.

Do not focus only on visual aesthetics.

Build a coherent product experience that helps creators discover opportunities, evaluate evidence, make decisions, create content strategies, plan execution, and learn from their channel analytics.

The result must look and behave like a professional, production-quality SaaS product.
## 5. Design System and Brand Identity — STRICT LIGHT THEME

CreatorIQ must use a **light-only, white-based professional SaaS theme** across the entire application.

### Non-negotiable theme requirements

- The default and only theme for this redesign is LIGHT.
- Use white and warm off-white as the primary page and application backgrounds.
- Use white surfaces for cards, forms, tables, dropdowns, drawers, and dialogs.
- Use pale lavender for selected sections and subtle visual grouping.
- Use mint green for positive trend indicators and supporting accents.
- Use pastel pink for primary buttons and important actions.
- Use near-black typography for headings and primary content.
- Use readable dark-grey typography for descriptions and secondary content.
- Use subtle neutral borders to distinguish components.
- Maintain generous whitespace and clear visual hierarchy.

### Suggested colour tokens

- Main application background: `#FBFAF8`
- Primary surface: `#FFFFFF`
- Secondary surface: `#F6F3FF`
- Lavender accent: `#F1ECFF`
- Mint accent: `#91F5D3`
- Pink primary action: `#FF98C1`
- Primary text: `#171717`
- Secondary text: `#625D68`
- Muted text: `#77717F`
- Borders: `#E5E0E8`
- Positive status: `#167A59`
- Warning status: `#946200`
- Negative status: `#B42332`

These are initial design tokens. Reuse existing matching project tokens where available and maintain the same overall light visual identity.

### Typography and contrast

- Headings must use dark, high-contrast text.
- Body text must remain comfortably readable against white and pastel backgrounds.
- Metric values must use near-black text.
- Buttons must have readable labels.
- Muted metadata must not become nearly invisible.
- Never apply white text to white, off-white, lavender, or pale mint backgrounds.
- Do not use low-contrast text merely to achieve a softer aesthetic.

### Authenticated application appearance

The dashboard, trends, trend-detail, strategy, planner, analytics, onboarding, and settings pages must all follow this same light theme.

Use:
- White content cards.
- Warm off-white page backgrounds.
- Thin, subtle borders.
- Restrained corner radii.
- Clean charts with readable axes and legends.
- Professional tables and structured information panels.
- Pink primary buttons.
- Pastel status accents used according to actual data.

The authenticated application may be more information-dense than the marketing website, but it must remain visually consistent with the CreatorIQ landing and login pages.

### Explicitly prohibited

- Dark mode as the default.
- Dark dashboard backgrounds.
- Black or charcoal page surfaces.
- Automatic theme switching.
- Theme toggles introduced as part of this task.
- Neon-heavy colours.
- Excessive gradients or glow effects.
- Glassmorphism.
- White text on light backgrounds.
- Inconsistent colour schemes between application pages.

Do not introduce a separate dark theme or a theme-switching feature. Implement the redesign using the light theme only.

**Final rule: CreatorIQ must look like a polished, light-themed, white-based analytics SaaS product, with lavender, mint, and pink accents and dark readable typography throughout.**

## 2. Product Context

CreatorIQ is a premium AI SaaS platform for YouTube creators.

Its existing capabilities include:

- Personalized Top 5 trend discovery.
- Trend ranking based on niche fit, momentum, and geography.
- YouTube Data API and SerpApi-based trend signals.
- AI-enriched trend headlines, angles, and title ideas.
- Trend details and historical feed snapshots.
- Trend saving and unsaving.
- Quick strategy generation from trend cards.
- AI strategy briefs containing titles, insights, script outlines, hooks, retention sections, CTAs, and SEO tags.
- Channel dashboard and overview metrics.
- Analytics for retention, traffic sources, and audience breakdown.
- Content planner scaffold.
- Seven-step onboarding for channel connection, niche, format, tone, geography, and profile review.
- Prophet time-series forecasting and view-opportunity scoring.

Use the existing repository and implementation as the source of truth for actual functionality. The list above comes from the current product specification; verify the implementation before assuming that every feature is fully operational.

### Core product promise

Help creators identify the right content opportunities for their particular channel, understand why those opportunities matter, and turn the strongest ideas into actionable content plans.

## 3. Core UX Philosophy

Design the product around this creator journey:

DISCOVER → EVALUATE → DECIDE → CREATE → PLAN → LEARN

Every page and component must serve one or more stages of this journey.

### Creator psychology principles

**A. Reduce decision fatigue**

Creators should not have to analyse dozens of competing signals before finding a useful starting point.

- Prioritize the existing personalized Top 5 trend feed.
- Establish a clear primary action on every important screen.
- Use progressive disclosure for advanced metrics.
- Avoid unnecessary filters, competing CTAs, and excessive dashboard widgets.

**B. Build confidence through evidence**

Creators need to understand why an opportunity is recommended.

- Show the signals supporting a recommendation.
- Distinguish historical observations from model forecasts.
- Explain niche fit, momentum, geography, stability, and saturation where the existing data supports them.
- Show source attribution and freshness when available.
- Never invent evidence or present a prediction as a guarantee.

**C. Respect the creator's niche and identity**

A popular trend is not necessarily a good opportunity for every creator.

- Make personalized relevance more prominent than generic popularity.
- Reflect the creator's selected niche, content format, tone, and geography where available.
- Explain why a trend may fit the creator's audience.
- Avoid designing the interface to encourage blindly chasing viral topics.

**D. Reduce the blank-page problem**

Once a creator chooses an opportunity, make the next step obvious.

- Connect trend cards to the existing trend-detail experience.
- Provide clear access to the existing strategy-generation workflow.
- Present titles, angles, hooks, retention outlines, CTAs, and SEO tags in a structured hierarchy.
- Preserve editing, copying, saving, and navigation capabilities where already implemented.

**E. Support continuity and progress**

Creators should be able to return to previous decisions.

- Make saved trends and feed history easy to discover.
- Preserve existing historical feed functionality.
- Make the transition from trend discovery to strategy and planning feel continuous.
- Avoid forcing users to repeat information already available in their profile.

**F. Be honest and respectful**

- No fake scarcity.
- No manipulative FOMO messaging.
- No fabricated growth percentages.
- No guaranteed-view claims.
- No misleading urgency badges.
- No artificial engagement loops.
- No fabricated trend confidence scores.

The purpose is to improve decision quality, not pressure users into taking actions.

## 4. Mandatory Repository Audit

Before modifying anything, inspect the existing frontend.

Identify:

- Framework and build configuration.
- Route structure.
- Public and authenticated layouts.
- Existing pages and feature modules.
- Shared components in `src/components/ui/`.
- Marketing components.
- Feature-specific components.
- Existing design tokens and Tailwind configuration.
- Authentication and Zustand stores.
- TanStack Query usage.
- API client and response types.
- Existing chart libraries.
- Existing icons, fonts, illustrations, and static assets.
- Responsive behaviour.
- Existing tests, linting and build commands.

The current stack is React 19, TypeScript, Vite, React Router, Zustand, TanStack Query, Tailwind CSS 4, Framer Motion and Lucide. Verify the installed project before making assumptions.

Create an implementation plan based on the actual codebase.

Reuse existing components when appropriate. Do not replace the architecture or add dependencies without a concrete reason.

## 5. Design System and Brand Identity

Maintain continuity with the existing CreatorIQ public landing and login pages.

### Brand direction

- Warm white and off-white surfaces.
- Pastel lavender section backgrounds.
- Mint-green positive accents.
- Pink primary actions.
- Near-black typography.
- Subtle neutral borders.
- Rounded cards and controls.
- Clean analytical visualizations.
- Generous but purposeful spacing.

Use the existing design assets and tokens wherever possible.

The authenticated application must feel more analytical and information-dense than the marketing website, while remaining part of the same brand.

### Colour semantics

Establish consistent semantic tokens.

- Primary text: near-black.
- Secondary text: readable neutral grey.
- Background: warm off-white.
- Elevated surfaces: white.
- Primary action: pink.
- Positive momentum: green, when supported by data.
- Uncertainty or caution: amber.
- Negative signals: restrained red, only when justified.
- Borders and dividers: neutral grey.

Do not rely on colour alone to communicate meaning. Pair colours with labels, icons, or text.

Never use white or very pale text on light backgrounds.

Avoid excessive gradients, neon colours, glowing cards, glassmorphism, oversized shadows, and decorative effects that compete with the data.

### Typography

Use the project's existing fonts when available.

Establish a consistent hierarchy for:

- Page titles.
- Section headings.
- Card titles.
- Metric values.
- Body text.
- Labels and metadata.
- Chart annotations.

Keep analytical text readable and distinguish primary metrics from supporting information.

### Spacing and components

Use consistent spacing, border radii, input heights, button sizes, and content widths.

Buttons must have hover, focus, disabled, and loading states where appropriate.

Cards should communicate meaningful grouping rather than placing every element inside another container.

## 6. Application Navigation

Inspect and preserve the actual existing routes.

The documented authenticated pages include:

- `/app/dashboard`
- `/app/trends`
- `/app/trends/detail/:trendId`
- `/app/strategy`
- `/app/planner`
- `/app/analytics`
- `/app/settings`

The documented public pages include:

- `/`
- `/product`
- `/pricing`
- `/insights`
- `/login`
- `/signup`
- `/onboarding`
- `/privacy`
- `/terms`

Do not invent additional routes without inspecting the application.

Use a consistent authenticated application shell with clear navigation and a recognizable current-page state.

Recommended navigation priorities:

1. Dashboard.
2. Trends.
3. Strategy.
4. Planner.
5. Analytics.
6. Settings.

Use the existing route structure and preserve navigation behaviour.

Navigation should help users understand where they are and what they can do next.

## 7. Dashboard — Orientation and Context

Psychological goal: help the creator understand their current context without overwhelming them.

Design the dashboard to answer:

- What channel or creator profile am I working with?
- What should I pay attention to?
- Where can I continue my workflow?

Use existing data for:

- Channel overview.
- Relevant channel metrics.
- Recent insights.
- Useful next actions.
- Entry points into the trend feed, strategy and planner.

Prioritize meaningful information over the number of widgets.

Do not duplicate the entire trends feed or analytics page on the dashboard.

Use clear section headings, compact metrics and restrained visualizations.

If data is unavailable, show a meaningful empty or connection state rather than invented numbers.

## 8. Trends — Discovery and Decision Support

This is a core product experience.

The trends feed must help creators answer:

"What are the best opportunities for my channel right now, and why?"

### Trend feed

Use the existing personalized Top 5 feed.

Each trend card should present available information in this approximate order:

1. Topic or trend title.
2. Trend lifecycle or status.
3. Personalized niche relevance.
4. Momentum or growth signal.
5. Geographic relevance where available.
6. Supporting evidence and source information.
7. Forecast information, if available.
8. Primary action to inspect the opportunity.
9. Secondary actions such as saving or generating a strategy, where already supported.

Do not fabricate fields when the API does not supply them.

Avoid turning each card into a dense technical report. Show the most useful signals first and expose more detail on the trend-detail page.

### Trend card hierarchy

The topic and reason for relevance should be immediately understandable.

Metrics should have labels, units, and time windows where available.

Status badges must reflect actual backend values.

Use consistent component styles across all cards.

### Feed controls

Preserve existing refresh and feed-history behaviour.

- Show refresh status.
- Communicate loading clearly.
- Preserve existing refresh-credit behaviour.
- Make past feed snapshots discoverable.
- Show empty, error and stale-data states honestly.
- Avoid unnecessary animations during feed updates.

Do not alter ranking, collection, refresh logic, or API contracts.

## 9. Trend Detail — Evidence and Evaluation

The trend-detail experience should help a creator decide whether to invest time in an opportunity.

Use existing trend-detail data and capabilities.

Organize the page into clear information layers:

### Overview

- Trend title.
- Lifecycle/status information.
- Concise explanation.
- Relevant niche context.

### Why this trend matters

Show existing supporting signals and explanations where available.

Make it clear which information is measured, derived, or generated by AI.

### Historical momentum and forecast

Where the existing forecast data is available, distinguish:

- Historical observations.
- Forecast values.
- Lower and upper uncertainty bounds.
- Relevant time horizon.
- Data freshness.

Use appropriate charts with readable axes, labels, legends and tooltips.

Do not imply that a forecast guarantees future views.

Do not create new forecasting behaviour or alter Prophet model outputs.

### Opportunity assessment

Show available niche fit, geography, momentum, stability or saturation information.

Do not invent a new composite score if the backend does not provide one.

### Actions

Preserve existing actions for:

- Saving and unsaving a trend.
- Exploring title ideas.
- Generating a strategy brief.

Make the primary next step visually clear.

## 10. Strategy — From Insight to Content

The strategy page should reduce the effort required to transform an idea into a concrete video concept.

Use the existing strategy-generation functionality and response structure.

Organize generated output into clear, scannable sections:

- Strategic insight.
- Suggested titles.
- Content angle.
- Hook.
- Script or outline.
- Retention structure.
- Call to action.
- SEO tags.

Preserve the actual fields returned by the application.

Use readable section headings, appropriate spacing, copy controls where already supported, and clear distinctions between generated sections.

Avoid showing the complete strategy as one uninterrupted wall of text.

If generation is in progress, show an honest loading state.

If generation fails, preserve any available user input and present the existing error or retry behaviour.

Do not invent generated output to hide backend failures.

## 11. Planner — Execution and Commitment

The planner should help creators organize content ideas into a manageable workflow.

The README describes the planner as a scaffold, so inspect the implementation carefully.

Use only existing supported calendar and planning capabilities.

Design for:

- Clear time-based organization.
- Readable calendar entries.
- Recognizable content status.
- Useful empty states.
- Easy navigation from a strategy or opportunity into planning, if the existing integration supports it.

Do not imply that an idea has been scheduled, published or completed unless the application records that state.

Do not invent planner integrations or new backend functionality.

## 12. Analytics — Learning and Reflection

The analytics experience should help creators understand audience behaviour without overwhelming them with raw numbers.

Use existing analytics fields for:

- Retention.
- Traffic sources.
- Audience breakdown.
- Channel metrics.

Organize analytics into meaningful groups.

Use clear chart labels, time ranges, units, legends and contextual descriptions.

Help users distinguish:

- Absolute values.
- Percentages.
- Changes over time.
- Audience composition.
- Data that is unavailable or incomplete.

Do not fabricate audience geography, retention values or YouTube analytics data.

If analytics functionality is partial, represent the implemented capabilities accurately and show clear empty or unavailable states.

## 13. Onboarding — Personalization and Progress

Preserve the existing seven-step onboarding flow.

The documented steps cover channel connection, niche, format, tone, geography and profile review.

Inspect the actual implementation to determine the exact step structure.

The onboarding experience should:

- Show progress clearly.
- Explain why each preference improves personalization.
- Avoid asking for the same information repeatedly.
- Use accessible selection controls.
- Provide a clear next action.
- Preserve existing validation.
- Explain required channel permissions honestly.
- Allow users to understand what information is being requested.

Avoid unnecessary friction or unsupported claims about data usage.

Do not alter Google OAuth or YouTube connection behaviour.

## 14. Professional UI Components

Use and improve the existing design system instead of creating inconsistent one-off components.

Inspect existing implementations before creating new ones.

Relevant component categories include:

- Application navigation.
- Page headers.
- Cards.
- Metric/stat cards.
- Status badges.
- Buttons.
- Inputs and form controls.
- Tabs.
- Drawers.
- Dialogs.
- Dropdowns.
- Tooltips.
- Toast notifications.
- Skeleton loaders.
- Empty states.
- Error states.
- Charts and chart legends.
- Filter controls.
- Pagination or feed-history navigation.

Create new reusable components only when they solve a real repeated need.

Every component should have a clear semantic purpose, consistent styling, accessible behaviour and predictable interaction states.

Do not introduce unnecessary component complexity.

## 15. State Design

Treat application states as part of the product design, not as an afterthought.

Implement appropriate presentation for:

- Initial loading.
- Background refresh.
- Successful data loading.
- Empty results.
- Partial data.
- API errors.
- Expired authentication.
- Missing channel connection.
- Strategy generation in progress.
- Forecast unavailable.
- Missing analytics permissions.
- Disabled actions.

Use existing API responses and application state.

Do not invent fake successful responses.

Avoid replacing the entire page with a spinner when a smaller region can show its own loading state.

Use skeletons where they meaningfully preserve the expected layout.

Error messages should explain what happened and what the user can do next without exposing internal secrets or stack traces.

## 16. Accessibility and Interaction Design

Follow accessible frontend practices:

- Semantic HTML.
- Keyboard navigation.
- Visible focus indicators.
- Adequate colour contrast.
- Accessible form labels.
- Appropriate alternative text.
- Descriptive button labels.
- Accessible chart descriptions.
- Reduced-motion support.
- Responsive touch targets.

Do not rely solely on hover to reveal essential information.

Use animations sparingly and only where they clarify state changes or navigation.

Do not introduce animations that slow down common creator workflows.

## 17. Responsive Design

Verify the application at representative desktop, tablet and mobile widths.

Suggested viewports:

- 1440 × 900.
- 1024 × 768.
- 768 × 1024.
- 390 × 844.
- 320 × 700.

Adapt layouts to the available space.

Do not shrink desktop dashboards proportionally.

On smaller screens:

- Preserve the most important content.
- Make navigation accessible.
- Stack cards where appropriate.
- Keep charts readable.
- Avoid horizontal overflow.
- Preserve clear primary actions.
- Use appropriate responsive navigation patterns.

## 18. Technical Constraints

This is a frontend product redesign.

Do not change:

- Backend services.
- API endpoints or response contracts.
- Database schemas.
- PostgreSQL or Redis behaviour.
- YouTube collection logic.
- SerpApi collection logic.
- Niche taxonomy.
- Trend ranking or scoring algorithms.
- Prophet forecasting logic.
- Authentication and OAuth logic.
- JWT handling.
- Existing permission and access-control behaviour.

Preserve React Router, Zustand, TanStack Query, the existing API client and established project conventions.

Do not create fake frontend data to conceal missing backend functionality.

If a desired experience requires a backend capability that does not exist, document the gap rather than silently implementing misleading UI.

## 19. Implementation Workflow

Follow this order:

### Phase 1 — Audit

Inspect the codebase, route structure, shared components, data contracts and design assets.

### Phase 2 — UX assessment

Map each existing screen to the creator's primary question, the information needed to answer it, and the next useful action.

### Phase 3 — Design system

Standardize colours, typography, spacing, cards, buttons, status indicators and state components.

### Phase 4 — Application shell

Improve authenticated navigation and page structure without breaking routing.

### Phase 5 — Core workflow

Prioritize:

1. Trends.
2. Trend detail.
3. Strategy.
4. Planner.

### Phase 6 — Supporting experiences

Improve dashboard, analytics, settings and onboarding according to their existing capabilities.

### Phase 7 — State and responsive coverage

Handle loading, error, empty, unavailable and responsive states.

### Phase 8 — Verification

Run existing build, lint and test commands.

Use browser tooling where available to inspect actual rendered pages and interactions.

Compare the implementation with the design system and correct inconsistencies.

Do not stop after making the page compile.

Do not rewrite every page simultaneously without validating the shared design system and core workflow first.

## 20. Acceptance Criteria

The redesign is successful when:

- The UI supports the creator journey from discovery through learning.
- Existing functionality is preserved.
- Trends are easy to scan and evaluate.
- Recommendations are supported by available evidence.
- Historical data and forecasts are visually distinct.
- Strategy briefs are easy to navigate and use.
- Planner and analytics screens accurately reflect implemented capabilities.
- The interface uses a consistent professional component system.
- Loading, empty, error and unavailable states are handled honestly.
- Text remains readable across light and coloured surfaces.
- Desktop and mobile layouts work correctly.
- Navigation and interactions work with real existing routes.
- No backend behaviour or API contract has been changed.
- The application builds successfully.
- No unrelated functionality is broken.

## 21. Final Report

After completing the work, report:

1. The existing architecture and reusable components inspected.
2. The UX problems identified.
3. The pages and components modified.
4. The design-system decisions made.
5. The creator-psychology principles applied.
6. Existing features preserved.
7. Any backend capabilities that are incomplete or unavailable.
8. Responsive viewports checked.
9. Build, lint and test results.
10. Remaining issues and recommended next steps.

Clearly distinguish verified results from assumptions.

## Final Directive

Build CreatorIQ as a decision-support product for YouTube creators.

Every page must help the creator answer a real question, every important metric must have context, every recommendation must be honest about its evidence, and every major workflow must lead naturally to a useful next action.

Preserve existing functionality, work from the actual repository, and prioritize usability, trust, consistency and visual quality over decorative complexity.

Audit first. Design systematically. Implement incrementally. Verify the actual result.
