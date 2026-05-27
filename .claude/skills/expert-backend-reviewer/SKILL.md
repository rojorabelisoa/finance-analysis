---
name: expert-backend-reviewer
description: "Expert backend code review for Spring Boot apps. Use to review, audit, or critique backend code (Java, Spring Boot, Spring Web/Security/Data JPA, JWT, REST controllers, services, repositories, DTOs, FMP/HTTP clients) for correctness & bugs, security (auth/JWT, injection, secrets, OWASP), performance (N+1, caching, redundant API calls), and architecture & conventions. Triggers: review backend, review Java, review Spring, backend PR review, audit API, check controller/service/repository. Produces findings in a shared severity format and supports inline PR comments. Hybrid: generic Spring Boot best practices + finance-analysis repo conventions."
---

# Expert Backend Reviewer

Specialized review methodology for Spring Boot backends. **Hybrid**: a generic
Spring/Java core that applies anywhere, plus a repo-specific section for the
`finance-analysis` app.

## When to apply

- Reviewing a diff or PR that touches `src/main/java/**`, `pom.xml`, or
  `src/main/resources/**`
- Auditing a controller, service, repository, DTO, or client before merge
- Running as the `backend-reviewer` agent in a parallel review

## Scope discipline (parallel-safe)

This reviewer **only** inspects backend files: `src/main/**`, `pom.xml`,
`Dockerfile` (build/runtime concerns). Ignore `frontend/**` — the
`expert-frontend-reviewer` owns those. Front and back never overlap, so two
reviewers can run concurrently without conflict.

## How to review

1. Get the changes: `git diff <base>...HEAD -- src/ pom.xml` (or the working-tree
   diff if unpushed).
2. Read enough surrounding context — trace a request from controller → service →
   repository/client before judging.
3. Walk the four dimensions below. Report only real, actionable findings.
4. Emit findings in the **Output format**. If posting to a PR, follow
   **Inline PR comments**.

## Output format (shared contract — identical for both reviewers)

Each finding:

```
### [SEVERITY] path/to/File.java:LINE — short title
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
- Null handling on external/parsed data; `Optional` used correctly (no `.get()` without check).
- Swallowed exceptions (`catch {}`) that hide failures; log or handle meaningfully.
- Off-by-one, boundary, and empty-collection cases.
- Concurrency: shared mutable state, non-thread-safe fields on singleton beans.
- Resource leaks: unclosed streams/clients; timeouts on outbound HTTP.
- Transaction boundaries (`@Transactional`) correct for multi-write operations.
- Equality/`hashCode`/`equals` on entities and records used as keys.

## Dimension 2 — Security

Generic:
- Authentication/authorization enforced on every non-public endpoint.
- No SQL/JPQL injection: parameterized queries, never string-concatenated input.
- No hardcoded secrets/keys/passwords — source from environment/config.
- DTOs don't leak sensitive fields (password hashes, tokens, internal IDs).
- Input validation at the boundary (`@Valid`, constraints) for request bodies/params.
- Errors don't leak stack traces / internals to clients.
- CSRF/CORS posture intentional for the auth model (stateless JWT).

## Dimension 3 — Performance

Generic:
- JPA N+1: use fetch joins / `@EntityGraph` / batch instead of per-row queries.
- Pagination on list endpoints; no unbounded `findAll`.
- Cache hot/expensive reads; correct cache keys and eviction.
- Avoid redundant outbound API calls; reuse within a request; set timeouts.
- Don't block request threads on slow I/O without bounds.

## Dimension 4 — Architecture & conventions

Generic:
- Clear layering: Controller (web) → Service (logic) → Repository/Client (data).
- No business logic in controllers; no web concerns in services.
- DTOs at the boundary — never expose JPA entities directly.
- Constructor injection; no field injection.
- Consistent package-by-feature layout; no dead code.

---

## Repo-specific section — finance-analysis backend

**Stack:** Spring Boot 3.x, Java 21, Maven. Spring Web + Security + Data JPA,
PostgreSQL, `jjwt` for JWT, Caffeine cache, Financial Modeling Prep (FMP) via a
hand-rolled `java.net.http.HttpClient` (`shared/fmp/FmpClient`).

**Package-by-feature architecture** (from CLAUDE.md). Enforce it:
```
com.rojorabelisoa.finance/
  <feature>/   Controller + Service + Repository + dto/   (auth, portfolio, market, alert, screener, settings, user)
  shared/      config/ (SecurityConfig, WebClientConfig), exception/, fmp/, yahoo/
```

Repo rules to check:
- **DTOs are Java `record`s** (e.g. `QuoteDto`, `TechnicalAnalysisDto`). New DTOs
  should follow suit; never return entities (`User`, `Position`) from controllers.
- **Constructor injection via Lombok `@RequiredArgsConstructor`** on `final`
  fields — matches every existing controller/service. Flag `@Autowired` fields.
- **FMP/HTTP client contract:** `FmpClient` returns `null`/empty on failure and
  maps HTTP `402` (premium) and `404` to empty — callers must handle null/empty
  gracefully (many FMP endpoints 402 for EU tickers on the free tier). Flag code
  that assumes a non-null/non-empty FMP response.
- **Caching:** read-heavy market methods use `@Cacheable` with `unless` guards so
  empty/error results aren't cached (see `MarketService`). New external-data reads
  should cache similarly; check cache names exist under the Caffeine spec in
  `application.properties`.
- **Security:** `SecurityConfig` is stateless JWT; `/api/auth/**` and static
  assets are `permitAll`, **everything else is authenticated**. New endpoints are
  authenticated by default — verify that's intended, and that no debug/data
  endpoint over-exposes. `JWT_SECRET` and `FMP_API_KEY` come from env vars (no
  hardcoding); the app must fail fast if `JWT_SECRET` is absent.
- **Error handling:** prefer the centralized `GlobalExceptionHandler` +
  `AppException` over ad-hoc try/catch returning nulls in controllers.
- **Persistence:** `spring.jpa.hibernate.ddl-auto=update` is dev-only — flag new
  schema changes that would need a real migration (Flyway/Liquibase) for prod.
- **Currency/markets:** ticker→currency/market derivation conventions exist
  (`.PA/.AS/.DE → EUR`, `.L → GBP`, `.SW → CHF`). Reuse rather than re-deriving.
