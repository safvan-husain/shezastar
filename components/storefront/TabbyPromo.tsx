'use client';

import React, { useEffect } from 'react';
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
    const { currency: currentCurrency } = useCurrency();

    // Tabby promo snippet is only for AED, SAR, KWD.
    if (currentCurrency !== 'AED' || currency !== 'AED') {
        return null;
    }

    useEffect(() => {
        const scriptId = 'tabby-promo-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.src = 'https://checkout.tabby.ai/tabby-promo.js';
            script.id = scriptId;
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    return (
        <div className="my-4">
            {/* @ts-expect-error Tabby custom element */}
            <tabby-promo
                price={price}
                currency={currency}
                public-key={publicKey}
                merchant-code={merchantCode}
                lang={lang}
                source={source}
            ></tabby-promo>
        </div>
    );
}
