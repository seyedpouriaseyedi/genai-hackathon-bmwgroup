

# Fix Navigation Bug, Humanize Logs, Optimize Performance

## 1. Fix: Recommendation redirect fires repeatedly

**Root cause**: `PipelineContext.tsx` line 96-102 — the `useEffect` that navigates to `/recommendation` triggers whenever `state.isComplete` is `true`. Since `isComplete` is never reset back to `false` after navigation, any re-render or route change causes another redirect loop.

**Fix in `src/contexts/PipelineContext.tsx`**:
- Add a `hasNavigated` ref. Set it to `true` after the first navigation. Check it in the useEffect to skip subsequent triggers.
- Reset `hasNavigated` to `false` in `startPipeline` and `resetPipeline`.

## 2. Humanize Process Log messages

**Fix in `src/pages/EvaluationsPage.tsx`** — Replace `logTemplates` (lines 27-41) with conversational, HR-friendly messages. Remove `agent:` prefix labels like "system", "scenario", "candidate" — instead use plain language:

| Old | New |
|-----|-----|
| `system: Starting evaluation process...` | `Getting everything ready to evaluate your candidates...` |
| `system: Ready. Resources allocated.` | `All set. Let's begin the evaluation.` |
| `scenario: Evaluation criteria set for Supply Chain Disruption.` | `Using the priorities you set for Supply Chain Disruption.` |
| `candidate: Matching candidate skills to job requirements.` | `Now comparing each candidate's skills against the job requirements.` |
| `candidate: Reviewing profile CV_001_DE...` | `Looking at candidate CV_001_DE's profile...` |
| `candidate: Profile CV_001_DE complete.` | `Finished reviewing CV_001_DE.` |
| `candidate: Low-quality file for CV_042_US...` | `Heads up — the file for CV_042_US had some missing data. We'll work with what's available.` |
| `candidate: Reviewing profile CV_119_UK...` | `Looking at candidate CV_119_UK's profile...` |
| `candidate: Profile CV_119_UK complete.` | `Finished reviewing CV_119_UK.` |
| `ranking: Scoring all 8 candidates...` | `Scoring all 8 candidates based on your scenario priorities...` |
| `ranking: Close match detected...` | `Two candidates are very close — running a tiebreaker between CV_001_DE and CV_099_DE.` |
| `decision: Top 5 candidates meet minimum requirements.` | `Good news — the top 5 candidates all meet the minimum requirements.` |
| `output: Rankings finalised...` | `All done! Rankings are ready. Preparing your recommendation now.` |

Also remove the `l.agent` display in the log rendering (line 827) — no more `system:` or `candidate:` prefixes. The messages speak for themselves.

The "stopped by user" extra log also changes from `system: Process stopped by user.` to `You stopped the evaluation. Partial results have been saved.`

## 3. Performance Optimization

**Problem**: The 1010-line `EvaluationsPage.tsx` is a monolithic component. Every `setInterval` tick (100ms) calling `setLocalProgress` and `setStack` causes the entire page to re-render, including all 4 tabs' worth of JSX.

**Optimizations**:

### 3a. Lazy-load the AgentPlan component
`agent-plan.tsx` imports `framer-motion` (heavy library). Lazy-load it:
```tsx
const AgentPlan = React.lazy(() => import("@/components/ui/agent-plan"));
```
Wrap usage in `<Suspense>`. This avoids loading framer-motion until the user clicks "Behind the Scenes".

### 3b. Reduce `setStack` frequency
Currently updating all 8 stack rows every 100ms. Change to update every 500ms instead of piggy-backing on the progress interval. Use a separate counter or modulo check.

### 3c. Memoize tab content
Wrap each tab's content block in `React.memo` extracted components or use `useMemo` for expensive render sections (the ranking table, candidate card). This prevents Tab 1/2/3 from re-rendering during Tab 4's simulation ticks.

### 3d. Remove `new Date()` on every render
Line 333 creates a `Date` on every render. Move `timeStr` to a ref or compute once.

## Files to edit

1. **`src/contexts/PipelineContext.tsx`** — Add `hasNavigated` ref to prevent repeated redirects
2. **`src/pages/EvaluationsPage.tsx`** — Rewrite log messages, remove agent prefixes, lazy-load AgentPlan, reduce stack update frequency, memoize expensive sections

