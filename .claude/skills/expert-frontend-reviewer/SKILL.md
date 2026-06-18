---
name: expert-frontend-reviewer
description: "Expert frontend code review for React apps. Use to review, audit, or critique frontend code (React, JSX, hooks, Vite, React Router, axios, Recharts, Tailwind CSS) for correctness & bugs, security (XSS, auth, data exposure), performance (re-renders, memoization, bundle), and architecture & conventions. Triggers: review frontend, review React, review JSX, frontend PR review, audit UI code, check component. Produces findings in a shared severity format and supports inline PR comments. Hybrid: generic React best practices + finance-analysis repo conventions."
---

# Expert Frontend Reviewer

Specialized review methodology for React frontends. **Hybrid**: a generic React
core that applies anywhere, plus a repo-specific section for the
`finance-analysis` app.

## When to apply

- Reviewing a diff or PR that touches `frontend/**`
- Auditing a component, hook, or service before merge
- Running as the `frontend-reviewer` agent in a parallel review

## Scope discipline (parallel-safe)

This reviewer **only** inspects frontend files: `frontend/**` (`.jsx`, `.js`,
`.css`, `vite.config.js`, `tailwind.config.js`, `package.json`). Ignore backend
files — the `expert-backend-reviewer` owns those. Front and back never overlap,
so two reviewers can run concurrently without stepping on each other.

## How to review

1. Get the changes. Prefer the diff over the whole tree:
   `git diff <base>...HEAD -- frontend/` (or the working-tree diff if unpushed).
2. For each changed file, read enough surrounding context to judge correctness —
   don't review a hunk in isolation.
3. Walk the four dimensions below. Report only real, actionable findings; skip
   praise and speculation.
4. Emit findings in the **Output format**. If posting to a PR, follow
   **Inline PR comments**.

## Output format (shared contract — identical for both reviewers)

Each finding:

```
### [SEVERITY] path/to/file.jsx:LINE — short title
**Problème:** what is wrong, concretely.
**Dimension:** Correctness | Security | Performance | Architecture
**Correctif:** the specific change to make (code snippet when useful).
```

Severities:
- 🔴 **BLOCKER** — bug, security hole, or breakage that must be fixed before merge.
- 🟠 **MAJOR** — likely to cause incidents or strong convention violation.
- 🟡 **MINOR** — should fix, low risk.
- 🔵 **NIT** — style/polish, optional.

End with a one-line verdict: `APPROVE` / `APPROVE WITH NITS` / `REQUEST CHANGES`,
plus counts per severity. If there are zero findings, say so explicitly.

## Inline PR comments

When the orchestrator asks for inline comments: provide, per finding, the
`path` (repo-relative), the `line` (line number on the **new** side of the
diff / RIGHT), and a `body` = the **Problème** + **Correctif** (with severity
emoji prefix). Do **not** open your own pending review when running in parallel
— GitHub allows only one pending review per user per PR, so the orchestrator
collects findings from both reviewers and submits a single consolidated review.

---

## Dimension 1 — Correctness & bugs

Generic:
- Null/undefined access on API data; optional chaining and fallbacks at boundaries.
- Missing/duplicate/index-as-`key` in lists when items reorder.
- `useEffect` dependency arrays: missing deps (stale closures) or over-firing.
- State updates after unmount; unhandled promise rejections; missing `await`.
- Error/loading/empty states for every async call (`try/catch`, error UI).
- Boolean/number coercion bugs (`0`, `''`, `NaN` falsy traps).
- Controlled-input invariants; form submit prevented; double-submit guards.

## Dimension 2 — Security

Generic:
- No `dangerouslySetInnerHTML` with unsanitized/user/API content (XSS).
- Treat API responses as untrusted: validate shape before rendering/using.
- No secrets, tokens, or API keys in frontend source or logs.
- Auth-guarded routes actually gate; no sensitive data cached where it leaks.
- External links use `rel="noopener noreferrer"` with `target="_blank"`.

## Dimension 3 — Performance

Generic:
- Avoid recomputing expensive values each render — `useMemo`/`useCallback` where it matters.
- Stable references for props passed to memoized children; avoid inline object/array props that defeat memo.
- Don't fetch in render; debounce search inputs.
- Large dependencies and bundle size; prefer code-splitting heavy routes.
- Avoid unnecessary re-renders from context value churn.

## Dimension 4 — Architecture & conventions

Generic:
- Components stay presentational; data access/business logic lives in services/hooks.
- No dead code, commented-out blocks, or unused imports/vars.
- Consistent naming; one responsibility per file.

---

## Repo-specific section — finance-analysis frontend

**Stack:** React 18 + Vite, React Router v6, axios, Recharts, Tailwind CSS
(dark theme: `slate` surfaces, `emerald` accent, `red` for negative).

**Feature-based architecture** (from CLAUDE.md). Enforce it:
```
frontend/src/
  features/<feature>/{components,hooks,services}/
  context/        (AuthContext, PortfolioContext)
  shared/         (components/, hooks/useApi.js)
  pages/          (route-level composition)
```

Repo rules to check:
- **API access only via the service layer.** Components/pages call
  `marketService` / `portfolioService` / etc., which use the shared axios
  instance `shared/hooks/useApi.js` (JWT interceptor + 401 handling). Flag any
  direct `axios`/`fetch` call outside a `*Service.js`.
- **Tailwind JIT — no dynamically constructed class names.** Strings like
  `` `bg-${color}-500` `` are **not** generated by Tailwind's JIT and silently
  produce no style. Require full static class strings (use a conditional that
  returns complete class names). 🔴/🟠 depending on visual impact.
- **Auth:** token in `localStorage`; 401 on non-auth endpoints dispatches the
  `finance:logout` event (don't full-reload). Private routes go through
  `PrivateRoute`. Flag protected data fetched outside a guarded route.
- **Recharts:** memoize chart data transforms (`useMemo`) keyed on the source
  prop; guard against empty/short datasets; custom `Customized`/shape renderers
  must null-check `xAxisMap`/`yAxisMap`/`offset` before using scales.
- **i18n/format:** UI copy and number formatting are French (`toLocaleString('fr-FR')`).
  Keep currency/decimal formatting consistent with existing components.
- **Theme:** reuse `shared/components` (`Card`, `Badge`, `Navbar`) and the
  slate/emerald palette rather than re-styling from scratch.
