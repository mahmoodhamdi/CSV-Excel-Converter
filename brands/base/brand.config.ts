import type { BrandConfig } from '../types';

const config: BrandConfig = {
  id: 'base',
  displayName: 'CSV Excel Converter',
  tagline: {
    en: 'Convert between CSV, JSON, Excel, and more — instantly',
    ar: 'حوّل بين CSV و JSON و Excel وأكتر — في الحال',
  },
  description: {
    en: 'A privacy-first, bilingual data converter with REST API and Docker deployment. Convert files entirely in your browser or via API.',
    ar: 'محوّل بيانات يحترم خصوصيتك، ثنائي اللغة، مع REST API ودوكر. حوّل الملفات في المتصفح أو عبر الـ API.',
  },
  colors: {
    primary: '#2563eb',
    accent: '#0ea5e9',
  },
  logo: {
    light: '/brand/base/logo-light.svg',
    dark: '/brand/base/logo-dark.svg',
    favicon: '/favicon.ico',
  },
  domain: 'csv-excel-converter.com',
  contactEmail: 'mwm.softwars.solutions@gmail.com',
  defaultLocale: 'en',
  enabledFeatures: [
    'web-ui',
    'batch-convert',
    'transform',
    'history',
    'api-public',
    'encoding-detection',
    'schema-inference',
    'data-profiling',
    'arabic-numerals',
  ],
  pricing: [
    {
      id: 'free',
      name: { en: 'Free', ar: 'مجاني' },
      priceUsd: 0,
      cadence: 'one-time',
      features: [
        'Self-hosted via Docker',
        'Web UI + public API',
        'All formats',
        'Community support',
        'MIT licensed',
      ],
    },
    {
      id: 'pro',
      name: { en: 'Self-Hosted Pro', ar: 'احترافي - استضافة ذاتية' },
      priceUsd: 4500,
      priceEgp: 220000,
      cadence: 'one-time',
      highlight: true,
      features: [
        'Everything in Free',
        'Unlimited servers',
        'Priority support 1 year',
        'Brand customization',
        'API key authentication',
        'Per-key usage tracking',
      ],
    },
    {
      id: 'enterprise',
      name: { en: 'Enterprise', ar: 'مؤسسات' },
      priceUsd: 20000,
      cadence: 'yearly',
      features: [
        'Dedicated instance',
        'Custom SLA 99.9%+',
        '24/7 support',
        'SSO / SAML',
        'Air-gapped deployment',
        'Custom verticals',
      ],
    },
  ],
  templates: [],
  uploadLimitMb: 50,
  customLanding: false,
};

export default config;
