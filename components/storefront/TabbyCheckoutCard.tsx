'use client';

import { useEffect } from 'react';

interface TabbyCheckoutCardProps {
    price: number;
    currency: string;
    publicKey: string;
    merchantCode: string;
    lang?: 'en' | 'ar';
}

declare global {
    interface Window {
        TabbyCard: any;
    }
}

export function TabbyCheckoutCard({
    price,
    currency,
    publicKey,
    merchantCode,
    lang = 'en',
}: TabbyCheckoutCardProps) {
    useEffect(() => {
        const scriptId = 'tabby-card-script';

        const initTabby = () => {
            if (window.TabbyCard) {
                new window.TabbyCard({
                    selector: '#tabby-checkout-card-container',
                    currency: currency.toUpperCase(),
                    price: price.toFixed(currency === 'KWD' ? 3 : 2),
                    lang: lang,
                    shouldInheritBg: false,
                    publicKey: publicKey,
                    merchantCode: merchantCode,
                });
            }
        };

        const script = document.getElementById(scriptId) as HTMLScriptElement;

        if (!script) {
            const newScript = document.createElement('script');
            newScript.src = 'https://checkout.tabby.ai/tabby-card.js';
            newScript.id = scriptId;
            newScript.async = true;
            newScript.onload = initTabby;
            document.body.appendChild(newScript);
        } else {
            if (window.TabbyCard) {
                initTabby();
            } else {
                script.addEventListener('load', initTabby);
                return () => script.removeEventListener('load', initTabby);
            }
        }
    }, [price, currency, publicKey, merchantCode, lang]);

    return (
        <div className="my-2">
            <div id="tabby-checkout-card-container" />
        </div>
    );
}
