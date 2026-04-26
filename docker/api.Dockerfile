# --- Builder ---
FROM node:20-alpine AS builder
WORKDIR /repo

RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

RUN npm install --workspaces --include-workspace-root --no-audit --no-fund
RUN npx --workspace @ats/api prisma generate
RUN npx --workspace @ats/api tsc -p tsconfig.json

# --- Runtime ---
FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/package.json ./package.json
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/api/dist ./apps/api/dist
COPY --from=builder /repo/apps/api/package.json ./apps/api/package.json
COPY --from=builder /repo/apps/api/prisma ./apps/api/prisma
COPY --from=builder /repo/apps/api/node_modules ./apps/api/node_modules

EXPOSE 4000
CMD ["node", "apps/api/dist/apps/api/src/server.js"]
