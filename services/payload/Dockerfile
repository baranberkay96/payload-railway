# syntax=docker/dockerfile:1
#
# Payload 3 website for Railway: Payload's official "website" template
# (templates/with-vercel-website at payloadcms/payload v3.94.0, MIT, packages
# 3.93.0) switched to @payloadcms/db-postgres and @payloadcms/storage-s3
# (Railway Bucket), built as a Next.js standalone server. Dependencies are
# locked in package-lock.json. See railway/build.sh for why the build runs a
# throwaway Postgres.
ARG NODE_IMAGE=node:22.23.5-alpine3.23@sha256:6868d4695b947ee120bffaa463fecd68cde370d7bfec92955e7c8ac576b4f475

FROM ${NODE_IMAGE} AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund --fetch-retries=5 --fetch-retry-mintimeout=20000

FROM ${NODE_IMAGE} AS builder
# postgresql18: only for the throwaway build database (not in the final image).
RUN apk add --no-cache libc6-compat postgresql18
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Railway passes service variables as build args. The public URL is compiled
# into the site (links, Open Graph, CORS); a new domain needs a redeploy.
ARG NEXT_PUBLIC_SERVER_URL
ENV NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL} \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--no-deprecation --max-old-space-size=4096"
RUN sh railway/build.sh && node --check railway/start.mjs

FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=:: \
    PORT=3000
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/railway/start.mjs ./railway/start.mjs
USER node
EXPOSE 3000
# Railway's init is PID 1; start.mjs forwards SIGTERM to the Next.js server.
CMD ["node", "railway/start.mjs"]
