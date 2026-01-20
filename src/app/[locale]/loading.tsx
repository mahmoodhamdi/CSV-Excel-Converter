import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden="true" />
        <p className="text-lg font-medium text-muted-foreground">Loading...</p>
        <span className="sr-only">Loading page content</span>
      </div>
    </div>
  );
}
