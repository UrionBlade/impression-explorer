# Build context is the repo root (pnpm workspace + lockfile live there).
# --- build stage ---
FROM node:22-alpine AS build
WORKDIR /repo
RUN corepack enable
# Manifests first for a cached install layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/api/package.json apps/api/package.json
RUN pnpm install --frozen-lockfile --filter @impression-explorer/web...
COPY apps/web apps/web
RUN pnpm --filter @impression-explorer/web build

# --- run stage: static SPA behind nginx ---
FROM nginx:alpine AS run
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 80
