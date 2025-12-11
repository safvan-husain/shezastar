"use client";

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

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

            const { sessionId } = await response.json();
            const stripe = await stripePromise;

            if (!stripe) throw new Error('Stripe failed to load');

            const { error } = await (stripe as any).redirectToCheckout({
                sessionId,
            });

            if (error) {
                console.error('Stripe redirect error:', error);
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
