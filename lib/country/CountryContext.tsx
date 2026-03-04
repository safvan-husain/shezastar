'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { COUNTRY_COOKIE_NAME, StorefrontCountry } from './country.config';

interface CountryContextType {
  countries: StorefrontCountry[];
  countryCode: string;
  setCountryCode: (code: string) => void;
  selectedCountry: StorefrontCountry | null;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({
  children,
  initialCountries,
}: {
  children: React.ReactNode;
  initialCountries: StorefrontCountry[];
}) {
  const [countryCode, setCountryCodeState] = useState<string>(initialCountries[0]?.code ?? 'UAE');

  useEffect(() => {
    const saved = Cookies.get(COUNTRY_COOKIE_NAME);
    if (saved && initialCountries.some((country) => country.code === saved)) {
      setCountryCodeState(saved);
    } else if (initialCountries.length > 0) {
      setCountryCodeState(initialCountries[0].code);
      Cookies.set(COUNTRY_COOKIE_NAME, initialCountries[0].code, { expires: 365 });
    }
  }, [initialCountries]);

  const setCountryCode = (code: string) => {
    setCountryCodeState(code);
    Cookies.set(COUNTRY_COOKIE_NAME, code, { expires: 365 });
  };

  const selectedCountry = useMemo(
    () => initialCountries.find((country) => country.code === countryCode) ?? null,
    [initialCountries, countryCode]
  );

  return (
    <CountryContext.Provider
      value={{
        countries: initialCountries,
        countryCode,
        setCountryCode,
        selectedCountry,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}
