# 使用更轻量的 Node.js 镜像
FROM node:20-alpine AS base

# 安装必要依赖
RUN apk add --no-cache openssl

WORKDIR /app

# 1. 依赖阶段
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# 2. 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建 Next.js 应用
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. 运行阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 创建必要目录并设置权限
RUN mkdir -p /app/data /app/public/uploads

# 拷贝构建产物
COPY --from=builder /app/public ./public
# 拷贝 standalone 输出以大幅提升运行效率和降低内存
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 拷贝所需的 node_modules 和 prisma 以支持 db push
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# 启动脚本：使用 node server.js 代替更耗资源的 npm start
CMD npx prisma db push && node server.js
