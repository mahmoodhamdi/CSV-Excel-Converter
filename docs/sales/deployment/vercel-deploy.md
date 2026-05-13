# Deployment — Vercel

For teams that want a managed deployment without owning servers.

**Estimated setup time:** 5 minutes.

## One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmahmoodhamdi%2FCSV-Excel-Converter)

Click the button above, sign in to Vercel, and follow the prompts.

## Manual deploy

```bash
npm i -g vercel
git clone https://github.com/mahmoodhamdi/CSV-Excel-Converter.git
cd CSV-Excel-Converter
vercel
```

Follow the prompts:

1. Set up and deploy? **Y**
2. Which scope? **Your team**
3. Link to existing project? **N**
4. Project name: **csv-converter** (or your choice)
5. Framework preset: **Next.js** (auto-detected)
6. Override settings? **N**

## Environment variables

After the first deploy, configure these in **Project Settings → Environment Variables**:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | Yes | `https://your-deployment.vercel.app` |
| `BRAND` | No | `base` (default) or one of the 5 verticals |
| `NEXT_PUBLIC_BRAND` | No | Same value as `BRAND` — exposed to client |
| `UPSTASH_REDIS_REST_URL` | No | For distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Pair with above |
| `NEXT_PUBLIC_SENTRY_DSN` | No | For error tracking |
| `SENTRY_ORG` | No | For source map upload |
| `SENTRY_PROJECT` | No | For source map upload |
| `SENTRY_AUTH_TOKEN` | No | For source map upload — set as a **Secret** |

Click **Save**, then redeploy.

## Custom domain

**Project Settings → Domains → Add**.

Set up DNS as Vercel instructs (A record or CNAME). HTTPS is automatic.

## Vercel-specific gotchas

### Cold starts

Serverless API routes have ~200ms cold start. Acceptable for casual conversions; use the Docker deployment if you need consistent < 100ms latency.

### Function timeout

Default 10s on free tier, 60s on Pro. Large file conversions (50MB+) approach this. If your users frequently upload near-limit files, deploy via Docker instead.

### Edge runtime

`/api/health` and `/api/formats` are edge-compatible. The conversion routes need Node runtime (xlsx parsing is too heavy for edge).

### Branding per environment

If you sell to multiple customers and want each on their own Vercel project:

1. Fork the repo per customer (or use the same fork).
2. Set `BRAND` and `NEXT_PUBLIC_BRAND` to their vertical in each project's env.
3. Each gets their own domain + branding.

For more elegant multi-tenancy at scale, talk to us about white-label.

## Pricing impact

Vercel free tier covers ~1k conversions/day. Pro ($20/user/month) covers ~10k/day. Beyond that, switch to Docker on a $5/month VPS — it's cheaper.

## Logs and observability

- Real-time logs: `vercel logs` or dashboard
- Long-term retention: configure Sentry (recommended) or Logflare
