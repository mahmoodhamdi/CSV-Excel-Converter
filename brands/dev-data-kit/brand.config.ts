import type { BrandConfig } from '../types';

const config: BrandConfig = {
  id: 'dev-data-kit',
  displayName: 'MWM DevDataKit',
  tagline: {
    en: 'The fastest CSV/JSON/Excel converter API for engineering teams',
    ar: 'أسرع API لتحويل CSV و JSON و Excel لفرق الهندسة',
  },
  description: {
    en: 'API-first data conversion with TypeScript/Python/curl SDKs, OpenAPI spec, schema inference, and webhooks. Self-host on Docker or use our managed cloud.',
    ar: 'تحويل بيانات API-first مع SDKs بـ TypeScript و Python و curl، مواصفة OpenAPI، استنتاج المخطط، و webhooks. استضافة ذاتية بـ Docker أو استخدم سحابتنا المُدارة.',
  },
  colors: {
    primary: '#0f172a',
    accent: '#22d3ee',
  },
  logo: {
    light: '/brand/dev-data-kit/logo-light.svg',
    dark: '/brand/dev-data-kit/logo-dark.svg',
  },
  domain: 'devdatakit.mwm.dev',
  contactEmail: 'developers@mwm.dev',
  defaultLocale: 'en',
  enabledFeatures: [
    'web-ui',
    'api-public',
    'api-keys',
    'sdks',
    'webhooks',
    'encoding-detection',
    'schema-inference',
    'data-profiling',
    'multi-sheet-excel',
  ],
  pricing: [
    {
      id: 'starter',
      name: { en: 'Starter', ar: 'بداية' },
      priceUsd: 0,
      cadence: 'monthly',
      features: [
        '1,000 conversions/month',
        'TypeScript + Python SDK',
        'Community support',
        'Self-hosted Docker (free)',
      ],
    },
    {
      id: 'pro',
      name: { en: 'Pro', ar: 'احترافي' },
      priceUsd: 99,
      cadence: 'monthly',
      highlight: true,
      features: [
        '100,000 conversions/month',
        'All SDKs',
        'Webhooks',
        '99.9% SLA',
        'Email support',
      ],
    },
    {
      id: 'scale',
      name: { en: 'Scale', ar: 'توسع' },
      priceUsd: 299,
      cadence: 'monthly',
      features: [
        '1M conversions/month',
        'Dedicated rate limits',
        'Slack support',
        'Custom integrations',
      ],
    },
    {
      id: 'enterprise',
      name: { en: 'Enterprise', ar: 'مؤسسات' },
      priceUsd: 20000,
      cadence: 'yearly',
      features: [
        'Unlimited conversions',
        'Dedicated infrastructure',
        '24/7 support',
        'SSO + audit logs',
      ],
    },
  ],
  templates: [],
  uploadLimitMb: 200,
  customLanding: true,
};

export default config;
