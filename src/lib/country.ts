"use client";

// List of supported countries
export const SUPPORTED_COUNTRIES = ['IN', 'NZ', 'CAN'] as const;
export type SupportedCountry = typeof SUPPORTED_COUNTRIES[number];

// Function to get user's country code
export async function getUserCountry(): Promise<string> {
  try {
    const response = await fetch('https://api.country.is/');
    const data = await response.json();
    return data.country;
  } catch (error) {
    console.error('Error fetching country:', error);
    return 'US'; 
  }
}

// Function to get the appropriate query for categories based on user's country
export function getCategoriesQuery(supabase: any, userCountryCode: string) {
  console.log('Building query for country:', userCountryCode);
  
  const isSupportedCountry = SUPPORTED_COUNTRIES.includes(userCountryCode as SupportedCountry);
  
  let query = supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (isSupportedCountry) {
    console.log('User is from supported country, filtering by country_codes');
    query = query.contains('country_codes', [userCountryCode]);
  } else {
    console.log('User is from non-supported country, fetching items with null country_codes');
    // query = query.is('country_codes', null);
  }

  return query;
}

// Function to get the appropriate query for products based on user's country
export function getProductsQuery(supabase: any, userCountryCode: string) {
  console.log('Building products query for country:', userCountryCode);
  
  const isSupportedCountry = SUPPORTED_COUNTRIES.includes(userCountryCode as SupportedCountry);
  
  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (isSupportedCountry) {
    console.log('User is from supported country, filtering products by country_codes');
    query = query.contains('country_codes', [userCountryCode]);
  } else {
    console.log('User is from non-supported country, fetching products with null country_codes');
    // query = query.is('country_codes', null);
  }

  return query;
}

// Function to check if a product/category is available in user's country
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