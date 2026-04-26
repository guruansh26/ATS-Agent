FROM node:20-alpine AS builder
WORKDIR /repo

COPY package.json package-lock.json* ./
COPY apps/web ./apps/web

RUN npm install --workspaces --include-workspace-root --no-audit --no-fund

ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_API_KEY=dev-recruiter-key
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_KEY=$NEXT_PUBLIC_API_KEY

RUN npm --workspace @ats/web run build

FROM node:20-alpine AS runtime
WORKDIR /repo
ENV NODE_ENV=production

COPY --from=builder /repo/node_modules ./node_modules
COPY --from=builder /repo/package.json ./package.json
COPY --from=builder /repo/apps/web ./apps/web

EXPOSE 3000
CMD ["npm", "--workspace", "@ats/web", "run", "start"]
