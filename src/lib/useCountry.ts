'use client';

import { useEffect, useState } from 'react';
import { getUserCountry, SUPPORTED_COUNTRIES, type SupportedCountry } from './country';

// Hook to get user's country
export function useUserCountry() {
  const [countryCode, setCountryCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUserCountry().then(code => {
      setCountryCode(code);
      setIsLoading(false);
    });
  }, []);

  const isSupportedCountry = SUPPORTED_COUNTRIES.includes(countryCode as SupportedCountry);

  return {
    countryCode,
    isLoading,
    isSupportedCountry
  };
} 