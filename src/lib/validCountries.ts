export const VALID_COUNTRIES = ['in', 'ca', 'nz'];

export function isCountrySupported(code?: string) {
  return !!code && VALID_COUNTRIES.includes(code.toLowerCase());
} 