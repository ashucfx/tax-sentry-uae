# ── Stage 1: Install ─────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/package.json
RUN npm ci --workspace=apps/api --ignore-scripts

# ── Stage 2: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

# Generate Prisma client then build NestJS
RUN cd apps/api && npx prisma generate
RUN npm run build --workspace=apps/api

# ── Stage 3: Production ──────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production

# Non-root user (security)
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

# Copy root node_modules (where npm hoists most packages, including @nestjs/core)
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
# Copy workspace-specific node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./apps/api/node_modules
# Copy built dist and prisma schema
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/prisma ./apps/api/prisma

USER nestjs

EXPOSE 3001

# Change to the API workspace directory
WORKDIR /app/apps/api

# Resolve any previously-failed migration, then apply pending ones, then start.
# --applied marks the migration as successfully done so migrate deploy can proceed.
# The || true ensures we don't fail if it's already resolved on future deploys.
CMD ["sh", "-c", "npx --yes prisma@5.22.0 migrate resolve --applied 20260621_add_notifications_support || true && npx --yes prisma@5.22.0 migrate deploy && node dist/src/main"]
