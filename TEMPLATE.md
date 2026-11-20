# Payload 3 CMS Website (Postgres, S3 Bucket): Railway template spec

## Listing

| Field | Value |
|---|---|
| Name | **Payload 3 CMS Website (Postgres, S3 Bucket)** |
| Description | Payload 3 + Next.js website: pages, posts, forms, SEO, media in a Bucket. (73 chars) |
| Category | CMS |
| Tags | payload, payloadcms, headless-cms, nextjs, website, postgres, s3, typescript |
| Icon | `https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/payload.png` (200, image/png) |
| Repo | `baranberkay96/payload-railway`, service root `/services/payload` |

## Base market templates (checked 2026-11-20)

| Code | Name | Active / total | Stack | Problems |
|---|---|---|---|---|
| `L8TUlT` | Payload CMS V3 (website builder) | 210 / 693 | repo `rpuls/payload-3-boilerplate`, Postgres 16, media volume | Build and runtime reach Postgres over the public TCP proxy (`DATABASE_PUBLIC_URL`); first visitor creates the admin; media on a volume |
| `3QUkyF` | Payload CMS Template | 58 / 333 | third-party repo, `postgres-ssl:latest` | `migrate & serve` start races; no domain; unpinned DB |
| `payload-cms-4-website-beta` | Payload CMS 4 Website (Beta) | 5 / 13 | v4 beta | Pre-release |

Kept: website starter on Postgres, `PAYLOAD_SECRET` from `secret()`, `NEXT_PUBLIC_SERVER_URL` from the Railway domain, Bucket for media (as the v4 beta template does).

## Improvements over market templates

1. **Official starter, current Payload 3:** `templates/with-vercel-website` from `payloadcms/payload` v3.94.0 (packages 3.93.0, the version its migration was generated for), switched to `@payloadcms/db-postgres` + `@payloadcms/storage-s3`; exact dependency tree in `package-lock.json`.
2. **Database never public:** the build prerenders against a throwaway Postgres inside the build container (Railway builds can't reach the private network); runtime uses the private network only. The leader exposes Postgres through a TCP proxy for its build.
3. **Bundled migrations applied on start** (`prodMigrations`), and once during the build before parallel prerendering.
4. **No claimable admin:** `onInit` creates the first admin from `ADMIN_EMAIL`/`ADMIN_PASSWORD` before Payload handles any request; `/health` triggers init right after the port opens.
5. **Stateless service:** media in a private Railway Bucket, served through Payload's access-controlled file route.
6. **Standalone Next.js server** (small runtime image, non-root user), Node 22 pinned by digest, dual-stack `::`.
7. **Deploy-form values never fail the deploy** (STANDARD 8.29); short admin password fails closed with instructions; `RESET_ADMIN_PASSWORD` for recovery.
8. **Meaningful healthcheck:** `/health` returns 200 only when Payload is initialised and the database answers; start script waits up to 15 minutes for Postgres.

## Pinned versions

| Component | Version | Released | Checked |
|---|---|---|---|
| `payload`, `@payloadcms/*` | 3.93.0 | 2026-11-04 | 2026-11-20 (3.94.0 out 2026-11-17; the official template still pins 3.93.0) |
| `next` / `react` | 16.4.6 / 19.2.9 | — | 2026-11-20 |
| Node | `node:22.23.5-alpine3.23@sha256:6868d469…f475` | 2026-11-12 | 2026-11-20 |
| Postgres | `postgres-ssl:18.6@sha256:4fc833b4…c863` | Railway base | 2026-11-20 |

## Services

### Payload

Repo build `/services/payload`. Public, `targetPort` 3000, `PORT=3000`, healthcheck `/health` (900 s), restart `ON_FAILURE` ×10, no volume. Variables: `NEXT_PUBLIC_SERVER_URL` (also a build arg), `PAYLOAD_SECRET` (secret 48), `PREVIEW_SECRET`, `CRON_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (secret 24), `ADMIN_NAME`, `RESET_ADMIN_PASSWORD`, `DATABASE_URL`, `S3_*` (Bucket references).

### Postgres, Bucket

Railway base Postgres (volume, private). Railway Bucket `Bucket`.

## Resource estimate

See the round-12 report for measured values. Expected:

| Service | Idle RAM | Typical RAM | CPU |
|---|---|---|---|
| Payload | 250-450 MB | 400-800 MB | 0.01 idle, 0.3-1 when rendering/revalidating |
| Postgres | 100 MB | 150-400 MB | 0.01-0.1 |

Estimated cost: idle ≈ $5-6/month; typical small site ≈ $8-12/month plus bucket storage. Minimum plan: Trial for the runtime; the Next.js build needs 2-4 GB on Railway's builders.

## Verification checklist

- [ ] Both services SUCCESS; `/health` 200.
- [ ] `GET /api/users/init` → initialized; `POST /api/users/first-register` refused.
- [ ] Login with the generated credentials.
- [ ] Upload media → stored in the Bucket, served via `/api/media/file/...`.
- [ ] "Seed your database" → demo posts listed; home and `/posts` render.
- [ ] Short `ADMIN_PASSWORD`: deploy SUCCESS, warning logged; reset flow works.

## Open questions

- Builder memory per plan is not documented by Railway; the build sets a 4 GB heap cap.
- `NEXT_PUBLIC_SERVER_URL` must be passed as a build arg by Railway (service variables are); changing the domain needs a redeploy.
