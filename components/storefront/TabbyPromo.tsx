'use client';

import React from 'react';
import { useCurrency } from '@/lib/currency/CurrencyContext';

interface TabbyPromoProps {
    price: number;
    currency: string;
    publicKey: string;
    merchantCode: string;
    source?: 'product' | 'cart';
    lang?: 'en' | 'ar';
}

export function TabbyPromo({
    price,
    currency,
    publicKey,
    merchantCode,
    source = 'product',
    lang = 'en',
}: TabbyPromoProps) {
    const { currency: currentCurrency, formatPrice } = useCurrency();

    // Tabby promo snippet is only for AED, SAR, KWD. 
    // The user specifically asked for AED.
    if (currentCurrency !== 'AED' || currency !== 'AED') {
        return null;
    }

    const installmentAmount = price / 4;

    // Format price for the popup URL (2 decimal places for AED)
    const formattedPrice = price.toFixed(2);

    // Construct the Tabby popup URL based on the documentation
    // https://checkout.tabby.ai/promos/product-page/installments/en/?price=340.00&currency=AED&merchant_code=AE&public_key=pk_xyz
    const popupUrl = `https://checkout.tabby.ai/promos/product-page/installments/${lang}/?price=${formattedPrice}&currency=${currency}&merchant_code=${merchantCode}&public_key=${publicKey}`;

    return (
        <div className="flex flex-col gap-2 py-4 px-4 rounded-xl border border-[var(--storefront-border)] bg-[var(--storefront-bg-subtle)] my-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <img
                        src="https://cdn.tabby.ai/assets/logo.svg"
                        alt="Tabby"
                        className="h-5 w-auto"
                    />
                    <span className="text-sm font-medium text-[var(--storefront-text-primary)]">
                        Pay in 4 interest-free payments of <span className="font-bold">{formatPrice(installmentAmount)}</span>
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => window.open(popupUrl, 'tabby-promo', 'width=600,height=800,resizable=yes,scrollbars=yes')}
                    className="text-xs font-semibold underline text-[var(--storefront-text-secondary)] hover:text-[var(--storefront-text-primary)]"
                >
                    Learn more
                </button>
            </div>
        </div>
    );
}
