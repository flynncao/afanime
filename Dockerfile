FROM node:22-bookworm AS dep-builder
# Here we use the non-slim image to provide build-time deps (compilers and python), thus no need to install later.
# This effectively speeds up qemu-based cross-build.

WORKDIR /app

# place ARG statement before RUN statement which need it to avoid cache miss
ARG USE_CHINA_NPM_REGISTRY=0
RUN \
    set -ex && \
    if [ "$USE_CHINA_NPM_REGISTRY" = 1 ]; then \
        echo 'use npm mirror' && \
        npm config set registry https://registry.npmmirror.com && \
        yarn config set registry https://registry.npmmirror.com && \
        pnpm config set registry https://registry.npmmirror.com ; \
    fi;

COPY ./tsconfig.json /app/
COPY ./tsup.config.ts /app/
COPY ./pnpm-lock.yaml /app/
COPY ./package.json /app/

# lazy install Chromium to avoid cache miss, only install production dependencies to minimize the image size
RUN \
    set -ex && \
    corepack disabled pnpm && \
		npm install -g pnpm@latest && \
    pnpm install --frozen-lockfile && \
    pnpm rb

# --------------------------------------------------------------
FROM node:22-bookworm-slim AS docker-minifier

WORKDIR /app

COPY . /app
COPY --from=dep-builder /app /app

RUN \
    set -ex && \
    # cp /app/scripts/docker/minify-docker.js /minifier/ && \
    # export PROJECT_ROOT=/app && \
    # node /minifier/minify-docker.js && \
    # rm -rf /app/node_modules /app/scripts && \
    # mv /app/app-minimal/node_modules /app/ && \
    # rm -rf /app/app-minimal && \
    npm run build && \
    ls -la /app && \
    du -hd1 /app

# --------------------------------------------------------------
FROM node:22-bookworm-slim AS app

LABEL org.opencontainers.image.authors="https://github.com/flynncao/afanime"

ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

WORKDIR /app

# install deps first to avoid cache miss or disturbing buildkit to build concurrently
RUN \
    set -ex && \
    apt-get update && \
    apt-get install -yq --no-install-recommends \
        dumb-init git curl \
    && \
    rm -rf /var/lib/apt/lists/*

# Copy the necessary files
COPY --from=docker-minifier /app /app

CMD ["npm", "run", "start"]

