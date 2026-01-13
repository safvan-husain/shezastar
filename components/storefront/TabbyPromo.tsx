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

declare global {
    interface Window {
        TabbyPromo: any;
    }
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

        const initTabby = () => {
            if (window.TabbyPromo) {
                new window.TabbyPromo({
                    selector: '#TabbyPromo',
                    currency: currency,
                    price: price.toFixed(2),
                    lang: lang,
                    source: source,
                    publicKey: publicKey,
                    merchantCode: merchantCode,
                });
            }
        };

        const script = document.getElementById(scriptId) as HTMLScriptElement;

        if (!script) {
            const newScript = document.createElement('script');
            newScript.src = 'https://checkout.tabby.ai/tabby-promo.js';
            newScript.id = scriptId;
            newScript.async = true;
            newScript.onload = initTabby;
            document.body.appendChild(newScript);
        } else {
            if (window.TabbyPromo) {
                initTabby();
            } else {
                script.addEventListener('load', initTabby);
                return () => script.removeEventListener('load', initTabby);
            }
        }
    }, [price, currency, publicKey, merchantCode, source, lang]);

    return (
        <div className="my-4">
            <div id="TabbyPromo" />
        </div>
    );
}
