# 使用更轻量的 Node.js 镜像
FROM node:20-alpine AS base

# 安装必要依赖（含 better-sqlite3 从源码编译所需的工具）
RUN apk add --no-cache openssl python3 make g++ sqlite-dev

WORKDIR /app

# 1. 依赖阶段
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./

# 强制 better-sqlite3 从源码编译，跳过从 GitHub 下载预编译包（避免网络超时）
ENV BETTER_SQLITE3_BUILD_FROM_SOURCE=1
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

# 3. 运行阶段（精简镜像，只含运行时必需内容）
FROM node:20-alpine AS runner
WORKDIR /app

# 运行时仅需 openssl 和 sqlite-libs
RUN apk add --no-cache openssl sqlite-libs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 创建必要目录并设置权限
RUN mkdir -p /app/data /app/public/uploads

# 拷贝构建产物
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 拷贝所需的 node_modules 和 prisma 以支持 db push
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# 启动：自动建表 + 启动服务
CMD npx prisma db push && node server.js
