# SDKs

Official SDKs for the CSV Excel Converter API.

| Language | Status | Path |
|---|---|---|
| TypeScript / JavaScript | ✅ Stable | [`typescript/`](typescript/) |
| Postman collection | ✅ Stable | [`postman/`](postman/) |
| Python | 🚧 Roadmap (community contributions welcome) | — |
| PHP | 🚧 Roadmap (community contributions welcome) | — |
| Go | 🚧 Roadmap (community contributions welcome) | — |
| Ruby | 🚧 Roadmap (community contributions welcome) | — |

For languages we haven't shipped yet, you can generate a client from our OpenAPI spec:

```bash
npx @openapitools/openapi-generator-cli generate \
  -i https://your-deployment.com/api/openapi \
  -g python \
  -o ./csv-converter-python-sdk \
  --additional-properties=packageName=csv_converter_sdk
```

Replace `python` with `php`, `go`, `ruby`, `java`, `csharp`, etc.
