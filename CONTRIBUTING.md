# Contributing to CSV Excel Converter

Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Reporting Issues](#reporting-issues)

## Development Setup

### Prerequisites

- Node.js 20+
- npm 9+ or yarn 1.22+
- Git

### Getting Started

1. **Fork the repository**

   Click the "Fork" button on GitHub to create your own copy.

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/CSV-Excel-Converter.git
   cd CSV-Excel-Converter
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Set up environment variables** (optional)

   ```bash
   cp .env.example .env.local
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
CSV-Excel-Converter/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [locale]/           # Internationalized pages
│   │   │   ├── page.tsx        # Home page
│   │   │   ├── api-docs/       # API documentation page
│   │   │   ├── batch/          # Batch conversion page
│   │   │   ├── history/        # Conversion history page
│   │   │   └── transform/      # Data transformation page
│   │   ├── api/                # API routes
│   │   │   ├── convert/        # POST /api/convert
│   │   │   ├── parse/          # POST /api/parse
│   │   │   ├── formats/        # GET /api/formats
│   │   │   └── health/         # GET /api/health
│   │   ├── globals.css         # Global styles
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── ui/                 # Base UI components (shadcn/ui)
│   │   ├── converter/          # Converter-specific components
│   │   ├── layout/             # Layout components (Header, Footer)
│   │   └── api-docs/           # API documentation components
│   ├── lib/
│   │   ├── converter/          # Core conversion logic
│   │   │   ├── csv.ts          # CSV parser/writer
│   │   │   ├── json.ts         # JSON parser/writer
│   │   │   ├── excel.ts        # Excel parser/writer
│   │   │   ├── xml.ts          # XML parser/writer
│   │   │   ├── sql.ts          # SQL writer
│   │   │   ├── detect.ts       # Format detection
│   │   │   ├── validation.ts   # Input validation
│   │   │   └── index.ts        # Main converter exports
│   │   ├── errors.ts           # Error classes
│   │   └── utils.ts            # Utility functions
│   ├── hooks/                  # Custom React hooks
│   │   ├── use-toast.ts        # Toast notifications
│   │   ├── use-focus-trap.ts   # Focus management
│   │   └── use-focus-return.ts # Focus restoration
│   ├── stores/                 # Zustand stores
│   │   └── converter-store.ts  # Main converter state
│   ├── i18n/                   # Internationalization
│   │   ├── config.ts           # i18n configuration
│   │   ├── request.ts          # Server-side i18n
│   │   └── routing.ts          # Locale routing
│   ├── messages/               # Translation files
│   │   ├── en.json             # English translations
│   │   └── ar.json             # Arabic translations
│   ├── styles/                 # Additional styles
│   │   └── rtl.css             # RTL support
│   └── types/                  # TypeScript types
│       └── index.ts            # Type definitions
├── __tests__/
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   ├── e2e/                    # End-to-end tests
│   ├── performance/            # Performance tests
│   └── security/               # Security tests
├── public/                     # Static assets
└── plans/                      # Enhancement plans
```

## Development Workflow

### Creating a Feature

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**

   Follow the existing code patterns and conventions.

3. **Write tests**

   - Unit tests in `__tests__/unit/`
   - Integration tests in `__tests__/integration/`
   - E2E tests in `__tests__/e2e/`

4. **Run tests locally**

   ```bash
   npm run test        # Unit tests
   npm run test:e2e    # E2E tests (requires build)
   ```

5. **Run linting**

   ```bash
   npm run lint
   ```

6. **Commit your changes**

   ```bash
   git commit -m "feat: add your feature description"
   ```

7. **Push and create a pull request**

   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Description |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `style:` | Formatting, no code change |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |
| `perf:` | Performance improvement |
| `test:` | Adding or updating tests |
| `chore:` | Maintenance tasks |

**Examples:**
```
feat: add XML to SQL conversion support
fix: handle empty CSV rows correctly
docs: update API documentation with examples
test: add unit tests for Excel parser
```

### Adding a New Format

1. Create parser in `src/lib/converter/newformat.ts`
2. Add to exports in `src/lib/converter/index.ts`
3. Update types in `src/types/index.ts`
4. Add format detection in `src/lib/converter/detect.ts`
5. Write comprehensive tests
6. Update translations in `src/messages/en.json` and `src/messages/ar.json`
7. Update API documentation

## Code Style

### General Guidelines

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use functional React components with hooks
- Prefer composition over inheritance
- Keep components small and focused
- Use meaningful variable and function names

### TypeScript

```typescript
// Use explicit types for function parameters and return values
function parseData(data: string, options: ParseOptions): ParsedData {
  // ...
}

// Use interfaces for object shapes
interface ConvertOptions {
  inputFormat?: InputFormat;
  outputFormat: OutputFormat;
  options?: FormatOptions;
}
```

### React Components

```typescript
// Use function components
export function MyComponent({ prop1, prop2 }: MyComponentProps) {
  // Use hooks at the top
  const [state, setState] = useState<State>();

  // Event handlers
  const handleClick = useCallback(() => {
    // ...
  }, [dependency]);

  // Render
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### File Organization

- One component per file
- Co-locate tests with source files or in `__tests__/`
- Group related utilities together
- Use index files for public exports

## Testing

### Running Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run build
npm run test:e2e
```

### Writing Tests

**Unit Tests:**
```typescript
import { describe, it, expect } from 'vitest';
import { parseCsv } from '@/lib/converter/csv';

describe('parseCsv', () => {
  it('should parse simple CSV data', () => {
    const result = parseCsv('name,age\nJohn,30');
    expect(result.headers).toEqual(['name', 'age']);
    expect(result.rows).toHaveLength(1);
  });
});
```

**E2E Tests:**
```typescript
import { test, expect } from '@playwright/test';

test('should convert CSV to JSON', async ({ page }) => {
  await page.goto('/');
  // ... test steps
});
```

### Test Coverage Requirements

- Minimum 55% statement coverage
- Minimum 50% branch coverage
- All new features must include tests
- Critical paths should have E2E tests

## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass locally
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional commits format

### PR Template

```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How were these changes tested?

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Translations updated (if UI changes)
```

### Review Process

1. Create a PR against `main` branch
2. Wait for CI checks to pass
3. Request review from maintainers
4. Address any feedback
5. Squash and merge when approved

## Reporting Issues

### Bug Reports

Use the GitHub issue template with:

- **Title:** Clear, concise description
- **Steps to reproduce:** Numbered list of steps
- **Expected behavior:** What should happen
- **Actual behavior:** What actually happens
- **Environment:** Browser, OS, Node version
- **Screenshots:** If applicable

### Feature Requests

- Describe the problem you're trying to solve
- Propose a solution
- Consider alternatives
- Provide examples or mockups

## Questions?

- **Email:** mwm.softwars.solutions@gmail.com
- **GitHub Issues:** For bugs and feature requests
- **Discussions:** For questions and general discussion

Thank you for contributing!
