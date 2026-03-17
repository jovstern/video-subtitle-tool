# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install -g npm@latest && npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:22-slim AS runtime
WORKDIR /app

COPY package*.json ./
RUN npm install -g npm@latest && npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Persistent storage for uploads & keyframes
RUN mkdir -p /app/storage
VOLUME ["/app/storage"]

ENV PORT=8000
EXPOSE 8000

CMD ["node", "dist/index.js"]
