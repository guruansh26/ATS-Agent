FROM node:20-alpine AS builder
WORKDIR /repo
RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/package.json ./apps/api/package.json
COPY apps/worker ./apps/worker

RUN npm install --workspaces --include-workspace-root --no-audit --no-fund
RUN npx --workspace @ats/api prisma generate
RUN npx --workspace @ats/worker tsc -p tsconfig.json

FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/package.json ./package.json
COPY --from=builder /repo/packages ./packages
COPY --from=builder /repo/apps/worker/dist ./apps/worker/dist
COPY --from=builder /repo/apps/worker/package.json ./apps/worker/package.json
COPY --from=builder /repo/apps/api/prisma ./apps/api/prisma

CMD ["node", "apps/worker/dist/apps/worker/src/worker.js"]
