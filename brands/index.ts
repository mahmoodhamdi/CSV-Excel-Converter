import type { BrandConfig } from './types';
import base from './base/brand.config';
import accountingBridge from './accounting-bridge/brand.config';
import eduGrades from './edu-grades/brand.config';
import devDataKit from './dev-data-kit/brand.config';
import crmSync from './crm-sync/brand.config';
import invoiceFlow from './invoice-flow/brand.config';

export const brands: Record<string, BrandConfig> = {
  base,
  'accounting-bridge': accountingBridge,
  'edu-grades': eduGrades,
  'dev-data-kit': devDataKit,
  'crm-sync': crmSync,
  'invoice-flow': invoiceFlow,
};

export type BrandId = keyof typeof brands;

export const allBrandIds = Object.keys(brands) as BrandId[];

export { base, accountingBridge, eduGrades, devDataKit, crmSync, invoiceFlow };
export type { BrandConfig, BrandTagline, BrandColors, PricingTier, BrandTemplate, FeatureFlag, Locale } from './types';
