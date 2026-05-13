/**
 * Brand resolution. Reads BRAND env var (build-time) and exposes the
 * active brand config to server and client components.
 *
 * Defaults to 'base' when BRAND is unset.
 */

import { brands, type BrandId, type BrandConfig } from '../../brands';

const DEFAULT_BRAND: BrandId = 'base';

function readBrandId(): BrandId {
  const raw = process.env.NEXT_PUBLIC_BRAND ?? process.env.BRAND;
  if (raw && raw in brands) {
    return raw as BrandId;
  }
  return DEFAULT_BRAND;
}

export const activeBrandId: BrandId = readBrandId();
export const activeBrand: BrandConfig = brands[activeBrandId];

export function isFeatureEnabled(feature: BrandConfig['enabledFeatures'][number]): boolean {
  return activeBrand.enabledFeatures.includes(feature);
}

export function getBrand(id: string): BrandConfig | undefined {
  return brands[id as BrandId];
}

export { brands };
export type { BrandId, BrandConfig };
