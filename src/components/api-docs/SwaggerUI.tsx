'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import 'swagger-ui-react/swagger-ui.css';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUIReact = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
});

/**
 * SwaggerUI component that renders the interactive API documentation.
 * Uses the OpenAPI specification served from /api/openapi.
 */
export function SwaggerUI() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="swagger-ui-wrapper">
      <SwaggerUIReact
        url="/api/openapi"
        docExpansion="list"
        defaultModelsExpandDepth={1}
        displayRequestDuration={true}
        filter={true}
        showExtensions={true}
        showCommonExtensions={true}
        tryItOutEnabled={true}
      />
      <style jsx global>{`
        .swagger-ui-wrapper {
          background: var(--background);
        }
        .swagger-ui-wrapper .swagger-ui {
          font-family: inherit;
        }
        .swagger-ui-wrapper .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui-wrapper .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-ui-wrapper .swagger-ui .info .title {
          font-size: 2rem;
          font-weight: bold;
        }
        .swagger-ui-wrapper .swagger-ui .opblock-tag {
          font-size: 1.25rem;
          font-weight: 600;
          border-bottom: 1px solid hsl(var(--border));
        }
        .swagger-ui-wrapper .swagger-ui .opblock {
          border-radius: 8px;
          margin-bottom: 8px;
          border: 1px solid hsl(var(--border));
        }
        .swagger-ui-wrapper .swagger-ui .opblock .opblock-summary {
          border-radius: 8px;
        }
        .swagger-ui-wrapper .swagger-ui .opblock.opblock-post {
          border-color: hsl(221.2 83.2% 53.3%);
          background: hsl(221.2 83.2% 53.3% / 0.1);
        }
        .swagger-ui-wrapper .swagger-ui .opblock.opblock-get {
          border-color: hsl(142.1 76.2% 36.3%);
          background: hsl(142.1 76.2% 36.3% / 0.1);
        }
        .swagger-ui-wrapper .swagger-ui .btn {
          border-radius: 6px;
        }
        .swagger-ui-wrapper .swagger-ui .btn.execute {
          background: hsl(var(--primary));
          border-color: hsl(var(--primary));
        }
        .swagger-ui-wrapper .swagger-ui .model-box {
          background: hsl(var(--muted));
          border-radius: 8px;
        }
        .swagger-ui-wrapper .swagger-ui table tbody tr td {
          padding: 8px;
        }
        .swagger-ui-wrapper .swagger-ui .response-col_status {
          font-weight: 600;
        }
        /* Dark mode adjustments */
        .dark .swagger-ui-wrapper .swagger-ui {
          filter: invert(88%) hue-rotate(180deg);
        }
        .dark .swagger-ui-wrapper .swagger-ui img {
          filter: invert(100%) hue-rotate(180deg);
        }
      `}</style>
    </div>
  );
}
