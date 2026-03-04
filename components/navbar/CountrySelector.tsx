'use client';

import { useEffect, useRef, useState } from 'react';
import { useCountry } from '@/lib/country/CountryContext';
import { useCurrency } from '@/lib/currency/CurrencyContext';
import type { CurrencyCode } from '@/lib/currency/currency.config';

export function CountrySelector() {
  const { countries, countryCode, selectedCountry, setCountryCode } = useCountry();
  const { currency, setCurrency } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCountryCode, setPendingCountryCode] = useState<string | null>(null);
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

  const handleCountrySelection = (nextCountryCode: string) => {
    if (nextCountryCode === countryCode) {
      setIsOpen(false);
      return;
    }

    const country = countries.find((entry) => entry.code === nextCountryCode);
    if (!country) {
      setIsOpen(false);
      return;
    }

    setPendingCountryCode(nextCountryCode);
    setIsOpen(false);
  };

  const applyCountryChange = (switchCurrency: boolean) => {
    if (!pendingCountryCode) return;

    const country = countries.find((entry) => entry.code === pendingCountryCode);
    if (!country) {
      setPendingCountryCode(null);
      return;
    }

    setCountryCode(country.code);
    if (switchCurrency) {
      setCurrency(country.defaultCurrency as CurrencyCode);
    }

    setPendingCountryCode(null);
  };

  return (
    <>
      <div className="relative z-50" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Select country"
        >
          <span className="text-xs text-gray-300 font-semibold uppercase">{selectedCountry?.code ?? countryCode}</span>
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
                  onClick={() => handleCountrySelection(country.code)}
                  className="w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors hover:bg-gray-50 group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-1 h-8 rounded-full transition-colors ${countryCode === country.code ? 'bg-amber-500' : 'bg-transparent group-hover:bg-gray-200'}`} />
                    <div className="flex flex-col">
                      <span className={`font-medium ${countryCode === country.code ? 'text-black' : 'text-gray-700'}`}>
                        {country.name}
                      </span>
                      <span className="text-xs text-gray-500">Default: {country.defaultCurrency}</span>
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

      {pendingCountryCode && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPendingCountryCode(null)} />
          <div className="relative w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Change country</h3>
            <p className="text-sm text-gray-600 mb-4">
              Your selected currency is <span className="font-semibold">{currency}</span>. Do you want to switch to the selected country's default currency?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => applyCountryChange(false)}
              >
                No, keep currency
              </button>
              <button
                type="button"
                className="px-3 py-2 rounded-md bg-black text-white text-sm font-medium hover:bg-gray-800"
                onClick={() => applyCountryChange(true)}
              >
                Yes, switch currency
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
