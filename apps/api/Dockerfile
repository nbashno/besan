# ===== مرحلة البناء =====
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9
COPY package.json ./
COPY prisma ./prisma
RUN pnpm install
COPY . .
RUN pnpm prisma:generate && pnpm build

# ===== مرحلة التشغيل (صورة نحيلة) =====
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm@9
ENV NODE_ENV=production
COPY package.json ./
COPY prisma ./prisma
RUN pnpm install --prod && pnpm prisma:generate
COPY --from=builder /app/dist ./dist
EXPOSE 4000
CMD ["node", "dist/main.js"]
