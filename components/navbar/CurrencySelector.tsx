'use client';

import { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/lib/currency/CurrencyContext';
import type { CurrencyCode } from '@/lib/currency/currency.config';
import { useCountry } from '@/lib/country/CountryContext';

export function CurrencySelector() {
    const { currency, setCurrency } = useCurrency();
    const { countries, countryCode, selectedCountry, setCountryCode } = useCountry();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keep country and currency in sync even when legacy cookies are out of sync.
    useEffect(() => {
        if (!selectedCountry) return;
        if (currency !== selectedCountry.defaultCurrency) {
            setCurrency(selectedCountry.defaultCurrency as CurrencyCode);
        }
    }, [selectedCountry, currency, setCurrency]);

    return (
        <div className="relative z-50" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Change country"
            >
                <div className="flex flex-col items-start leading-none">
                    <span className="text-xs text-gray-400 font-medium">Change Country</span>
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-white uppercase">{selectedCountry?.name ?? 'Select'}</span>
                        <span className="text-[10px] text-amber-400 font-bold tracking-wider bg-amber-400/10 px-1 rounded">
                            {selectedCountry?.defaultCurrency ?? currency}
                        </span>
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
                        {countries.map((country) => (
                            <button
                                key={country.id}
                                onClick={() => {
                                    setCountryCode(country.code);
                                    setCurrency(country.defaultCurrency as CurrencyCode);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors hover:bg-gray-50 group`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-1 h-8 rounded-full transition-colors ${countryCode === country.code ? 'bg-amber-500' : 'bg-transparent group-hover:bg-gray-200'}`} />
                                    <div className="flex flex-col">
                                        <span className={`font-medium ${countryCode === country.code ? 'text-black' : 'text-gray-700'}`}>
                                            {country.name}
                                        </span>
                                        <span className="text-xs text-gray-500">Currency: {country.defaultCurrency}</span>
                                    </div>
                                </div>
                                <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${countryCode === country.code ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {country.code}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
