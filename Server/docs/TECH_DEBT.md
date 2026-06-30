# Technical Debt — Status

Tracking the items from the architecture review. "Done" = implemented & verified in this branch.
"Pending" = intentionally deferred because it is large or risky on the production system and
needs a dedicated, reviewed change.

## Done (safe, high-value fixes)

| # | Item | What changed |
|---|------|--------------|
| 3 | JWT leaked into logs | `middleware/auth.middleware.js` no longer logs `req.headers`. |
| 7 | Wrong auth status code | Invalid/expired/missing token now returns **401** (was 400/403), so the frontend's 401 interceptor can auto-logout. Expired tokens return a distinct "Session expired" message. |
| 4 | Passwords/OTPs/tokens in request & response logs | New `utils/redact.js` deep-redacts sensitive keys; `server.js` runs every logged req/res body through it. |
| 8 | Live DB-mutating demo endpoint | Removed `GET /api/demo/apply-grace` from `routes/routes.js`. `GET /api/test-error` is now gated to non-production. |
| 2 | No backend tests | Added Node built-in test runner (`npm test` → `node --test`), no new dependencies. 13 tests covering `auth.middleware` and `redact`. See `tests/`. |
| 6 | Loose migrations, no runner | Added `migrations/run.js` (`npm run migrate`): applies `*.sql` in order, tracks them in a `schema_migrations` table, one transaction per file, idempotent. |

## Partially done

| # | Item | Status |
|---|------|--------|
| 1 | Students linked to colleges by free-text name (`"collageName"` ILIKE join, ~20 query sites) | Migration `012_add_college_id_to_students.sql` written — **additive only**: adds `students.college_id` FK + index and best-effort backfills it from the legacy name. It does **not** change any queries and is safe to run. **Not yet applied** (needs DB access + review of the unmatched-rows report it prints). Follow-up below. |

### Follow-up for #1 (separate reviewed change)
1. Run `012` on staging; review the `RAISE NOTICE` count of students that couldn't be auto-matched; clean those by hand.
2. Repoint the ~20 `s."collageName" ILIKE c.name` joins in `controller.js`, `collegeAdminController.js` onto `s.college_id = c.id`.
3. Once verified, add a `013` migration to set `college_id NOT NULL` and (optionally) drop `"collageName"`.

## Pending (deferred — large/risky, do NOT rewrite blind)

| # | Item | Why deferred / recommended approach |
|---|------|-------------------------------------|
| 5 | 7,355-line `controllers/controller.js` (god file) | Mechanical split risks breaking the 100+ named exports `routes.js` imports. Recommended: extract **one domain at a time** into `services/` + `repositories/`, keeping the existing export surface, with tests added per slice before moving the next. Best done alongside the Fedena integration (new `integration/fedena/` anti-corruption layer). |
| 9 | Some master endpoints not tenant-scoped the way `getMasters` is | Needs a per-endpoint security audit; changing scoping blind could hide data from legitimate roles. Do as a focused review with the role matrix. |
| 10 | No TypeScript / shared FE-BE types | Large migration; low urgency. Consider incremental `// @ts-check` + JSDoc on new modules first. |

## How to run

```bash
cd Server
npm test        # run the test suite
npm run migrate # apply pending *.sql migrations (needs config/.env DB settings)
```
