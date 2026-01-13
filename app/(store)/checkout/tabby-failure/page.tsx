'use client';

import Link from 'next/link';

export default function TabbyFailurePage() {
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
                    Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method for your order.
                    <br />
                    <span dir="rtl" className="block mt-2 font-arabic" lang="ar">
                        نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى.
                    </span>
                </p>
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
        </div>
    );
}
