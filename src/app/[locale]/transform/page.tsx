'use client';

import { useTranslations } from 'next-intl';
import {
  TransformUpload,
  TransformPipeline,
  TransformPreview,
  TransformExport,
} from '@/components/transform';

export default function TransformPage() {
  const t = useTranslations('transform');

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Upload & Pipeline */}
        <div className="lg:col-span-1 space-y-6">
          <TransformUpload />
          <TransformPipeline />
          <TransformExport />
        </div>

        {/* Right Column - Preview */}
        <div className="lg:col-span-2">
          <TransformPreview />
        </div>
      </div>
    </div>
  );
}
