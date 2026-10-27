# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1 \
    DATABASE_URL=file:/app/data/blog.db \
    UPLOAD_DIR=/app/data/uploads

# Dependencies (better-sqlite3 is compiled if no prebuilt binary matches).
FROM base AS deps
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts && npm rebuild better-sqlite3

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build && npm prune --omit=dev --ignore-scripts

FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000
RUN apk add --no-cache su-exec \
    && addgroup -S -g 1001 nodejs \
    && adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app ./
# /app/data must be a persistent volume: it holds the SQLite database and uploaded images.
# The entrypoint starts as root only to fix the volume's ownership, then runs as `nextjs`.
EXPOSE 3000
CMD ["sh", "scripts/docker-start.sh"]
