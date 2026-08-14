"use client";

// Countries we ship to / show prices for (ISO-2 codes as returned by ipwho.is)
export const SUPPORTED_COUNTRIES = ['AU', 'IN', 'NZ'] as const;
export type SupportedCountry = typeof SUPPORTED_COUNTRIES[number];

// Function to get user's country code
export async function getUserCountry(): Promise<string> {
  try {
    const res = await fetch('https://ipwho.is/');
    const data = await res.json();
    console.log(`Country Fetched: ${data.country_code}`);
    return data.country_code || 'IN';
    // return 'US';
  } catch (error) {
    console.error('Error fetching country:', error);
    return 'IN';
  }
}


// The full catalog is visible everywhere in the world — country_codes only
// decide shipping availability and pricing, never what gets listed.
export function getCategoriesQuery(supabase: any, _userCountryCode: string) {
  return supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });
}

export async function getProductsQuery(supabase: any, _countryCode: string) {
  return supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
}



export function isAvailableInCountry(itemCountryCodes: string[] | null, userCountryCode: string): boolean {
  console.log('Country Availability Check:', {
    itemCountryCodes,
    userCountryCode,
    supportedCountries: SUPPORTED_COUNTRIES,
    isUserCountrySupported: SUPPORTED_COUNTRIES.includes(userCountryCode as SupportedCountry)
  });

  // If no country codes specified, only show in non-listed countries
  if (!itemCountryCodes || itemCountryCodes.length === 0) {
    const result = !SUPPORTED_COUNTRIES.includes(userCountryCode as SupportedCountry);
    console.log('No country codes specified. Result:', {
      isAvailable: result,
      reason: 'Item is only available in non-listed countries'
    });
    return result;
  }

  // If country codes are specified, only show in those countries
  const result = itemCountryCodes.includes(userCountryCode);
  console.log('Country codes specified. Result:', {
    isAvailable: result,
    reason: result ? 'User country matches item country codes' : 'User country not in item country codes'
  });
  return result;
}