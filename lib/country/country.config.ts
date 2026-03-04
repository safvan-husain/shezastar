export const COUNTRY_COOKIE_NAME = 'NEXT_COUNTRY';

export interface StorefrontCountry {
  id: string;
  code: string;
  name: string;
  defaultCurrency: string;
  vatRatePercent: number;
  vatIncludedInPrice: boolean;
  shippingChargeAed: number;
  isActive: boolean;
}
