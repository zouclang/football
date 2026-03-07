# Stage 1: Install dependencies
FROM node:20-slim AS deps
WORKDIR /app

# Install openssl for Prisma and build tools for better-sqlite3
RUN apt-get update && apt-get install -y openssl python3 make g++

COPY package.json package-lock.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm ci

# Stage 2: Build the application
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npx prisma generate
RUN npm run build

# Stage 3: Production image
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create the uploads and data directory to ensure they exist
RUN mkdir -p public/uploads data

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Use a custom entrypoint script to handle migrations
COPY --from=builder /app/migrate-avatars.js ./migrate-avatars.js

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Startup command: run migrations then start the server
CMD ["node", "server.js"]
