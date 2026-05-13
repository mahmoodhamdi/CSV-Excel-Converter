# Client Handover Checklist

Use this when closing a sale and onboarding a new customer. Walk through every item with the customer; don't mark complete until they confirm.

## Pre-handover (before contract signing)

- [ ] Tier and price confirmed in writing
- [ ] Vertical(s) chosen (if applicable)
- [ ] Brand assets received from customer:
  - [ ] Logo (SVG preferred, PNG fallback)
  - [ ] Primary + accent colors (hex)
  - [ ] Tagline in English + Arabic if applicable
  - [ ] Domain name(s) they want to use
- [ ] Hosting decision: self-hosted vs managed
- [ ] Locale defaults confirmed (en, ar, or both)
- [ ] Payment terms agreed and invoice sent

## Day 0 — handover

- [ ] Source code transfer
  - [ ] Git bundle (`git bundle create`) emailed
  - [ ] OR private GitHub repo invitation sent
- [ ] Deployment artifacts
  - [ ] Pre-built Docker image with their brand baked in
  - [ ] `docker-compose.yml` with their domain configured
  - [ ] `.env` template filled with their values
- [ ] Brand assets handover
  - [ ] Logos placed in `public/brand/<their-id>/`
  - [ ] Colors set in `brands/<their-id>/brand.config.ts`
  - [ ] Translations reviewed and edited
- [ ] License key
  - [ ] Generated (`npm run gen-api-key`) if Pro tier or above
  - [ ] Sent via encrypted channel (1Password share / GPG / Signal)
- [ ] DNS / domain
  - [ ] DNS records documented if we're configuring
  - [ ] SSL certificate strategy (Let's Encrypt / customer-supplied)
- [ ] First successful conversion verified together on call

## Day 0–7 — onboarding

- [ ] Training session scheduled (2-hour video call)
- [ ] Documentation walkthrough completed
- [ ] Customer's team added to support portal (Slack channel created)
- [ ] Monitoring set up (their Sentry account, or pointed at our shared instance for managed tier)
- [ ] Backup strategy documented (if self-hosted with persistent data)
- [ ] Day-7 check-in call scheduled

## Day 7 — check-in

- [ ] What's working
- [ ] What's confusing
- [ ] Bugs found?
- [ ] Feature requests captured
- [ ] First invoice paid

## Day 30 — first review

- [ ] Conversion volume vs. estimated
- [ ] Any SLA misses (managed tier only)
- [ ] Support ticket review
- [ ] Plan for next 60 days
- [ ] Upsell opportunities noted

## Day 90 — quarterly review

- [ ] Renewal conversation (for annual plans, 90 days before renewal)
- [ ] NPS-style: would they refer us?
- [ ] Case study consent (with redactions if needed)
- [ ] Roadmap input

## Contract close — termination steps (if applicable)

- [ ] Final invoice paid
- [ ] Final data export delivered (if managed tier had persisted data)
- [ ] Customer source code archive frozen (read-only access for 90 days)
- [ ] Slack channel archived
- [ ] License key revoked

---

## Templates

### Day-0 handover email subject

`[ClientName] Welcome to <Vertical> — your deployment is ready`

### Day-7 check-in email subject

`[ClientName] Quick check-in on your <Vertical> rollout`

### Renewal email subject

`[ClientName] Your <Vertical> license renews <date> — let's review`
