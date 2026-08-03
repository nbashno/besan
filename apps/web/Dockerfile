# ===== البناء =====
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile || pnpm install
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
WORKDIR /app/apps/web
RUN pnpm build

# ===== التشغيل =====
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm@9
COPY --from=builder /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/next.config.js ./apps/web/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
