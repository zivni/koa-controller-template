FROM node:24.12.0 AS base

FROM node:24.12.0 AS build_server
ENV NODE_ENV=production
WORKDIR /build/server

COPY server/yarn.lock server/package.json ./
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn,sharing=private yarn install --frozen-lockfile --production=false

COPY integrationInterfaces/ /build/integrationInterfaces
COPY server/ ./
RUN yarn tsc --noEmitOnError --outDir /build/outDir
RUN echo "Build server completed"

FROM node:24.12.0 AS build_frontend
ENV NODE_ENV=production
WORKDIR /build/frontend

COPY frontend/yarn.lock frontend/package.json ./
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn,sharing=private yarn install --frozen-lockfile --production=false

COPY integrationInterfaces/ /build/integrationInterfaces
COPY frontend/ /build/frontend
RUN yarn run build

FROM base AS production
ENV NODE_ENV=production
# see server/src/app.ts
ENV NODE_APP_INSTANCE=site 
WORKDIR /app/

COPY server/yarn.lock server/package.json ./
RUN --mount=type=cache,target=/root/.yarn YARN_CACHE_FOLDER=/root/.yarn,sharing=private yarn install --frozen-lockfile --production

COPY server/config/ ./config/
COPY --from=build_server /build/outDir/ ./
COPY server/public/ ./server/public
RUN rm -rf ./server/public/dist/
COPY --from=build_frontend /build/frontend/dist/ ./server/public/dist/

# Exposed port should be same as in server/config/*.json -> port (it can be omitted in the Dockerfile)
EXPOSE 4002 
CMD ["node", "/app/server/src/app.js"]