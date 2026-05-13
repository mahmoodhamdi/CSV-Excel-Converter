# Deployment — Docker Compose stack with Sentry + Redis

For teams that want centralized error tracking and distributed rate limiting.

**Estimated setup time:** 30 minutes.

## Prerequisites

- A Linux server with Docker and Docker Compose (`docker compose version` should print v2+).
- 4 vCPU / 4 GB RAM recommended for the full stack.
- An Upstash Redis project (free tier is fine for low volume): https://upstash.com
- A Sentry project: https://sentry.io

## 1. Directory layout

```
/opt/converter/
├── docker-compose.yml
├── .env
└── data/
    └── api-keys.json
```

## 2. `.env`

```bash
# Public URL
NEXT_PUBLIC_BASE_URL=https://converter.yourdomain.com

# Brand (base, accounting-bridge, edu-grades, dev-data-kit, crm-sync, invoice-flow)
BRAND=base

# Rate limiting via Upstash Redis
UPSTASH_REDIS_REST_URL=https://YOUR-REDIS.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR-TOKEN
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://abc@xyz.ingest.sentry.io/123
SENTRY_ORG=your-org
SENTRY_PROJECT=csv-converter

# Pro tier — API key auth
API_KEYS_FILE=/data/api-keys.json
```

## 3. `docker-compose.yml`

```yaml
services:
  converter:
    image: mwmsoftware/csv-converter-${BRAND:-base}:latest
    container_name: converter
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./data:/data:ro
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 256M
```

## 4. Start

```bash
cd /opt/converter
docker compose up -d
docker compose logs -f converter
```

Wait until you see `Ready` in the logs, then verify:

```bash
curl -s http://localhost:3000/api/health
```

## 5. Verify Sentry capture

Trigger a deliberate error:

```bash
curl -X POST http://localhost:3000/api/convert \
  -H 'Content-Type: application/json' \
  -d '{"data":"","inputFormat":"csv","outputFormat":"json"}'
```

A validation error should appear in your Sentry project within ~1 minute.

## 6. Verify Redis rate limiting

```bash
for i in {1..120}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/formats
done | sort | uniq -c
```

You should see a mix of `200` and `429` once you cross the configured limit.

## 7. Generate API keys (Pro tier)

```bash
docker compose exec converter node scripts/gen-api-key.js \
  --label="customer-alpha" \
  --tier=pro
```

Output goes to `/data/api-keys.json` (bcrypt-hashed).

## 8. Updates

```bash
docker compose pull
docker compose up -d
```

Rolling restart with no downtime (Caddy will retry the failed health check briefly):

```bash
docker compose up -d --force-recreate --no-deps converter
```

## Resource sizing guide

| Conversions/day | RAM | CPU |
|---|---|---|
| < 10k | 512 MB | 1 vCPU |
| 10k – 100k | 1 GB | 2 vCPU |
| 100k – 1M | 2 GB | 4 vCPU |
| > 1M | Horizontally scale: 2× containers behind a load balancer |
