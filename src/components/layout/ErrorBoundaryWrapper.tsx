'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
}

/**
 * Client-side wrapper for ErrorBoundary to use in server components.
 */
export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
