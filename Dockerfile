FROM node:22-bookworm-slim AS build

WORKDIR /app

# place ARG statement before RUN statement which need it to avoid cache miss
ARG USE_CHINA_NPM_REGISTRY=0
RUN \
    set -ex && \
    if [ "$USE_CHINA_NPM_REGISTRY" = 1 ]; then \
        echo 'use npm mirror' && \
        npm config set registry https://registry.npmmirror.com ; \
    fi;

COPY package.json pnpm-lock.yaml ./

# Install the exact pnpm version pinned in package.json "packageManager" —
# single source of truth, no corepack signature issues, no version drift.
RUN \
    set -ex && \
    npm install -g "pnpm@$(node -p "require('./package.json').packageManager.split('@')[1]")" && \
    pnpm install --frozen-lockfile

COPY tsconfig.json tsup.config.ts ./
COPY src ./src

RUN \
    set -ex && \
    pnpm build && \
    pnpm prune --prod

# --------------------------------------------------------------
FROM node:22-bookworm-slim AS app

LABEL org.opencontainers.image.authors="https://github.com/flynncao/afanime"

ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

WORKDIR /app

RUN \
    set -ex && \
    apt-get update && \
    apt-get install -yq --no-install-recommends dumb-init && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/start.js"]
