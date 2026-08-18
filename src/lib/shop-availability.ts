"use client";

import { useEffect } from 'react';
import { useCountryStore } from './countryStore';
import { SUPPORTED_COUNTRIES } from './country';

export type ShopAvailability = {
  /** true until we know where the visitor is — render skeletons, never copy. */
  isPending: boolean;
  /** Location resolved and we ship there: prices and checkout are live. */
  canShop: boolean;
  /** Location resolved and we don't ship there yet. */
  isOutOfRange: boolean;
  countryCode: string | null;
  /** "Germany" rather than "DE", falls back to the raw code. */
  countryName: string | null;
};

/** "AU" -> "Australia", with a graceful fallback on older browsers. */
export function countryNameFor(code: string | null | undefined): string | null {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** The regions we ship to, spelled out: "Australia, India and New Zealand". */
export function supportedCountriesLabel(): string {
  const names = SUPPORTED_COUNTRIES.map((c) => countryNameFor(c) ?? c);
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Single source of truth for "can this visitor buy?". Every price, badge and
 * checkout button reads this so they all flip at the same moment instead of
 * each component resolving on its own schedule.
 */
export function useShopAvailability(): ShopAvailability {
  const init = useCountryStore((s) => s.init);
  const status = useCountryStore((s) => s.status);
  const countryCode = useCountryStore((s) => s.countryCode);
  const isSupportedCountry = useCountryStore((s) => s.isSupportedCountry);

  useEffect(() => {
    init();
  }, [init]);

  const isPending = status === 'pending';

  return {
    isPending,
    canShop: !isPending && isSupportedCountry,
    isOutOfRange: !isPending && !isSupportedCountry,
    countryCode,
    countryName: countryNameFor(countryCode),
  };
}
