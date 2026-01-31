/**
 * Address format: "street | city | state | country | zip" for profiles.address storage.
 */

export const ADDRESS_DELIMITER = " | ";

export type AddressParts = {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
};

export function parseAddress(stored: string | null | undefined): AddressParts | null {
  if (!stored || typeof stored !== "string") return null;
  const parts = stored.split(ADDRESS_DELIMITER).map((s) => s.trim());
  if (parts.length !== 5) return null;
  return {
    street: parts[0] || "",
    city: parts[1] || "",
    state: parts[2] || "",
    country: parts[3] || "",
    zipCode: parts[4] || "",
  };
}

export function formatAddress(parts: AddressParts): string {
  return [
    parts.street,
    parts.city,
    parts.state,
    parts.country,
    parts.zipCode,
  ].join(ADDRESS_DELIMITER);
}

/** Basic postal code: 3–12 letters/numbers (international). */
export const ZIP_REGEX = /^[A-Za-z0-9\s\-]{3,12}$/;

export function validateAddress(parts: AddressParts): { ok: boolean; message?: string } {
  if (!parts.street?.trim()) return { ok: false, message: "Street address is required" };
  if (!parts.city?.trim()) return { ok: false, message: "City is required" };
  if (!parts.state?.trim()) return { ok: false, message: "State / Province is required" };
  if (!parts.country?.trim()) return { ok: false, message: "Country is required" };
  if (!parts.zipCode?.trim()) return { ok: false, message: "ZIP / Postal code is required" };
  if (parts.street.length < 5) return { ok: false, message: "Please enter a valid street address" };
  if (!ZIP_REGEX.test(parts.zipCode.trim())) return { ok: false, message: "Please enter a valid ZIP or postal code (3–12 characters)" };
  return { ok: true };
}
