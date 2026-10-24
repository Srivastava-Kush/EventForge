# -------------------------------------------------------------
# Stage 1: Build Frontend Assets
# -------------------------------------------------------------
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Runtime
# -------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code
COPY server.js eslint.config.js ./
COPY src/ ./src/
COPY prompts/ ./prompts/

# Copy built frontend assets to serve statically
COPY --from=frontend-builder /app/frontend/dist ./public

# Use unprivileged user for security
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "server.js"]
