# syntax=docker/dockerfile:1

FROM node:26-alpine AS deps
WORKDIR /app
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/express_restfull?schema=public"
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

FROM node:26-alpine AS builder
WORKDIR /app
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/express_restfull?schema=public"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:26-alpine AS runtime
WORKDIR /app

RUN addgroup -S app && adduser -S -G app -u 10001 app

ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY docs ./docs

USER app
EXPOSE 8080

FROM runtime AS api
CMD ["node", "dist/server.js"]

FROM runtime AS worker
CMD ["node", "dist/worker.js"]
