import { create } from 'zustand';
import { SUPPORTED_COUNTRIES, type SupportedCountry } from './country';

interface CountryStore {
  countryCode: string | null;
  isLoading: boolean;
  isSupportedCountry: boolean;
  getCountry: () => Promise<string>;
}

export const useCountryStore = create<CountryStore>((set, get) => {
  let sharedPromise: Promise<string> | null = null;

  return {
    countryCode: null,
    isLoading: false,
    isSupportedCountry: false,

    getCountry: async () => {
      const { countryCode } = get();
      if (countryCode) return countryCode;

      if (sharedPromise) return sharedPromise;

      set({ isLoading: true });

      sharedPromise = (async () => {
        try {
          const res = await fetch('https://ipwho.is/');
          const data = await res.json();
          const code = data.country_code || 'US';
          const isSupported = SUPPORTED_COUNTRIES.includes(code as SupportedCountry);

          set({
            countryCode: code,
            isLoading: false,
            isSupportedCountry: isSupported,
          });

          return code;
        } catch {
          set({
            countryCode: 'US',
            isLoading: false,
            isSupportedCountry: SUPPORTED_COUNTRIES.includes('US' as SupportedCountry),
          });

          return 'US';
        }
      })();

      return sharedPromise;
    },
  };
});

// ✅ Automatically start fetching on first load
useCountryStore.getState().getCountry();
