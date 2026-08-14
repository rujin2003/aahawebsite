import { create } from 'zustand';
import { SUPPORTED_COUNTRIES, type SupportedCountry } from './country';

interface CountryStore {
  countryCode: string | null;
  isLoading: boolean;
  isSupportedCountry: boolean;
  getCountry: () => Promise<string>;
}

// The detected country is cached in localStorage so navigating between
// pages (and return visits) doesn't block on the ipwho.is lookup.
const CACHE_KEY = 'aaha-country-code';

const readCachedCountry = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const code = window.localStorage.getItem(CACHE_KEY);
    return code && /^[A-Z]{2,3}$/.test(code) ? code : null;
  } catch {
    return null;
  }
};

const writeCachedCountry = (code: string) => {
  try {
    window.localStorage.setItem(CACHE_KEY, code);
  } catch {}
};

const isSupported = (code: string) =>
  SUPPORTED_COUNTRIES.includes(code as SupportedCountry);

export const useCountryStore = create<CountryStore>((set, get) => {
  let sharedPromise: Promise<string> | null = null;

  const cached = readCachedCountry();

  return {
    countryCode: cached,
    isLoading: false,
    isSupportedCountry: cached ? isSupported(cached) : false,

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

          writeCachedCountry(code);
          set({
            countryCode: code,
            isLoading: false,
            isSupportedCountry: isSupported(code),
          });

          return code;
        } catch {
          set({
            countryCode: 'US',
            isLoading: false,
            isSupportedCountry: isSupported('US'),
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
