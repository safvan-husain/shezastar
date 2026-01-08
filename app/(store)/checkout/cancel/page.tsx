'use client';

import Link from 'next/link';

export default function CancelPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center mt-12 animate-in fade-in duration-700">
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-amber-50 rounded-full scale-150 blur-2xl opacity-50"></div>
                <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-500 relative z-10"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 tracking-tight">
                Order Cancelled
            </h1>

            <p className="text-lg text-gray-600 mb-10 max-w-md mx-auto">
                No worries! Your order has been cancelled and you haven't been charged. Your items are still waiting in your cart.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Link
                    href="/cart"
                    className="flex-1 bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10 text-center"
                >
                    Return to Cart
                </Link>
                <Link
                    href="/"
                    className="flex-1 bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-sm text-center"
                >
                    Continue Shopping
                </Link>
            </div>

            <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-100 max-w-sm">
                <p className="text-sm text-gray-500 italic">
                    "Changed your mind or had trouble with payment? We're here to help if you have any questions."
                </p>
            </div>
        </div>
    );
}
