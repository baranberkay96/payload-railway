# NOTICE: Payload template

## Software deployed

| Component | Licence | Source |
|---|---|---|
| Payload 3.93.0 (`payload`, `@payloadcms/*`) | MIT (© Payload CMS, Inc.) | npm, locked in `services/payload/package-lock.json` |
| Website starter (everything under `services/payload/` not listed below) | MIT (© Payload CMS, Inc.) | `payloadcms/payload` `templates/with-vercel-website` at tag `v3.94.0` |
| Next.js 16.4.6, React 19.2.9 | MIT | npm |
| Node.js 22.23.5 (Alpine 3.23) | MIT and others | Docker Official Image `node:22.23.5-alpine3.23` |
| PostgreSQL 18 (runtime) and Alpine `postgresql18` (build-time throwaway database only) | PostgreSQL Licence | Railway's `postgres-ssl` image; Alpine package repository |

MIT licence text (Payload): Copyright (c) 2018-2025 Payload CMS, Inc. Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.

## Changes to the upstream starter

- `@payloadcms/db-vercel-postgres` → `@payloadcms/db-postgres` (connection from `DATABASE_URL`, `prodMigrations`); the bundled migration's import changed accordingly (SQL unchanged).
- `@payloadcms/storage-vercel-blob` → `@payloadcms/storage-s3` (Railway Bucket); the admin import map entry changed accordingly.
- `next.config.ts`: `output: 'standalone'`, image remote pattern from `NEXT_PUBLIC_SERVER_URL`.
- `payload.config.ts`: `onInit` first-admin bootstrap.
- Removed: Vercel config, test suites (Playwright/Vitest), ESLint/Prettier config, upstream Dockerfile and docker-compose, upstream README; test/lint dev dependencies removed from `package.json`.

## Written for this template

- `services/payload/Dockerfile`, `railway/build.sh`, `railway/start.mjs`, `src/railway/bootstrap.ts`, `src/app/health/route.ts`, `.env.example`, `template.json`, `README.md`, `TEMPLATE.md`, this file. MIT, © 2026 the template author.

## Upstream sources checked (2026-11-20, read only; nothing was executed locally)

- `payloadcms/payload` at `v3.94.0`: `templates/website/package.json`, `templates/with-vercel-website/*` (config, migrations, Dockerfile, env example), `templates/with-postgres/src/migrations/*`; at `v3.93.0`: `packages/storage-s3/src/index.ts` and `exports/client.ts`, `packages/plugin-cloud-storage/src/fields/getFields.ts` (no schema change without a prefix).
- npm registry: `payload@3.93.0` dependencies (CLI loads TypeScript config with `tsx`); dependency resolution for `package-lock.json` (`npm install --package-lock-only --ignore-scripts`; no package code was run).
- Alpine package index: `postgresql18` in v3.23.

## Market templates reviewed

`L8TUlT` (Payload CMS V3 website builder, repo `rpuls/payload-3-boilerplate`), `3QUkyF` (repo `madebyjonny/payload-template`), `payload-cms-4-website-beta`: read for topology and variables only. Nothing was copied.

## Names and affiliation

Payload is a trademark of its owner. This is a community template, not affiliated with or endorsed by the Payload project.
