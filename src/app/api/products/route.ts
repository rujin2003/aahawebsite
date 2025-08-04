import { NextResponse, NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { SUPPORTED_COUNTRIES } from '@/lib/constants'

type SupportedCountry = (typeof SUPPORTED_COUNTRIES)[number];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const countryCode = searchParams.get('countryCode')
    const isSupported = SUPPORTED_COUNTRIES.includes(countryCode as SupportedCountry)

    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    if (isSupported) {
      // Proper filtering using PostgreSQL array literal
      query = query.filter('country_codes', 'cs', `{${countryCode}}`)
    } else {
      // Not supported: show ALL products (not just null country_codes)
      // This allows users from unsupported regions to see all products
      // but they won't be able to order them
    }

    const { data: productsDataFromSupabase, error } = await query

    if (error) {
      console.error('Database error in /api/products:', error)
      return NextResponse.json({ error: 'Error fetching products', details: error.message }, { status: 500 })
    }

    if (
      productsDataFromSupabase &&
      typeof productsDataFromSupabase === 'object' &&
      !Array.isArray(productsDataFromSupabase)
    ) {
      if (Object.keys(productsDataFromSupabase).length === 0) {
        return NextResponse.json([])
      }
      return NextResponse.json({ error: 'Unexpected data format from database for products' }, { status: 500 })
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
    console.error('Product insert error:', error)
    return NextResponse.json({ error: 'Error creating product' }, { status: 500 })
  }
}

export const runtime = 'edge'
