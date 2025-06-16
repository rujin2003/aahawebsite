import { NextResponse, NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const countryCode = searchParams.get('countryCode')

    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (countryCode) {
      query = query.or(`country_codes.cs.{${countryCode}},country_codes.is.null`)
    } else {
      // If no countryCode is provided, fetch products with null country_codes (available everywhere)
      query = query.filter('country_codes', 'is', null)
    }

    const { data: productsDataFromSupabase, error } = await query

    if (error) {
      console.error('Database error in /api/products:', error)
      return NextResponse.json({ error: 'Error fetching products', details: error.message }, { status: 500 })
    }

    // Defensive check for unexpected object type from Supabase
    if (productsDataFromSupabase && typeof productsDataFromSupabase === 'object' && !Array.isArray(productsDataFromSupabase)) {
      console.warn('Supabase returned an object for products select query, expected array or null. Data:', productsDataFromSupabase);
      // If it's an empty object {}, treat as no data.
      if (Object.keys(productsDataFromSupabase).length === 0) {
        return NextResponse.json([]);
      }
      // Otherwise, it's an unexpected format
      return NextResponse.json({ error: 'Unexpected data format from database for products' }, { status: 500 });
    }

    return NextResponse.json(productsDataFromSupabase || [])
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, error } = await supabase
      .from('products')
      .insert([body])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: 'Error creating product' }, { status: 500 })
  }
} 
export const runtime = 'edge';
