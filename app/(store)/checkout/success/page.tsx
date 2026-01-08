'use client';

import Link from 'next/link';

export default function SuccessPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center mt-12 animate-in fade-in duration-700">
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-green-100 rounded-full scale-150 blur-2xl opacity-50 animate-pulse"></div>
                <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-500 relative z-10"
                >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 tracking-tight">
                Order Confirmed!
            </h1>

            <div className="max-w-md mx-auto mb-10">
                <p className="text-lg text-gray-600 leading-relaxed">
                    Thank you for your purchase. We've received your order and are spinning up the gears to get it to you.
                </p>
                <p className="mt-4 text-sm text-[var(--storefront-text-secondary)] bg-[var(--storefront-bg-subtle)] py-2 px-4 rounded-full inline-block border border-[var(--storefront-border-light)]">
                    A confirmation email has been sent to your inbox.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Link
                    href="/orders"
                    className="flex-1 bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                >
                    View Order
                </Link>
                <Link
                    href="/"
                    className="flex-1 bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                >
                    Back to Store
                </Link>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-8 text-left max-w-lg w-full pt-8 border-t border-gray-100">
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">What's Next?</h3>
                    <p className="text-sm text-gray-600">Our team will verify the payment and begin preparation.</p>
                </div>
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Need Help?</h3>
                    <p className="text-sm text-gray-600">Contact our support team anytime at <Link href="/contact-us" className="text-black underline">Contact Us</Link>.</p>
                </div>
            </div>
        </div>
    );
}
