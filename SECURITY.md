# Security Policy

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**Email:** mwm.softwars.solutions@gmail.com

Please include:

1. **Description** - Clear description of the vulnerability
2. **Steps to Reproduce** - Detailed steps to reproduce the issue
3. **Impact** - Potential impact and severity assessment
4. **Affected Versions** - Which versions are affected
5. **Suggested Fix** - If you have a proposed solution (optional)

### What to Expect

- **Response Time:** We will acknowledge your report within 48 hours
- **Updates:** We will keep you informed of our progress
- **Credit:** We will credit you in our release notes (if desired)
- **Disclosure:** Please allow us reasonable time to fix the issue before public disclosure

### Scope

The following are in scope for security reports:

- Injection vulnerabilities (SQL, XXE, XSS)
- Authentication/Authorization issues
- Data exposure vulnerabilities
- Server-side request forgery (SSRF)
- Denial of service vulnerabilities
- File upload vulnerabilities

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Security Measures

### Input Validation

All user input is validated using Zod schemas:

```typescript
// Example: Convert request validation
const convertRequestSchema = z.object({
  data: z.string().max(52428800), // 50MB limit
  inputFormat: z.enum(['csv', 'tsv', 'json', 'xlsx', 'xls', 'xml']).optional(),
  outputFormat: z.enum(['csv', 'tsv', 'json', 'xlsx', 'xls', 'xml', 'sql']),
  options: convertOptionsSchema.optional(),
});
```

**Protections:**
- Maximum data size: 50MB
- Allowed formats: Explicit allowlist
- Type validation: All inputs type-checked
- Pattern validation: Table names, sheet names validated

### XXE (XML External Entity) Protection

XML parsing is configured to prevent XXE attacks:

```typescript
// DOCTYPE declarations are rejected
if (data.includes('<!DOCTYPE') || data.includes('<!ENTITY')) {
  throw new ParseError('DOCTYPE declarations are not allowed for security reasons');
}

// Entity limits enforced
// External entities disabled
```

**Protections:**
- DOCTYPE declarations rejected
- External entities disabled
- Entity expansion limited
- Processing instructions validated

### SQL Injection Prevention

SQL output uses proper identifier escaping:

```typescript
// Identifier escaping by dialect
function escapeIdentifier(identifier: string, dialect: SqlDialect): string {
  const sanitized = identifier.replace(/[^\w]/g, '');
  switch (dialect) {
    case 'mysql':
      return `\`${sanitized}\``;
    case 'postgresql':
    case 'sqlite':
      return `"${sanitized}"`;
    case 'mssql':
      return `[${sanitized}]`;
  }
}
```

**Protections:**
- All identifiers escaped for target dialect
- Reserved words handled
- Special characters removed
- Only alphanumeric and underscore allowed

### SSRF (Server-Side Request Forgery) Protection

URL imports are validated to prevent SSRF:

```typescript
// URL validation for imports
function validateUrl(url: string): boolean {
  const parsed = new URL(url);

  // Only allow HTTP(S)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return false;
  }

  // Block internal IPs
  const hostname = parsed.hostname.toLowerCase();
  if (isInternalIp(hostname)) {
    return false;
  }

  return true;
}
```

**Protections:**
- Only HTTP/HTTPS protocols allowed
- Internal IP addresses blocked (127.x.x.x, 10.x.x.x, 192.168.x.x, etc.)
- Localhost blocked
- AWS metadata endpoint blocked (169.254.169.254)

### File Size Limits

Maximum file sizes are enforced:

| Limit | Value |
|-------|-------|
| Request body | 50MB |
| File upload | 50MB |
| Individual cell | 100KB |
| Total columns | 1,000 |
| Total rows | 1,000,000 |

### Security Headers

The following security headers are set via Next.js middleware:

```typescript
// Security headers configuration
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; ...",
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
```

### Rate Limiting

API endpoints are rate limited:

| Endpoint | Limit |
|----------|-------|
| /api/convert | 100/minute |
| /api/parse | 100/minute |
| /api/formats | 1000/minute |
| /api/health | 1000/minute |

Exceeded limits return HTTP 429 Too Many Requests.

## Best Practices for Users

### When Using the API

1. **Validate your inputs** before sending to the API
2. **Don't send sensitive data** - this is a public converter
3. **Use HTTPS** in production
4. **Handle errors gracefully** - check for error responses

### When Self-Hosting

1. **Keep dependencies updated** - Run `npm audit` regularly
2. **Set environment variables** securely
3. **Use a reverse proxy** (nginx, Cloudflare)
4. **Enable HTTPS** with valid certificates
5. **Configure CORS** appropriately
6. **Monitor logs** for suspicious activity

## Security Checklist

For maintainers and contributors:

- [ ] All user input validated with Zod
- [ ] XML parsing rejects DOCTYPE
- [ ] SQL identifiers properly escaped
- [ ] URLs validated before fetch
- [ ] File sizes checked before processing
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error messages don't leak internals
- [ ] Dependencies regularly audited
- [ ] Security tests passing

## Dependency Security

We regularly audit dependencies:

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

Known vulnerabilities in dependencies are patched as soon as fixes are available.

## Changelog

### Security Updates

| Date | Issue | Resolution |
|------|-------|------------|
| 2024-12 | XXE Prevention | Added DOCTYPE rejection |
| 2024-12 | SQL Injection | Added dialect-aware escaping |
| 2024-12 | SSRF Protection | Added URL validation |
| 2024-12 | Input Validation | Added Zod schemas |

## Contact

- **Security Issues:** mwm.softwars.solutions@gmail.com
- **General Contact:** hmdy7486@gmail.com
- **GitHub:** [@mahmoodhamdi](https://github.com/mahmoodhamdi)

---

This security policy was last updated on December 23, 2024.
