import type { BrandConfig } from '../types';

const config: BrandConfig = {
  id: 'accounting-bridge',
  displayName: 'MWM AccountingBridge',
  tagline: {
    en: 'Bridge your accounting data between QuickBooks, Xero, Excel and Egyptian VAT formats',
    ar: 'وصلة بين دفاتر محاسبتك في QuickBooks و Xero و Excel وصيغ ضريبة القيمة المضافة المصرية',
  },
  description: {
    en: 'Built for Egyptian and Gulf accountants. Auto-fix Windows-1256 encoding from legacy ERP exports, validate trial balances, normalize charts of accounts, and produce VAT-ready output for ETA submission.',
    ar: 'مصمم للمحاسبين في مصر والخليج. تصليح ترميز Windows-1256 من تصدير ERP القديمة، تحقق من ميزان المراجعة، توحيد دليل الحسابات، وإخراج جاهز لمصلحة الضرائب المصرية.',
  },
  colors: {
    primary: '#0f766e',
    accent: '#14b8a6',
  },
  logo: {
    light: '/brand/accounting-bridge/logo-light.svg',
    dark: '/brand/accounting-bridge/logo-dark.svg',
  },
  domain: 'accounting-bridge.mwm.eg',
  contactEmail: 'sales@mwm.eg',
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
    'vertical-templates',
    'compliance-egypt-eta',
    'compliance-saudi-zatca',
  ],
  pricing: [
    {
      id: 'solo',
      name: { en: 'Solo Accountant', ar: 'محاسب فردي' },
      priceUsd: 1500,
      priceEgp: 75000,
      cadence: 'one-time',
      features: [
        '1 user license',
        'QuickBooks/Xero templates',
        'Egyptian VAT 14% formats',
        'Email support 30 days',
      ],
    },
    {
      id: 'firm',
      name: { en: 'Accounting Firm', ar: 'مكتب محاسبة' },
      priceUsd: 3500,
      priceEgp: 170000,
      cadence: 'one-time',
      highlight: true,
      features: [
        'Up to 10 users',
        'All accounting templates',
        'ETA e-invoice JSON export',
        'ZATCA Saudi e-invoicing',
        'Trial balance validator',
        'Priority support 6 months',
      ],
    },
    {
      id: 'enterprise',
      name: { en: 'Multi-branch Firm', ar: 'مكتب متعدد الفروع' },
      priceUsd: 15000,
      priceEgp: 730000,
      cadence: 'one-time',
      features: [
        'Unlimited users',
        'White-label option',
        'Custom chart of accounts mapping',
        '1 year priority support',
        'On-site training',
      ],
    },
  ],
  templates: [
    {
      id: 'qb-to-xero',
      name: { en: 'QuickBooks → Xero', ar: 'QuickBooks إلى Xero' },
      description: {
        en: 'Map QuickBooks general ledger export to Xero import format with chart of accounts mapping.',
        ar: 'تحويل تصدير دفتر الأستاذ من QuickBooks إلى صيغة استيراد Xero مع ربط دليل الحسابات.',
      },
      inputFormat: 'csv',
      outputFormat: 'xlsx',
      sampleFile: '/samples/quickbooks-gl-export.csv',
    },
    {
      id: 'eta-einvoice',
      name: { en: 'Egyptian Tax Authority e-Invoice', ar: 'فاتورة إلكترونية مصلحة الضرائب' },
      description: {
        en: 'Convert your sales register to ETA-compliant JSON format for e-invoicing submission.',
        ar: 'حوّل سجل المبيعات لصيغة JSON متوافقة مع مصلحة الضرائب المصرية للفوترة الإلكترونية.',
      },
      inputFormat: 'xlsx',
      outputFormat: 'json',
      sampleFile: '/samples/eta-sales-register.xlsx',
    },
    {
      id: 'trial-balance',
      name: { en: 'Trial Balance Normalizer', ar: 'مُوحّد ميزان المراجعة' },
      description: {
        en: 'Validate that debits equal credits, flag suspect accounts, and export to multiple formats.',
        ar: 'تحقق إن المدين يساوي الدائن، اكتشف الحسابات المشكوك فيها، وصدّر لصيغ متعددة.',
      },
      inputFormat: 'xlsx',
      outputFormat: 'csv',
      sampleFile: '/samples/trial-balance.xlsx',
    },
  ],
  uploadLimitMb: 100,
  customLanding: true,
};

export default config;
