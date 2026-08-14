import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Initials for the avatar bubble. Prefers the person's name (first + last
 * word, max 2 letters); falls back to the first letter of the email's
 * local part so an account with no saved name still shows something real.
 */
export function getInitials(fullName?: string | null, email?: string | null): string {
  const name = fullName?.trim();
  if (name) {
    const words = name.split(/\s+/).filter(Boolean);
    const letters =
      words.length >= 2
        ? [words[0][0], words[words.length - 1][0]]
        : [words[0][0]];
    return letters.join("").toUpperCase();
  }
  const local = email?.trim().split("@")[0];
  const firstLetter = local?.match(/[a-zA-Z0-9]/)?.[0];
  return firstLetter ? firstLetter.toUpperCase() : "";
}

// Currency symbols for supported countries (single source of truth for display + payment)
export const CURRENCY_MAP: Record<string, { code: string; symbol: string }> = {
  IN: { code: 'INR', symbol: '₹' },
  NZ: { code: 'NZD', symbol: 'NZ$' },
  AU: { code: 'AUD', symbol: 'A$' },
  CA: { code: 'CAD', symbol: 'CA$' },
  US: { code: 'USD', symbol: '$' },
};

/** Get currency code and symbol for a country (for display labels). */
export function getCurrencyForCountry(countryCode: string): { code: string; symbol: string } {
  return CURRENCY_MAP[countryCode] || { code: 'USD', symbol: '$' };
}

// Exchange rates: cached in memory for the session and mirrored to
// localStorage so revisits skip the network entirely.
const exchangeRateCache: Record<string, { rate: number; timestamp: number }> = {};
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const RATES_LS_KEY = 'aaha-usd-rates';

try {
  if (typeof window !== 'undefined') {
    const raw = window.localStorage.getItem(RATES_LS_KEY);
    if (raw) {
      const saved = JSON.parse(raw) as { rates: Record<string, number>; timestamp: number };
      if (saved?.rates && Date.now() - saved.timestamp < CACHE_DURATION) {
        for (const [code, rate] of Object.entries(saved.rates)) {
          exchangeRateCache[code] = { rate, timestamp: saved.timestamp };
        }
      }
    }
  }
} catch {}

// One network request no matter how many product cards convert at once —
// concurrent callers share the same in-flight fetch.
let inflightRates: Promise<Record<string, number> | null> | null = null;

function fetchUsdRates(): Promise<Record<string, number> | null> {
  if (!inflightRates) {
    inflightRates = fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        const rates: Record<string, number> | null = data?.rates || null;
        if (rates) {
          const timestamp = Date.now();
          for (const [code, rate] of Object.entries(rates)) {
            exchangeRateCache[code] = { rate, timestamp };
          }
          try {
            window.localStorage.setItem(RATES_LS_KEY, JSON.stringify({ rates, timestamp }));
          } catch {}
        }
        return rates;
      })
      .catch(() => null)
      .finally(() => {
        inflightRates = null;
      });
  }
  return inflightRates;
}

export async function convertUSDToLocalCurrency(
  usdAmount: number,
  countryCode: string
): Promise<{ amount: number; symbol: string; code: string }> {
  const currency = getCurrencyForCountry(countryCode);
  if (currency.code === 'USD') {
    return { amount: usdAmount, symbol: '$', code: 'USD' };
  }

  const cached = exchangeRateCache[currency.code];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return {
      amount: usdAmount * cached.rate,
      symbol: currency.symbol,
      code: currency.code,
    };
  }

  const rates = await fetchUsdRates();
  const rate = rates?.[currency.code];
  if (rate) {
    return { amount: usdAmount * rate, symbol: currency.symbol, code: currency.code };
  }

  // Fallback to USD if the rates API fails
  return { amount: usdAmount, symbol: '$', code: 'USD' };
}

/**
 * Calculate shipping cost based on country and item count
 * @param countryCode - Country code (IN, CAN, NZ, etc.)
 * @param totalItems - Total number of items in the cart
 * @returns Shipping cost in local currency with currency info
 */
export function calculateShippingCost(
  countryCode: string,
  totalItems: number
): { amount: number; symbol: string; code: string } {
  const currency = getCurrencyForCountry(countryCode);

  switch (countryCode) {
    case 'IN':
      // India: Rs 400 base, Rs 700 if more than 15 items
      return {
        amount: totalItems > 15 ? 700 : 400,
        symbol: currency.symbol,
        code: currency.code,
      };

    case 'CA':
      // Canada: $25 base, $32 if more than 10 items
      return {
        amount: totalItems > 10 ? 32 : 25,
        symbol: currency.symbol,
        code: currency.code,
      };

    case 'AU':
      // Australia: A$32 base, A$60 if more than 10 items
      return {
        amount: totalItems > 10 ? 60 : 32,
        symbol: currency.symbol,
        code: currency.code,
      };

    case 'NZ':
      // New Zealand: $32 base, $60 if more than 10 items
      return {
        amount: totalItems > 10 ? 60 : 32,
        symbol: currency.symbol,
        code: currency.code,
      };

    default:
      // Free shipping for unsupported countries or US
      return {
        amount: 0,
        symbol: currency.symbol,
        code: currency.code,
      };
  }
}
