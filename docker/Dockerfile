# docker/Dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Brand selection — passed via --build-arg BRAND=<vertical>
ARG BRAND=base
ARG NEXT_PUBLIC_BRAND=base
ENV BRAND=${BRAND}
ENV NEXT_PUBLIC_BRAND=${NEXT_PUBLIC_BRAND}

RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Brand baked into the image (matches builder ARG)
ARG BRAND=base
ARG NEXT_PUBLIC_BRAND=base
ENV BRAND=${BRAND}
ENV NEXT_PUBLIC_BRAND=${NEXT_PUBLIC_BRAND}

LABEL org.opencontainers.image.title="CSV Excel Converter"
LABEL org.opencontainers.image.description="Privacy-first data converter with REST API"
LABEL org.opencontainers.image.vendor="MWM Software Solutions"
LABEL org.opencontainers.image.licenses="MIT"
LABEL com.mwm.brand="${BRAND}"

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
