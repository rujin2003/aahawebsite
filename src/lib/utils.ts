import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency symbols for supported countries
const CURRENCY_MAP: Record<string, { code: string; symbol: string }> = {
  IN: { code: 'INR', symbol: '₹' },
  NZ: { code: 'NZD', symbol: 'NZ$' },
  CAN: { code: 'CAD', symbol: 'CA$' },
};

// In-memory cache for exchange rates
const exchangeRateCache: Record<string, { rate: number; timestamp: number }> = {};
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function convertUSDToLocalCurrency(
  usdAmount: number,
  countryCode: string
): Promise<{ amount: number; symbol: string; code: string }> {
  const currency = CURRENCY_MAP[countryCode] || { code: 'USD', symbol: '$' };
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
