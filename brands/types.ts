/**
 * Brand configuration types for vertical bundles.
 *
 * Each vertical (accounting, education, dev tools, CRM, invoicing) ships
 * the same converter codebase with a different brand.config.ts that
 * customizes name, colors, enabled features, pricing and copy overrides.
 */

export type Locale = 'en' | 'ar';

export interface BrandTagline {
  en: string;
  ar: string;
}

export interface BrandColors {
  primary: string;
  accent: string;
  background?: string;
  foreground?: string;
}

export interface BrandLogo {
  light: string;
  dark: string;
  favicon?: string;
}

export interface PricingTier {
  id: string;
  name: BrandTagline;
  priceUsd: number;
  priceEgp?: number;
  priceSar?: number;
  cadence: 'one-time' | 'monthly' | 'yearly';
  highlight?: boolean;
  features: string[];
  ctaLabel?: BrandTagline;
}

export interface BrandTemplate {
  id: string;
  name: BrandTagline;
  description: BrandTagline;
  inputFormat: 'csv' | 'json' | 'xlsx' | 'xml' | 'tsv';
  outputFormat: 'csv' | 'json' | 'xlsx' | 'xml' | 'tsv' | 'sql';
  sampleFile: string;
}

export type FeatureFlag =
  | 'web-ui'
  | 'batch-convert'
  | 'transform'
  | 'history'
  | 'api-public'
  | 'api-keys'
  | 'sdks'
  | 'webhooks'
  | 'encoding-detection'
  | 'schema-inference'
  | 'data-profiling'
  | 'diff-mode'
  | 'multi-sheet-excel'
  | 'geojson'
  | 'hijri-dates'
  | 'arabic-numerals'
  | 'vertical-templates'
  | 'compliance-egypt-eta'
  | 'compliance-saudi-zatca';

export interface BrandConfig {
  id: string;
  displayName: string;
  tagline: BrandTagline;
  description: BrandTagline;
  colors: BrandColors;
  logo: BrandLogo;
  domain: string;
  contactEmail: string;
  defaultLocale: Locale;
  enabledFeatures: FeatureFlag[];
  pricing: PricingTier[];
  templates: BrandTemplate[];
  uploadLimitMb: number;
  customLanding: boolean;
  messageOverrides?: {
    en?: Record<string, unknown>;
    ar?: Record<string, unknown>;
  };
}
