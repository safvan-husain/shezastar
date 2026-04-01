import { NextResponse } from 'next/server';
import { AppError, catchError } from '@/lib/errors/app-error';
import { computeCartItemPricing, getCartForCurrentSession } from '@/lib/cart/cart.service';
import { getExchangeRates } from '@/lib/currency/currency.service';
import type { CurrencyCode } from '@/lib/currency/currency.config';
import type { InstallationOption } from '@/lib/cart/cart.schema';
import {
  computeCheckoutPricingBreakdown,
  resolveCountryPricingForCheckout,
} from '@/lib/checkout/country-pricing.service';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function POSTHandler(req: Request) {
  try {
    const cart = await getCartForCurrentSession();
    if (!cart) {
      throw new AppError(404, 'CART_NOT_FOUND', { message: 'No active cart found' });
    }

    const body = await req.json().catch(() => ({}));
    const rawCurrency = typeof body.currency === 'string' ? body.currency : 'AED';
    const currency = rawCurrency.toUpperCase() as CurrencyCode;

    const rawItems = Array.isArray(body.items) ? body.items : [];
    const cartItems = rawItems.length > 0 ? rawItems : cart.items;

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new AppError(400, 'CART_EMPTY', { message: 'Cart is empty' });
    }

    const billingCountry =
      typeof body.country === 'string' && body.country.trim()
        ? body.country.trim()
        : cart.billingDetails?.country?.trim();

    if (!billingCountry) {
      throw new AppError(400, 'BILLING_COUNTRY_REQUIRED', {
        message: 'Billing country is required before checkout preview',
      });
    }

    let subtotalAed = 0;

    for (const item of cartItems) {
      if (!item || typeof item.productId !== 'string') {
        continue;
      }

      const requestedOption: InstallationOption =
        item.installationOption === 'store'
          ? 'store'
          : item.installationOption === 'home'
            ? 'home'
            : 'none';

      const pricing = await computeCartItemPricing(
        item.productId,
        Array.isArray(item.selectedVariantItemIds)
          ? item.selectedVariantItemIds.filter((id: unknown): id is string => typeof id === 'string')
          : [],
        requestedOption,
        typeof item.installationLocationId === 'string' ? item.installationLocationId : undefined
      );

      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        continue;
      }

      subtotalAed += pricing.unitPrice * qty;
    }

    if (subtotalAed <= 0) {
      throw new AppError(400, 'CHECKOUT_PREVIEW_EMPTY', {
        message: 'No valid items found for checkout preview',
      });
    }

    const rates = await getExchangeRates();
    const countryPricing = await resolveCountryPricingForCheckout(billingCountry);

    const breakdown = computeCheckoutPricingBreakdown({
      subtotalAed,
      currency,
      rates,
      countryPricing,
    });

    return NextResponse.json(breakdown, {
      status: 200,
      headers: {
        'x-request-method': 'POST',
      },
    });
  } catch (err) {
    const { status, body } = catchError(err);
    return NextResponse.json(body, {
      status,
      headers: {
        'x-request-method': 'POST',
      },
    });
  }
}

export const POST = withRequestLogging(POSTHandler);
