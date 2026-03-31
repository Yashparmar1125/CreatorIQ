# CreatorIQ Master Database Schema

This document outlines the shared schema in the `CreatorIQ` database and the cross-service data flow.

## Identity & Core Context (Auth & Channel)

These tables form the foundation of the system. Most other services reference `user_id` or `channel_id`.

```mermaid
erDiagram
    users ||--o{ channels : owns
    channels ||--o{ audience_snapshots : tracks
    channels ||--o{ channel_metrics : contains

    users {
        uuid id PK
        string email
        string hashed_password
    }

    channels {
        uuid id PK
        uuid user_id FK
        string youtube_channel_id
        string name
        string[] niches
    }
```

## Discovery & Strategy (Trend & Strategy)

The Trend service discovers global topics, which the Strategy service then maps to specific channel growth plans.

```mermaid
erDiagram
    trends ||--o{ strategy_recommendations : informs
    channels ||--o{ strategy_sessions : begins

    trends {
        uuid id PK
        string topic
        float tvs_score
        string archetype "Greenlight, Viral, etc"
    }

    strategy_sessions {
        uuid id PK
        uuid channel_id FK
        string content_goal
        jsonb analysis_payload
    }
```

## Planning & Production (Planner)

The final stage where strategy becomes actionable tasks.

```mermaid
erDiagram
    strategy_sessions ||--o{ content_plans : implements
    content_plans ||--o{ planner_tasks : contains

    content_plans {
        uuid id PK
        uuid session_id FK
        string title
        string format "Shorts/Long"
    }
```

## Global Standards

| Entity | Type | Requirement |
| :--- | :--- | :--- |
| **All Primary Keys** | `UUID` | Default to `uuid.uuid4()` |
| **Timestamps** | `TIMESTAMP(timezone=True)` | Use `func.now()` for `created_at` |
| **JSON** | `JSONB` | Preferred for unstructured payload data |
| **Decimal** | `Numeric(10, 2)` | Use for scores and financial metrics |

## Cross-Service Communication
Services should **never** join tables across different service namespaces directly in code (though the DB allows it). Instead:
1.  **Gateway** passes `X-User-Id` header.
2.  Service A requests data from Service B via **Internal API**.
3.  Service A caches necessary foreign keys (like `channel_id`) to perform its own local joins.
