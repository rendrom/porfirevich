# syntax=docker/dockerfile:1.7

FROM node:24-bookworm-slim AS client-deps
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN --mount=type=cache,id=client-npm,target=/root/.npm npm ci

FROM node:24-bookworm-slim AS client-build
WORKDIR /app
COPY --from=client-deps /app/client/node_modules ./client/node_modules
COPY shared ./shared
COPY client ./client
RUN npm --prefix client run build

FROM node:24-bookworm-slim AS server-build
ENV PUPPETEER_SKIP_DOWNLOAD=true
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN --mount=type=cache,id=server-build-npm,target=/root/.npm npm ci
WORKDIR /app
COPY shared ./shared
COPY server ./server
RUN npm --prefix server run build

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ca-certificates \
      chromium \
      dumb-init \
      fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN --mount=type=cache,id=server-runtime-npm,target=/root/.npm npm ci --omit=dev \
    && npm cache clean --force

COPY --from=server-build --chown=node:node /app/server/dist ./dist
COPY --from=client-build --chown=node:node /app/client/dist /app/client/dist

RUN mkdir -p /app/media && chown node:node /app/media

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server/src/prod.js"]
