# Sales Documentation

Reference docs for selling the converter. Customer-facing where noted; internal otherwise.

## Documents

| File | Audience | Purpose |
|---|---|---|
| [PRICING.md](PRICING.md) | Customer-facing | All pricing tiers (web licenses, API tiers, source buyout) |
| [competitors.md](competitors.md) | Internal | Positioning vs. convertcsv.com, Excel, Pandas, etc. |
| [SUPPORT.md](SUPPORT.md) | Customer-facing | Support plans, SLAs, escalation |
| [HANDOVER_CHECKLIST.md](HANDOVER_CHECKLIST.md) | Internal | Onboarding checklist for new customers |
| [deployment/docker-single-server.md](deployment/docker-single-server.md) | Customer-facing | Deploy on one VPS |
| [deployment/docker-compose-stack.md](deployment/docker-compose-stack.md) | Customer-facing | Deploy with Sentry + Redis |
| [deployment/vercel-deploy.md](deployment/vercel-deploy.md) | Customer-facing | One-click deploy to Vercel |
| [deployment/kubernetes-helm.md](deployment/kubernetes-helm.md) | Enterprise | Helm chart for k8s |

## Sales process — short version

1. **Lead in** — discovery call (15 min). Identify which vertical fits.
2. **Demo** — show the privacy-by-design proof test, the encoding auto-fix, and one vertical-specific template.
3. **Quote** — pull from PRICING.md, send via email with payment instructions.
4. **Close** — invoice paid → go to HANDOVER_CHECKLIST.md.
5. **Day 7 / 30 / 90 follow-ups** — from HANDOVER_CHECKLIST.md.

## Key talking points (memorize)

- **"Your data never leaves the browser when using the web UI — we have an automated test that proves it on every commit."**
- **"Self-hosted via Docker. One-line install. MIT-licensed base."**
- **"5 vertical bundles, each tuned for an industry. Same engine, different branding."**
- **"Bilingual Arabic-first. Windows-1256 auto-decode. Egyptian Tax Authority compliance built-in for InvoiceFlow + AccountingBridge."**

## Discounts policy

- **Volume:** 10% on 3-vertical bundle, 20% on full suite (already reflected in PRICING.md).
- **Multi-year:** 15% on 2-year prepay, 25% on 3-year prepay.
- **Non-profit / education:** 30% off any tier with proof.
- **MENA market:** EGP-denominated tiers available in PRICING.md.

## When to walk away

- Customer wants you to commit to a feature outside the 5 verticals before paying. Reply: "Let's start with a paid pilot of the closest existing vertical, then scope custom work as a follow-up engagement."
- Customer wants source for less than $30K. Reply: "Our license tiers start at $1,500. Source buyouts start at $30K. The middle ground is paid customization on top of a license."
- Customer balks at all tiers and asks for "just a one-month trial". Reply: "The base brand is free under MIT — they can try it forever. Pricing is for branded verticals and managed API, which we can't reasonably trial without effort on our side."

## Internal — current customers

Not tracked here. See `crm-export.csv` (gitignored).
