import { create } from 'zustand';
import { SUPPORTED_COUNTRIES, type SupportedCountry } from './country';

// 'pending' means we genuinely don't know where the visitor is yet. Nothing
// price- or shipping-related should render until this flips to 'ready',
// otherwise the page paints "not available" at every visitor and then
// swaps it out a few hundred ms later.
export type CountryStatus = 'pending' | 'ready';

interface CountryStore {
  countryCode: string | null;
  status: CountryStatus;
  isLoading: boolean;
  isSupportedCountry: boolean;
  init: () => void;
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

const resolved = (code: string) => ({
  countryCode: code,
  status: 'ready' as const,
  isLoading: false,
  isSupportedCountry: isSupported(code),
});

export const useCountryStore = create<CountryStore>((set, get) => {
  let sharedPromise: Promise<string> | null = null;
  let started = false;

  return {
    // Server and client must agree on this first render or hydration tears
    // and the whole page flashes. The cache is applied from init() instead,
    // which only ever runs in the browser.
    countryCode: null,
    status: 'pending',
    isLoading: true,
    isSupportedCountry: false,

    init: () => {
      if (started || typeof window === 'undefined') return;
      started = true;

      const cached = readCachedCountry();
      if (cached) {
        set(resolved(cached));
        return;
      }

      void get().getCountry();
    },

    getCountry: async () => {
      const { countryCode } = get();
      if (countryCode) return countryCode;

      if (sharedPromise) return sharedPromise;

      sharedPromise = (async () => {
        try {
          const res = await fetch('https://ipwho.is/');
          const data = await res.json();
          const code = data.country_code || 'US';

          writeCachedCountry(code);
          set(resolved(code));

          return code;
        } catch {
          // Unknown location is still a resolved state — the visitor gets the
          // "we don't ship here yet" path rather than a spinner forever.
          set(resolved('US'));

          return 'US';
        }
      })();

      return sharedPromise;
    },
  };
});

// init() is deliberately NOT called at module scope: on the client this file
// evaluates before React hydrates, so applying the cached country here would
// make the first client render disagree with the server HTML. It is called
// from useShopAvailability() and from ClientBody on mount instead.
