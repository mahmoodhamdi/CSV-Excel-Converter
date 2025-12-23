# CSV Excel Converter

[![Build Status](https://github.com/mahmoodhamdi/CSV-Excel-Converter/actions/workflows/ci.yml/badge.svg)](https://github.com/mahmoodhamdi/CSV-Excel-Converter/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

> Convert between CSV, JSON, Excel, and more - instantly!

A production-ready CSV/Excel/JSON converter web application built with Next.js 14, TypeScript, and Tailwind CSS. Features bidirectional conversion between multiple data formats, live data preview, column mapping, data transformation, batch conversion, and a REST API.

## Features

- **Multiple Formats** - CSV, JSON, Excel (XLSX/XLS), XML, TSV, SQL
- **Live Preview** - See your data in a table before converting
- **Edit Data** - Modify cells, add/remove rows and columns
- **Transform** - Filter, deduplicate, and map columns
- **Batch Convert** - Process multiple files at once
- **Bilingual** - English and Arabic with RTL support
- **Responsive** - Works on all devices (mobile, tablet, desktop)
- **Docker** - Easy containerized deployment
- **REST API** - Developer-friendly API endpoints
- **100% Free** - No limits, no registration required

## Quick Start

### Using Docker

```bash
docker pull mwmsoftware/csv-excel-converter:latest
docker run -p 3000:3000 mwmsoftware/csv-excel-converter
```

Then open http://localhost:3000 in your browser.

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/mahmoodhamdi/CSV-Excel-Converter.git
cd CSV-Excel-Converter

# Install dependencies
npm install

# Run development server
npm run dev

# Or build for production
npm run build
npm run start
```

## Supported Conversions

| From | To |
|------|------------------|
| **CSV** | JSON, Excel, XML, TSV, SQL |
| **JSON** | CSV, Excel, XML, TSV, SQL |
| **Excel (XLSX/XLS)** | CSV, JSON, XML, TSV, SQL |
| **XML** | CSV, JSON, Excel, TSV, SQL |
| **TSV** | CSV, JSON, Excel, XML, SQL |

## Documentation

| Document | Description |
|----------|-------------|
| [API Documentation](/api-docs) | Interactive Swagger UI for API exploration |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture and diagrams |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development guidelines and contribution process |
| [SECURITY.md](SECURITY.md) | Security policy and vulnerability reporting |
| [CHANGELOG.md](CHANGELOG.md) | Version history and release notes |

## API Usage

The API provides endpoints for data conversion, parsing, and format information. Full interactive documentation is available at `/api-docs`.

### Convert Data

```bash
curl -X POST https://your-domain.com/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "data": "name,age\nJohn,30\nJane,25",
    "inputFormat": "csv",
    "outputFormat": "json"
  }'
```

### Parse Data

```bash
curl -X POST https://your-domain.com/api/parse \
  -H "Content-Type: application/json" \
  -d '{
    "data": "[{\"name\":\"John\",\"age\":30}]"
  }'
```

### Get Supported Formats

```bash
curl https://your-domain.com/api/formats
```

### Health Check

```bash
curl https://your-domain.com/api/health
```

### OpenAPI Specification

The OpenAPI 3.0 specification is available at `/api/openapi` for use with API clients and code generators.

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Start production server
npm run start

# Lint
npm run lint

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run all tests with coverage
npm run test:coverage
```

### Project Structure

```
csv-excel-converter/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── [locale]/     # Internationalized pages
│   │   └── api/          # API routes
│   ├── components/       # React components
│   │   ├── ui/           # Base UI components
│   │   ├── converter/    # Converter-specific components
│   │   └── layout/       # Layout components
│   ├── lib/              # Core libraries
│   │   └── converter/    # Conversion logic
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand stores
│   ├── i18n/             # Internationalization
│   ├── messages/         # Translation files
│   └── types/            # TypeScript types
├── __tests__/            # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
├── docker/               # Docker configuration
├── .github/              # GitHub Actions workflows
└── screenshots/          # E2E test screenshots
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Radix UI + shadcn/ui
- **Excel**: xlsx (SheetJS)
- **CSV**: PapaParse
- **XML**: fast-xml-parser
- **Table**: TanStack Table
- **State**: Zustand
- **i18n**: next-intl
- **Validation**: Zod
- **Testing**: Vitest + Playwright

## Internationalization

The app supports:
- **English (en)** - Default
- **Arabic (ar)** - With full RTL support

Language can be switched via the language toggle in the header.

## Docker

### Build locally

```bash
docker build -f docker/Dockerfile -t csv-excel-converter .
docker run -p 3000:3000 csv-excel-converter
```

### Using Docker Compose

```bash
cd docker
docker-compose up
```

## Security

We take security seriously. If you discover a security vulnerability, please report it responsibly:

- **Email**: mwm.softwars.solutions@gmail.com
- See [SECURITY.md](SECURITY.md) for our security policy

### Security Features

- XXE protection for XML parsing
- SQL injection prevention with proper escaping
- SSRF protection for URL imports
- Input validation with Zod schemas
- 50MB file size limits

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

Quick start:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Contact

For support, questions, or business inquiries:

- **Email**: mwm.softwars.solutions@gmail.com
- **Email**: hmdy7486@gmail.com
- **Phone**: +201019793768
- **GitHub**: [mahmoodhamdi](https://github.com/mahmoodhamdi)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with love by MWM Software Solutions
