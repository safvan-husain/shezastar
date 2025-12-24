'use client';

import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/lib/currency/CurrencyContext';
import { SUPPORTED_CURRENCIES } from '@/lib/currency/currency.config';

export function CurrencySelector() {
    const { currency, setCurrency } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeConfig = SUPPORTED_CURRENCIES.find(c => c.code === currency);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative z-50" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Select currency"
            >
                <div className="flex flex-col items-start leading-none">
                    <span className="text-xs text-gray-400 font-medium">Delivering to</span>
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-white uppercase">{activeConfig?.countryName}</span>
                        <span className="text-[10px] text-amber-400 font-bold tracking-wider bg-amber-400/10 px-1 rounded">{currency}</span>
                    </div>
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="py-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
                            Select Country
                        </div>
                        {SUPPORTED_CURRENCIES.map((c) => (
                            <button
                                key={c.code}
                                onClick={() => {
                                    setCurrency(c.code);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors hover:bg-gray-50 group`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-1 h-8 rounded-full transition-colors ${currency === c.code ? 'bg-amber-500' : 'bg-transparent group-hover:bg-gray-200'}`} />
                                    <div className="flex flex-col">
                                        <span className={`font-medium ${currency === c.code ? 'text-black' : 'text-gray-700'}`}>
                                            {c.countryName}
                                        </span>
                                        <span className="text-xs text-gray-500">{c.name}</span>
                                    </div>
                                </div>
                                <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${currency === c.code ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {c.code}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
