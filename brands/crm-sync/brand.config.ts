import type { BrandConfig } from '../types';

const config: BrandConfig = {
  id: 'crm-sync',
  displayName: 'MWM CRMSync',
  tagline: {
    en: 'Migrate and sync customer data between HubSpot, Salesforce, Zoho and Pipedrive',
    ar: 'نقل ومزامنة بيانات العملاء بين HubSpot و Salesforce و Zoho و Pipedrive',
  },
  description: {
    en: 'Built for sales operations teams. Map fields between CRM platforms, deduplicate leads, validate emails, and bulk-import without losing data.',
    ar: 'مصمم لفرق عمليات المبيعات. ربط الحقول بين منصات CRM، إزالة العملاء المكررين، تحقق من الإيميلات، واستيراد بالجملة بدون فقدان بيانات.',
  },
  colors: {
    primary: '#ea580c',
    accent: '#f97316',
  },
  logo: {
    light: '/brand/crm-sync/logo-light.svg',
    dark: '/brand/crm-sync/logo-dark.svg',
  },
  domain: 'crm-sync.mwm.dev',
  contactEmail: 'crm@mwm.dev',
  defaultLocale: 'en',
  enabledFeatures: [
    'web-ui',
    'batch-convert',
    'transform',
    'history',
    'api-public',
    'api-keys',
    'encoding-detection',
    'data-profiling',
    'diff-mode',
    'vertical-templates',
  ],
  pricing: [
    {
      id: 'team',
      name: { en: 'Sales Team', ar: 'فريق مبيعات' },
      priceUsd: 1500,
      cadence: 'one-time',
      features: ['1 CRM migration', 'Field mapping templates', 'Email support'],
    },
    {
      id: 'agency',
      name: { en: 'Agency', ar: 'وكالة' },
      priceUsd: 4500,
      cadence: 'one-time',
      highlight: true,
      features: [
        'Unlimited migrations',
        'All CRM platforms',
        'Lead deduplication',
        'Email validation',
        '1 year priority support',
      ],
    },
    {
      id: 'enterprise',
      name: { en: 'Enterprise', ar: 'مؤسسات' },
      priceUsd: 18000,
      cadence: 'yearly',
      features: [
        'Custom field mappers',
        'Dedicated migration engineer',
        '24/7 support',
      ],
    },
  ],
  templates: [
    {
      id: 'hubspot-to-salesforce',
      name: { en: 'HubSpot → Salesforce', ar: 'HubSpot إلى Salesforce' },
      description: {
        en: 'Map HubSpot contacts/companies/deals to Salesforce schema with deduplication.',
        ar: 'ربط جهات الاتصال والشركات والصفقات من HubSpot لمخطط Salesforce مع إزالة التكرار.',
      },
      inputFormat: 'csv',
      outputFormat: 'csv',
      sampleFile: '/samples/hubspot-contacts.csv',
    },
    {
      id: 'lead-dedupe',
      name: { en: 'Lead Deduplication', ar: 'إزالة العملاء المكررين' },
      description: {
        en: 'Detect duplicate leads by email, phone, and fuzzy name matching.',
        ar: 'اكتشاف العملاء المكررين بالإيميل والتليفون ومطابقة الاسم الضبابية.',
      },
      inputFormat: 'csv',
      outputFormat: 'xlsx',
      sampleFile: '/samples/leads.csv',
    },
  ],
  uploadLimitMb: 100,
  customLanding: true,
};

export default config;
