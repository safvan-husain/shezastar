"use client";

import { useState } from 'react';


export default function CheckoutButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckout = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/checkout_sessions', {
                method: 'POST',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Checkout failed');
            }

            const { url } = await response.json();
            if (url) {
                window.location.href = url;
            } else {
                throw new Error('No checkout URL received');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            const message = error instanceof Error ? error.message : 'An unknown error occurred';
            alert(`Checkout failed: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleCheckout}
            disabled={isLoading}
            className="w-full bg-black text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? 'Processing...' : 'Proceed to Checkout'}
        </button>
    );
}
