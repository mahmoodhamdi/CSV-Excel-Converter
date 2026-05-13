import type { BrandConfig } from '../types';

const config: BrandConfig = {
  id: 'edu-grades',
  displayName: 'MWM EduGrades',
  tagline: {
    en: 'Import, normalize and export grade books between SIS, Moodle, Blackboard and Excel',
    ar: 'استيراد ومعالجة وتصدير دفاتر الدرجات بين نظم المعلومات المدرسية و Moodle و Blackboard و Excel',
  },
  description: {
    en: 'For teachers and school administrators. Convert Egyptian/Gulf GPA scales, validate student IDs, bulk-import grade books to LMS platforms, and generate report cards in Arabic.',
    ar: 'للمدرسين وإداريي المدارس. تحويل سلالم GPA المصرية والخليجية، تحقق من أرقام الطلاب، استيراد جماعي لدفاتر الدرجات لمنصات LMS، وإنتاج كشوف درجات بالعربي.',
  },
  colors: {
    primary: '#7c3aed',
    accent: '#a855f7',
  },
  logo: {
    light: '/brand/edu-grades/logo-light.svg',
    dark: '/brand/edu-grades/logo-dark.svg',
  },
  domain: 'edu-grades.mwm.eg',
  contactEmail: 'edu@mwm.eg',
  defaultLocale: 'ar',
  enabledFeatures: [
    'web-ui',
    'batch-convert',
    'transform',
    'history',
    'api-public',
    'encoding-detection',
    'data-profiling',
    'arabic-numerals',
    'hijri-dates',
    'vertical-templates',
  ],
  pricing: [
    {
      id: 'teacher',
      name: { en: 'Single Teacher', ar: 'مدرس فردي' },
      priceUsd: 49,
      priceEgp: 2400,
      cadence: 'yearly',
      features: ['1 teacher license', 'Up to 200 students', 'Email support'],
    },
    {
      id: 'school',
      name: { en: 'School License', ar: 'رخصة مدرسة' },
      priceUsd: 1500,
      priceEgp: 75000,
      cadence: 'one-time',
      highlight: true,
      features: [
        'Unlimited teachers',
        'Up to 5,000 students',
        'Moodle/Blackboard import templates',
        'Bilingual report cards',
        'Priority support 1 year',
      ],
    },
    {
      id: 'district',
      name: { en: 'District / Network', ar: 'إدارة تعليمية' },
      priceUsd: 8000,
      priceEgp: 390000,
      cadence: 'one-time',
      features: [
        'Multi-school deployment',
        'Centralized analytics',
        'Custom GPA scales',
        'On-site training',
      ],
    },
  ],
  templates: [
    {
      id: 'moodle-import',
      name: { en: 'Excel → Moodle gradebook', ar: 'Excel إلى دفتر درجات Moodle' },
      description: {
        en: 'Convert teacher Excel grade book to Moodle bulk-import CSV.',
        ar: 'تحويل دفتر درجات Excel للمدرس إلى CSV استيراد Moodle.',
      },
      inputFormat: 'xlsx',
      outputFormat: 'csv',
      sampleFile: '/samples/teacher-gradebook.xlsx',
    },
    {
      id: 'gpa-converter',
      name: { en: 'Egyptian Thanaweya → US GPA', ar: 'ثانوية عامة مصري إلى GPA أمريكي' },
      description: {
        en: 'Convert percentage-based Egyptian grades to 4.0 GPA scale for international applications.',
        ar: 'تحويل درجات النسبة المئوية المصرية لمقياس GPA 4.0 للتقديم الدولي.',
      },
      inputFormat: 'csv',
      outputFormat: 'xlsx',
      sampleFile: '/samples/thanaweya-grades.csv',
    },
  ],
  uploadLimitMb: 50,
  customLanding: true,
};

export default config;
