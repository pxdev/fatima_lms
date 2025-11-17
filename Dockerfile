FROM node:22-alpine AS base

WORKDIR /app
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_PORT=3000

FROM base AS deps
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
ENV NODE_ENV=development
COPY package.json package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json ./package-lock.json
COPY --from=deps /app/node_modules ./node_modules
RUN npm prune --omit=dev && npm cache clean --force
COPY --from=build /app/.output ./.output
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
