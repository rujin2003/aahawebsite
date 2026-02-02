import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency symbols for supported countries (single source of truth for display + payment)
export const CURRENCY_MAP: Record<string, { code: string; symbol: string }> = {
  IN: { code: 'INR', symbol: '₹' },
  NZ: { code: 'NZD', symbol: 'NZ$' },
  CAN: { code: 'CAD', symbol: 'CA$' },
  US: { code: 'USD', symbol: '$' },
};

/** Get currency code and symbol for a country (for display labels). */
export function getCurrencyForCountry(countryCode: string): { code: string; symbol: string } {
  return CURRENCY_MAP[countryCode] || { code: 'USD', symbol: '$' };
}

// In-memory cache for exchange rates
const exchangeRateCache: Record<string, { rate: number; timestamp: number }> = {};
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function convertUSDToLocalCurrency(
  usdAmount: number,
  countryCode: string
): Promise<{ amount: number; symbol: string; code: string }> {
  const currency = getCurrencyForCountry(countryCode);
  if (currency.code === 'USD') {
    return { amount: usdAmount, symbol: '$', code: 'USD' };
  }

  // Check cache
  const cached = exchangeRateCache[currency.code];
  const now = Date.now();
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return {
      amount: usdAmount * cached.rate,
      symbol: currency.symbol,
      code: currency.code,
    };
  }

  // Fetch exchange rate from open.er-api.com
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/USD`);
    const data = await res.json();
    const rate = data.rates[currency.code] || 1;
    // Cache the rate
    exchangeRateCache[currency.code] = { rate, timestamp: now };
    return {
      amount: usdAmount * rate,
      symbol: currency.symbol,
      code: currency.code,
    };
  } catch (e) {
    // Fallback to USD if API fails
    return { amount: usdAmount, symbol: '$', code: 'USD' };
  }
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

    case 'CAN':
      // Canada: $25 base, $32 if more than 10 items
      return {
        amount: totalItems > 10 ? 32 : 25,
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
