import type { BrandConfig } from '../types';

const config: BrandConfig = {
  id: 'invoice-flow',
  displayName: 'MWM InvoiceFlow',
  tagline: {
    en: 'E-invoicing format converter for Egyptian Tax Authority and Saudi ZATCA',
    ar: 'محوّل صيغ الفوترة الإلكترونية لمصلحة الضرائب المصرية و ZATCA السعودية',
  },
  description: {
    en: 'Convert your sales register to ETA-compliant JSON, ZATCA XML, or general e-invoice formats. Multi-currency support, invoice number validation, and bulk processing.',
    ar: 'حوّل سجل مبيعاتك لـ JSON متوافق مع مصلحة الضرائب، أو XML ZATCA، أو صيغ فوترة إلكترونية عامة. دعم متعدد العملات، تحقق من تسلسل أرقام الفواتير، ومعالجة بالجملة.',
  },
  colors: {
    primary: '#be123c',
    accent: '#e11d48',
  },
  logo: {
    light: '/brand/invoice-flow/logo-light.svg',
    dark: '/brand/invoice-flow/logo-dark.svg',
  },
  domain: 'invoiceflow.mwm.eg',
  contactEmail: 'invoice@mwm.eg',
  defaultLocale: 'ar',
  enabledFeatures: [
    'web-ui',
    'batch-convert',
    'transform',
    'history',
    'api-public',
    'api-keys',
    'encoding-detection',
    'schema-inference',
    'data-profiling',
    'arabic-numerals',
    'hijri-dates',
    'vertical-templates',
    'compliance-egypt-eta',
    'compliance-saudi-zatca',
  ],
  pricing: [
    {
      id: 'small-biz',
      name: { en: 'Small Business', ar: 'منشأة صغيرة' },
      priceUsd: 600,
      priceEgp: 30000,
      cadence: 'yearly',
      features: [
        'Up to 1,000 invoices/month',
        'ETA JSON export',
        'Email support',
      ],
    },
    {
      id: 'medium-biz',
      name: { en: 'Medium Business', ar: 'منشأة متوسطة' },
      priceUsd: 2400,
      priceEgp: 120000,
      cadence: 'yearly',
      highlight: true,
      features: [
        'Up to 50,000 invoices/month',
        'ETA + ZATCA exports',
        'Multi-currency',
        'Invoice sequence validator',
        'Priority support',
      ],
    },
    {
      id: 'enterprise',
      name: { en: 'Enterprise', ar: 'مؤسسات' },
      priceUsd: 12000,
      priceEgp: 600000,
      cadence: 'yearly',
      features: [
        'Unlimited invoices',
        'Custom compliance formats',
        'Dedicated support engineer',
        'Audit logs',
      ],
    },
  ],
  templates: [
    {
      id: 'sales-to-eta',
      name: { en: 'Sales Register → ETA JSON', ar: 'سجل المبيعات إلى JSON مصلحة الضرائب' },
      description: {
        en: 'Convert sales Excel to Egyptian Tax Authority e-invoice JSON format.',
        ar: 'حوّل Excel المبيعات لصيغة JSON الفاتورة الإلكترونية لمصلحة الضرائب المصرية.',
      },
      inputFormat: 'xlsx',
      outputFormat: 'json',
      sampleFile: '/samples/sales-register.xlsx',
    },
    {
      id: 'sales-to-zatca',
      name: { en: 'Sales Register → ZATCA XML', ar: 'سجل المبيعات إلى XML ZATCA' },
      description: {
        en: 'Convert sales Excel to Saudi ZATCA-compliant XML format.',
        ar: 'حوّل Excel المبيعات لصيغة XML متوافقة مع ZATCA السعودية.',
      },
      inputFormat: 'xlsx',
      outputFormat: 'xml',
      sampleFile: '/samples/sales-register.xlsx',
    },
  ],
  uploadLimitMb: 100,
  customLanding: true,
};

export default config;
