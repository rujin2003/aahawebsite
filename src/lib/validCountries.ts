import { SUPPORTED_COUNTRIES } from './country';

// This used to carry its own list (in/ca/nz) that disagreed with
// SUPPORTED_COUNTRIES (AU/IN/NZ), so the product page and the rest of the
// site reached opposite conclusions for Australian and Canadian visitors.
// One list now, exported for anything still importing this name.
export const VALID_COUNTRIES = SUPPORTED_COUNTRIES.map((c) => c.toLowerCase());

export function isCountrySupported(code?: string) {
  return !!code && VALID_COUNTRIES.includes(code.toLowerCase());
}
