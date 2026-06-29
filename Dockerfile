# ──────────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Install build tools needed for native addons (e.g. bufferutil/utf-8-validate
# from ws/@fastify/websocket) on alpine + non-amd64 arches where no prebuilt
# binary exists and node-gyp must compile from source.
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install all dependencies (including dev)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source
COPY tsconfig.json ./
COPY src ./src/

# Build TypeScript
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# ──────────────────────────────────────────────
# Stage 2: Production
# ──────────────────────────────────────────────
FROM node:22-alpine AS production

# Add non-root user
RUN addgroup -g 1001 -S teleflow && \
    adduser -S teleflow -u 1001 -G teleflow

# Install runtime deps only (for native modules)
RUN apk add --no-cache tini

WORKDIR /app

# Copy built files
COPY --from=builder --chown=teleflow:teleflow /app/dist ./dist/
COPY --from=builder --chown=teleflow:teleflow /app/node_modules ./node_modules/
COPY --from=builder --chown=teleflow:teleflow /app/package.json ./
COPY --from=builder --chown=teleflow:teleflow /app/prisma ./prisma/

# Create data directory for SQLite
RUN mkdir -p /app/data && chown teleflow:teleflow /app/data

ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/teleflow.db

# Expose port
EXPOSE 3000

# Switch to non-root user
USER teleflow

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Run migrations then start
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/index.js"]
