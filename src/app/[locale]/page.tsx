import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { FileUpload } from '@/components/converter/FileUpload';
import { DataPreview } from '@/components/converter/DataPreview';
import { FormatSelector } from '@/components/converter/FormatSelector';
import { ConvertOptions } from '@/components/converter/ConvertOptions';
import { ConvertButton } from '@/components/converter/ConvertButton';
import { ConvertResult } from '@/components/converter/ConvertResult';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  FileSpreadsheet,
  Table,
  Code,
  Zap,
  Files,
  Gift,
  ArrowRight,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="container px-4 py-8">
      {/* Hero Section */}
      <HeroSection />

      {/* Main Converter */}
      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <FileUpload />
          <FormatSelector />
          <ConvertOptions />
          <ConvertButton />
        </div>
        <div className="space-y-6">
          <DataPreview />
          <ConvertResult />
        </div>
      </div>

      {/* Features Section */}
      <FeaturesSection />
    </div>
  );
}

function HeroSection() {
  const t = useTranslations('home');

  return (
    <section className="text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        {t('title')}
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
        {t('subtitle')}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <Button size="lg" asChild>
          <a href="#converter">
            {t('cta')}
            <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/api-docs">{t('apiCta')}</Link>
        </Button>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const t = useTranslations('home');

  const features = [
    {
      icon: FileSpreadsheet,
      title: t('features.convert'),
      description: t('features.convertDesc'),
    },
    {
      icon: Table,
      title: t('features.preview'),
      description: t('features.previewDesc'),
    },
    {
      icon: Zap,
      title: t('features.transform'),
      description: t('features.transformDesc'),
    },
    {
      icon: Code,
      title: t('features.api'),
      description: t('features.apiDesc'),
    },
    {
      icon: Files,
      title: t('features.batch'),
      description: t('features.batchDesc'),
    },
    {
      icon: Gift,
      title: t('features.free'),
      description: t('features.freeDesc'),
    },
  ];

  return (
    <section className="mt-20">
      <h2 className="text-center text-3xl font-bold">Features</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <feature.icon className="h-10 w-10 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
