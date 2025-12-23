# Phase 7: DevOps & CI/CD Enhancement

## Priority: LOW
## Estimated Effort: Medium
## Dependencies: Phase 1, Phase 4

---

## Overview

This phase enhances the CI/CD pipeline with security scanning, code quality gates, automated deployments, and improved Docker configuration.

---

## Checklist

### 7.1 GitHub Actions Enhancement
- [ ] Add CodeQL security scanning
- [ ] Add dependency vulnerability scanning
- [ ] Add code coverage enforcement
- [ ] Add branch protection rules
- [ ] Add automated releases

### 7.2 Code Quality Gates
- [ ] Add SonarQube/SonarCloud integration
- [ ] Enforce minimum coverage thresholds
- [ ] Add lint-staged for pre-commit
- [ ] Add commitlint for commit messages
- [ ] Add PR template

### 7.3 Docker Improvements
- [ ] Create .dockerignore file
- [ ] Optimize Dockerfile layers
- [ ] Add health check
- [ ] Add multi-stage build optimization
- [ ] Add security scanning for images

### 7.4 Environment Configuration
- [ ] Create .env.example
- [ ] Document all environment variables
- [ ] Add environment validation
- [ ] Add secrets management guide

### 7.5 Monitoring & Logging
- [ ] Add structured logging
- [ ] Add error tracking setup
- [ ] Add performance monitoring
- [ ] Add uptime monitoring

### 7.6 Deployment Automation
- [ ] Add staging environment workflow
- [ ] Add production deployment workflow
- [ ] Add rollback procedures
- [ ] Add deployment notifications

---

## Detailed Implementation

### 7.1 Enhanced CI/CD Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [published]
  workflow_dispatch:

env:
  NODE_VERSION: '20'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Code Quality
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

  # Unit & Integration Tests
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit -- --coverage

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true
          verbose: true

      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi

  # Security Scanning
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    steps:
      - uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript-typescript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:javascript-typescript"

      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk to check for vulnerabilities
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  # Build
  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: .next
          retention-days: 7

  # E2E Tests
  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Download build
        uses: actions/download-artifact@v4
        with:
          name: build
          path: .next

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report
          retention-days: 7

  # Docker Build & Push
  docker:
    name: Docker Build
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.event_name != 'pull_request'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=sha

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./docker/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  # Deploy to Staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: [docker, e2e]
    if: github.ref == 'refs/heads/develop'
    environment:
      name: staging
      url: https://staging.your-domain.com
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying to staging..."
          # Add your deployment commands here

      - name: Notify deployment
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deployed to staging: ${{ github.sha }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}

  # Deploy to Production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [docker, e2e]
    if: github.event_name == 'release'
    environment:
      name: production
      url: https://your-domain.com
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add your deployment commands here

      - name: Notify deployment
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Deployed to production: ${{ github.event.release.tag_name }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### 7.2 Pre-commit Hooks

```json
// package.json additions
{
  "scripts": {
    "prepare": "husky install",
    "lint-staged": "lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  },
  "commitlint": {
    "extends": ["@commitlint/config-conventional"]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged

# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit ${1}
```

### 7.3 Docker Improvements

```dockerfile
# docker/Dockerfile - Optimized
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci --only=production

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
```

```gitignore
# .dockerignore
.git
.gitignore
.github
.vscode
node_modules
.next
.env*
!.env.example
*.md
!README.md
__tests__
coverage
playwright-report
.husky
```

```yaml
# docker/docker-compose.yml - Enhanced
version: '3.8'

services:
  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### 7.4 Environment Configuration

```bash
# .env.example
# Application
NODE_ENV=development
PORT=3000

# Feature Flags
ENABLE_API_DOCS=true
ENABLE_BATCH_CONVERT=true

# Limits
MAX_FILE_SIZE_MB=50
MAX_ROWS=100000

# Monitoring (optional)
SENTRY_DSN=
AXIOM_TOKEN=

# Analytics (optional)
NEXT_PUBLIC_GA_ID=
```

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
  MAX_ROWS: z.coerce.number().default(100000),
  ENABLE_API_DOCS: z.coerce.boolean().default(true),
  ENABLE_BATCH_CONVERT: z.coerce.boolean().default(true),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = validateEnv();
```

### 7.5 Logging Setup

```typescript
// src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  context?: Record<string, unknown>;
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private formatEntry(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'production') {
      return JSON.stringify(entry);
    }
    return `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    const formatted = this.formatEntry(entry);

    switch (level) {
      case 'error':
        console.error(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      default:
        console.log(formatted);
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>) {
    this.log('warn', message, context);
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context);
  }
}

export const logger = new Logger();
```

### 7.6 PR Template

```markdown
<!-- .github/pull_request_template.md -->
## Description

Brief description of changes.

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)

## Additional Notes
```

---

## Files to Create/Modify

### New Files:
- `.github/workflows/ci-cd.yml` (replace existing)
- `.github/pull_request_template.md`
- `.dockerignore`
- `.env.example`
- `src/lib/env.ts`
- `src/lib/logger.ts`
- `.husky/pre-commit`
- `.husky/commit-msg`

### Modified Files:
- `docker/Dockerfile`
- `docker/docker-compose.yml`
- `package.json` (add husky, lint-staged, commitlint)

### New Dependencies:
- `husky`
- `lint-staged`
- `@commitlint/cli`
- `@commitlint/config-conventional`

---

## Prompt for Claude Code

```
Execute Phase 7: DevOps & CI/CD Enhancement for CSV-Excel-Converter

Read the plan at plans/07-phase-devops.md and implement:

1. Enhance GitHub Actions workflow:
   - Update .github/workflows/ci-cd.yml
   - Add CodeQL security scanning
   - Add coverage threshold enforcement
   - Add Docker build with Trivy scanning
   - Add staging/production deployment jobs

2. Add pre-commit hooks:
   - Install husky, lint-staged, commitlint
   - Create .husky/pre-commit
   - Create .husky/commit-msg
   - Update package.json with scripts

3. Improve Docker configuration:
   - Create .dockerignore
   - Optimize docker/Dockerfile
   - Add health check
   - Update docker-compose.yml

4. Environment configuration:
   - Create .env.example
   - Create src/lib/env.ts with Zod validation

5. Add logging:
   - Create src/lib/logger.ts
   - Add structured logging

6. Add PR template:
   - Create .github/pull_request_template.md

Run npm run lint to verify no issues.
```
