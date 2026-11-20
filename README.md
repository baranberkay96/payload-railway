# Deploy and Host Payload with Railway

Payload is an open-source, TypeScript-first headless CMS and application framework that runs inside Next.js. This community template deploys Payload 3 with its official website starter (pages, posts, forms, SEO, search, redirects) on Postgres 18, stores media in a Railway Bucket and creates the first admin for you.

## About Hosting Payload

Payload 3 is a Next.js app: the admin panel, the REST and GraphQL APIs and your website are served by one Node.js process. It needs a database and storage for uploads. This template builds Payload's website starter as a standalone Next.js server, connects it to Postgres over Railway's private network, applies the bundled database migrations on start and keeps uploaded media in a private Railway Bucket through Payload's S3 storage adapter, which serves files through Payload's own access control. The first admin is created from the template variables before Payload serves any request, so the "create first user" page is never open to visitors.

## Common Use Cases

- Marketing websites and blogs with a visual page builder and live preview
- Headless content backend for web and mobile apps (REST and GraphQL)
- Internal tools and portals built on Payload's auth, access control and admin UI
- Multi-author publishing with drafts, versions, scheduled publishing and SEO fields

## Dependencies for Payload Hosting

- PostgreSQL (included, Postgres 18 with a volume)
- Railway Bucket for media (included)
- A fork of the template repository to change collections and the website

### Deployment Dependencies

- Payload: https://payloadcms.com
- Source and releases: https://github.com/payloadcms/payload
- Documentation: https://payloadcms.com/docs
- Website template: https://github.com/payloadcms/payload/tree/main/templates/website
- S3 storage adapter: https://payloadcms.com/docs/upload/storage-adapters

### Implementation Details

| Service | Source | Purpose | Public | Storage |
|---|---|---|---|---|
| Payload | repo build: Payload 3.93.0 website on Next.js 16, Node 22 | Website, admin panel, APIs | yes | Railway Bucket |
| Postgres | `postgres-ssl:18` | Content, users, versions | no | volume |
| Bucket | Railway Bucket | Media uploads (private) | no | bucket |

**First login**

1. Open the Payload service's public URL and go to `/admin`.
2. Log in with `ADMIN_EMAIL` (default `admin@example.com`) and `ADMIN_PASSWORD` from the Payload service's Variables tab.
3. Click "Seed your database" on the dashboard to load demo pages, posts and images, then open the site's home page.

**How the build works.** The website starter prerenders pages with data from Payload. Railway builds cannot reach your project's private network, so the Docker build starts a temporary Postgres inside the build container, applies the migrations, prerenders the empty site and deletes that database. At runtime pages are rendered from your real database and refreshed whenever you publish (on-demand revalidation).

**Build memory.** The Next.js production build needs roughly 2-4 GB of memory and runs on Railway's builders. At runtime Payload uses about 300-500 MB, so it fits Trial's 1 GB per service; very large sites may need more.

**Public URL.** After adding a custom domain, set `NEXT_PUBLIC_SERVER_URL` to `https://{your-domain}`. The server reads it at runtime (through `SERVER_URL`) after the redeploy; the browser bundle gets it on the next build, so also deploy the latest commit (Railway reuses the old image when only variables change).

**Changing the schema.** Collections live in code (`services/payload/src`). Eject the template repository to your account, run Payload locally against a Postgres database, change collections, run `npm run payload migrate:create`, commit the new migration and push. Railway rebuilds and Payload applies new migrations on start.

**Media.** Uploads go to the Railway Bucket and are served through `/api/media/file/...` with Payload's access control, so the bucket stays private.

**Admin password reset.** Set `ADMIN_PASSWORD` (12-128 characters) and `RESET_ADMIN_PASSWORD=true` on the Payload service, redeploy, log in, then set it back to `false`. A password that is too short never fails the deploy: a new site gets a random password nobody knows and the log explains this reset.

**E-mail.** The starter sends no e-mail. Payload's e-mail adapters include Resend (HTTP API), which works on every Railway plan; SMTP works only on Railway Pro.

**Scaling.** The Payload service keeps no local files, so it can run more replicas; Next.js' page cache is per replica.

**Versions and upgrades.** All `@payloadcms/*` packages and `payload` are pinned to 3.93.0 (the version the official template's migration was generated with), Next.js to 16.4.6, locked in `package-lock.json`. To upgrade, bump all Payload packages together in your fork, regenerate the lockfile, add a migration if the schema changed, and push. Back up Postgres first.

**Licence.** Payload and its templates are MIT licensed. This is a community template, not affiliated with or endorsed by the Payload project.

### Why Deploy Payload on Railway?

Railway builds your Payload project from Git and runs it next to a private Postgres and Bucket with generated secrets and HTTPS, so you get a full website, admin panel and API from one template and redeploy with every push.
