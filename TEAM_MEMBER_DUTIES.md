# TEAM MEMBER DUTIES & ACTION RUNBOOK

**Target Assignee**: Next Developer / DevOps Engineer on Duty  
**Status of Code**: Merged in local workspace, syntax compiled, logic unit-tested. Ready for container build and deployment.

---

## 📋 Assigned Duties Overview

Your responsibility is to take these changes through local container build, frontend UI alignment, and cloud deployment:

- [ ] **Duty 1**: Container Image Rebuild & Qdrant Verification
- [ ] **Duty 2**: Frontend UI Integration (`creator_tier` & `is_momentum_outlier`)
- [ ] **Duty 3**: Git Hygiene & Commit
- [ ] **Duty 4**: Production Deployment to Azure VM

---

## Detailed Step-by-Step Instructions

### Duty 1: Container Image Rebuild & Qdrant Verification

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Build the updated `trend` Docker image (installs `sentence-transformers` and `langdetect`):
   ```bash
   docker compose build trend
   ```
3. Restart the service:
   ```bash
   docker compose up -d trend
   ```
4. Verify the startup logs:
   ```bash
   docker compose logs trend --tail 50
   ```
   **Expected Log Signals**:
   - `Created Qdrant collection 'trend_concepts' (dim=384)` (or collection dimension verified)
   - `Uvicorn running on http://0.0.0.0:8003`

5. Verify Qdrant Vector Collection Health directly:
   ```bash
   curl -s http://localhost:6333/collections/trend_concepts
   ```
   Check that `"size": 384` and `"status": "green"`.

---

### Duty 2: Frontend UI Integration (Trends Page)

The backend now emits two new properties per trend item in `GET /api/v1/trend/feed`:
- `is_momentum_outlier: boolean`
- `creator_tier: "small" | "medium" | "big"`

**Target File**: [`frontend/src/features/trends/pages/TrendsPage.tsx`](file:///c:\Users\Yash\VS_PROJECTS\CreatorIQ\frontend\src\features\trends\pages\TrendsPage.tsx)

1. Open `TrendsPage.tsx`. Locate where badges and tags are rendered on each trend card (around lines 280–330).
2. Add a **Breakout Spike Badge** when `trend.is_momentum_outlier === true`:
   ```tsx
   {trend.is_momentum_outlier && (
     <Badge variant="warning" className="gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
       <Flame className="h-3 w-3" />
       Breakout Spike
     </Badge>
   )}
   ```
3. Add a **Creator Tier Tag** to display channel size context:
   ```tsx
   {trend.creator_tier && (
     <Badge variant="neutral" className="capitalize text-[11px]">
       {trend.creator_tier} Creator
     </Badge>
   )}
   ```
4. Test the frontend locally:
   ```bash
   cd frontend
   npm run dev
   ```
   Navigate to `http://localhost:5173/app/trends` and confirm the badges render appropriately.

---

### Duty 3: Git Hygiene & Commit

1. Check repository status:
   ```bash
   git status
   ```
2. The folder `CreatorIQ-main/` was used for reference analysis. If you want to exclude or delete it:
   ```bash
   # If deleting reference folder:
   rm -rf CreatorIQ-main
   ```
3. Stage and commit only the production trend service changes:
   ```bash
   git add backend/services/trend/
   git commit -m "feat(trend): real sentence embeddings, write-path upserts, language gate, outlier detection & creator tiers"
   git push origin main
   ```

---

### Duty 4: Production Deployment to Azure VM

1. Run the existing deployment script from root PowerShell:
   ```powershell
   .\deploy.ps1
   ```
2. Observe the streaming output. Ensure that:
   - Git pulls cleanly on the VM (`$HOME/CreatorIQ`).
   - `docker compose --profile migrate build` completes.
   - `docker compose up -d --build trend` rebuilds the trend service with new requirements on the VM.
3. Validate production endpoint health:
   ```bash
   curl -I https://creatoriq.api.helloyashparmar.dev/health
   ```
