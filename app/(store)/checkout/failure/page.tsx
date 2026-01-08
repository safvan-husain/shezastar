'use client';

import Link from 'next/link';

export default function FailurePage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center mt-12 animate-in fade-in duration-700">
            <div className="mb-8 relative">
                <div className="absolute inset-0 bg-red-100 rounded-full scale-150 blur-2xl opacity-50"></div>
                {/* SVG Fallback if lucide is not available, but I'll write the SVG directly for safety */}
                <svg
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-red-500 relative z-10"
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900 tracking-tight">
                Payment Failed
            </h1>

            <div className="max-w-md mx-auto mb-10">
                <p className="text-lg text-gray-600 leading-relaxed">
                    Something went wrong with your transaction. Your order could not be processed at this time.
                </p>
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-500 text-left">
                    <p className="font-semibold text-gray-700 mb-1">Common reasons:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Insufficient funds</li>
                        <li>Incorrect payment details</li>
                        <li>Bank or provider rejection</li>
                    </ul>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
                <Link
                    href="/cart"
                    className="flex-1 bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-black/10"
                >
                    Try Again
                </Link>
                <Link
                    href="/contact-us"
                    className="flex-1 bg-white text-gray-900 border border-gray-200 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                >
                    Get Help
                </Link>
            </div>

            <p className="mt-8 text-sm text-gray-400">
                If the charge appears on your statement, it will be refunded automatically.
            </p>
        </div>
    );
}
