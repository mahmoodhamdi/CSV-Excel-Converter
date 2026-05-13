# Deployment — Docker on a single server

The simplest deployment. Suitable for teams running the converter on one VPS or on-prem server.

**Estimated setup time:** 10 minutes.

## Prerequisites

- A Linux server (Ubuntu 22.04+ / Debian 12+ / Rocky 9+) with at least:
  - 2 vCPU
  - 2 GB RAM
  - 10 GB disk
- Docker installed (`curl -fsSL https://get.docker.com | sh`)
- A domain name pointing at the server (optional but recommended for HTTPS)
- Port 80 + 443 open if using HTTPS, or just 3000 for local testing

## 1. Pull the image

For the base brand:

```bash
docker pull mwmsoftware/csv-excel-converter:latest
```

For a vertical bundle:

```bash
docker pull mwmsoftware/csv-converter-accounting-bridge:latest
# or edu-grades, dev-data-kit, crm-sync, invoice-flow
```

## 2. Run

Minimal:

```bash
docker run -d \
  --name converter \
  -p 3000:3000 \
  --restart unless-stopped \
  mwmsoftware/csv-excel-converter:latest
```

Verify: `curl http://localhost:3000/api/health` → should return `{"status":"ok"}`.

## 3. Configure (recommended)

Create `.env` next to your `docker run` command:

```bash
NEXT_PUBLIC_BASE_URL=https://converter.yourdomain.com
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Optional: Sentry error tracking
NEXT_PUBLIC_SENTRY_DSN=https://...

# Optional: Upstash Redis for distributed rate limiting
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Pro tier only — API key auth
API_KEYS_FILE=/data/api-keys.json
```

Then:

```bash
docker run -d \
  --name converter \
  -p 3000:3000 \
  --env-file .env \
  -v /opt/converter-data:/data \
  --restart unless-stopped \
  mwmsoftware/csv-excel-converter:latest
```

## 4. HTTPS via Caddy (recommended)

If you have a domain, the easiest way to get HTTPS is Caddy.

`/etc/caddy/Caddyfile`:

```
converter.yourdomain.com {
  reverse_proxy localhost:3000
}
```

```bash
sudo apt install -y caddy
sudo systemctl reload caddy
```

Caddy obtains and renews Let's Encrypt certificates automatically.

## 5. Updates

```bash
docker pull mwmsoftware/csv-excel-converter:latest
docker stop converter
docker rm converter
# Re-run the docker run command from step 3
```

For zero-downtime, run two containers on different ports behind Caddy with rolling restart.

## 6. Backups

The converter is mostly stateless. Backups are needed only if you've enabled:

- API key storage (`API_KEYS_FILE`)
- Local history (browser-only by default — no server backup needed)

Back up `/opt/converter-data/`:

```bash
tar czf /backups/converter-$(date +%F).tgz /opt/converter-data/
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `EADDRINUSE` on port 3000 | Another process on 3000 | Change host port: `-p 3001:3000` |
| 502 from Caddy | Container not started | `docker logs converter` |
| Rate limit hits unexpectedly | Behind another reverse proxy and IPs aren't forwarded | Ensure `X-Forwarded-For` is set by upstream |
| Slow conversions of 50MB+ files | 2GB RAM not enough | Bump VPS to 4GB or use streaming endpoint |

## Health checks

`/api/health` returns `200` and a JSON body. Add to your monitoring system as a liveness probe.

```bash
curl -s http://localhost:3000/api/health | jq .
```
