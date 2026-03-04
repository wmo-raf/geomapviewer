# syntax=docker/dockerfile:1.5

############################
# Stage 1: Builder
############################
FROM node:20-bookworm-slim AS builder

RUN apt-get update && apt-get install -y \
    ca-certificates \
    zlib1g-dev \
    libpng-dev \
    libgl1 \
    libxi6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy local project
COPY . /app/geomapviewer-main

WORKDIR /app/geomapviewer-main

# Install dependencies with caching
RUN --mount=type=cache,target=/root/.yarn \
    YARN_CACHE_FOLDER=/root/.yarn \
    yarn --frozen-lockfile --network-timeout=100000 

# Build Next.js app
ENV NODE_ENV=production
RUN yarn build


############################
# Stage 2: Runtime
############################
FROM node:20-bookworm-slim

WORKDIR /app

# Copy build artifacts
COPY --from=builder /app/geomapviewer-main/.next ./.next
COPY --from=builder /app/geomapviewer-main/public ./public
COPY --from=builder /app/geomapviewer-main/node_modules ./node_modules
COPY --from=builder /app/geomapviewer-main/package.json ./

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
