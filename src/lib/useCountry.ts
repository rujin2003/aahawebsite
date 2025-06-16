'use client';

import { useEffect, useState } from 'react';
import { getUserCountry, SUPPORTED_COUNTRIES, type SupportedCountry } from './country';

// Hook to get user's country
export function useUserCountry() {
  const [countryCode, setCountryCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCountry = async () => {
      try {
        const code = await getUserCountry();
        console.log('Fetched country code:', code);
        setCountryCode(code);
      } catch (error) {
        console.error('Error fetching country:', error);
        setCountryCode('US');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCountry();
  }, []);

  const isSupportedCountry = SUPPORTED_COUNTRIES.includes(countryCode as SupportedCountry);
  console.log('Country check:', { countryCode, isSupportedCountry, supportedCountries: SUPPORTED_COUNTRIES });

  return {
    countryCode,
    isLoading,
    isSupportedCountry
  };
} 