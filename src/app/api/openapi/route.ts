import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/openapi
 *
 * Serves the OpenAPI specification file in YAML format.
 * Used by Swagger UI to render the API documentation.
 *
 * @returns OpenAPI YAML specification
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/app/api/openapi.yaml');
    const content = fs.readFileSync(filePath, 'utf-8');

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/yaml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Failed to load OpenAPI spec:', error);
    return NextResponse.json(
      { error: 'Failed to load API specification' },
      { status: 500 }
    );
  }
}
