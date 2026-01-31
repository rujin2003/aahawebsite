import type { SupabaseClient } from "@supabase/supabase-js";
import type { AddressParts } from "./address";

export type AddressRow = {
  id: string;
  user_id: string;
  label: string | null;
  street: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export function addressRowToParts(row: AddressRow): AddressParts {
  return {
    street: row.street,
    city: row.city,
    state: row.state,
    country: row.country,
    zipCode: row.zip_code,
  };
}

export function partsToAddressRowInput(parts: AddressParts, userId: string, label?: string | null, isDefault = false) {
  return {
    user_id: userId,
    label: label ?? null,
    street: parts.street.trim(),
    city: parts.city.trim(),
    state: parts.state.trim(),
    country: parts.country.trim(),
    zip_code: parts.zipCode.trim(),
    is_default: isDefault,
  };
}

export async function fetchUserAddresses(supabase: SupabaseClient, userId: string): Promise<AddressRow[]> {
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AddressRow[];
}

export async function insertAddress(
  supabase: SupabaseClient,
  userId: string,
  parts: AddressParts,
  options?: { label?: string; setDefault?: boolean }
): Promise<AddressRow> {
  if (options?.setDefault) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  }
  const { data, error } = await supabase
    .from("addresses")
    .insert(
      partsToAddressRowInput(parts, userId, options?.label ?? null, options?.setDefault ?? false)
    )
    .select()
    .single();
  if (error) throw error;
  return data as AddressRow;
}

export async function updateAddress(
  supabase: SupabaseClient,
  addressId: string,
  userId: string,
  parts: AddressParts,
  options?: { setDefault?: boolean }
): Promise<AddressRow> {
  if (options?.setDefault) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", userId);
  }
  const payload: Partial<Omit<AddressRow, "id" | "user_id" | "created_at" | "updated_at">> = {
    street: parts.street.trim(),
    city: parts.city.trim(),
    state: parts.state.trim(),
    country: parts.country.trim(),
    zip_code: parts.zipCode.trim(),
  };
  if (options?.setDefault) payload.is_default = true;
  const { data, error } = await supabase
    .from("addresses")
    .update(payload)
    .eq("id", addressId)
    .eq("user_id", userId)
    .select()
    .single();
  if (error) throw error;
  return data as AddressRow;
}

export async function upsertAddressForCheckout(
  supabase: SupabaseClient,
  userId: string,
  parts: AddressParts,
  existingAddressId: string | null
): Promise<AddressRow> {
  if (existingAddressId) {
    return updateAddress(supabase, existingAddressId, userId, parts);
  }
  return insertAddress(supabase, userId, parts, { setDefault: true });
}
