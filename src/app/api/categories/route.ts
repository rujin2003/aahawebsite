import { NextResponse, NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getCategoriesQuery } from '@/lib/country'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const countryCode = searchParams.get('countryCode')

    const query = getCategoriesQuery(supabase, countryCode || '')
    const { data: categoriesDataFromSupabase, error } = await query

    if (error) {
      console.error('Database error in /api/categories:', error)
      return NextResponse.json({ error: 'Error fetching categories', details: error.message }, { status: 500 })
    }

    if (!Array.isArray(categoriesDataFromSupabase)) {
      console.warn('Unexpected format from Supabase categories:', categoriesDataFromSupabase)
      return NextResponse.json({ error: 'Unexpected data format from database for categories' }, { status: 500 })
    }

    return NextResponse.json(categoriesDataFromSupabase)
  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, error } = await supabase
      .from('categories')
      .insert([body])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: 'Error creating category' }, { status: 500 })
  }
} 
export const runtime = 'edge';