# Stage 1: Build
FROM node:16.16.0-bullseye-slim AS builder

RUN apt-get update && \
    apt-get install -y \
        zlib1g-dev \
        libpng-dev \
        libgl1 \
        libxi6

WORKDIR /app
# WORKDIR /app/geomapviewer-main
# COPY . .
ADD https://github.com/wmo-raf/geomapviewer/archive/refs/heads/main.tar.gz ./
RUN tar -xzf ./main.tar.gz -C ./
WORKDIR /app/geomapviewer-main

# Env Variables that should be available at build time
ARG ANALYTICS_PROPERTY_ID
ENV ANALYTICS_PROPERTY_ID $ANALYTICS_PROPERTY_ID

ARG BITLY_TOKEN
ENV BITLY_TOKEN $BITLY_TOKEN

ARG DEBUG
ENV DEBUG $DEBUG

ARG FEATURE_ENV
ENV FEATURE_ENV $FEATURE_ENV

ARG GOOGLE_CUSTOM_SEARCH_CX
ENV GOOGLE_CUSTOM_SEARCH_CX $GOOGLE_CUSTOM_SEARCH_CX

ARG GOOGLE_SEARCH_API_KEY
ENV GOOGLE_SEARCH_API_KEY $GOOGLE_SEARCH_API_KEY

ARG BASE_PATH
ENV BASE_PATH $BASE_PATH

ARG CMS_API
ENV CMS_API $CMS_API

# Install packages
RUN yarn install

# Build
RUN yarn build

# Stage 2: run
FROM node:16.16.0-bullseye-slim
WORKDIR /app
COPY --from=builder /app/geomapviewer-main/.next ./.next
COPY --from=builder /app/geomapviewer-main/public ./public
COPY --from=builder /app/geomapviewer-main/node_modules ./node_modules
COPY --from=builder /app/geomapviewer-main/package.json ./

CMD ["yarn", "start"]