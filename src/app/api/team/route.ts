import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: teamMembers, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(teamMembers)
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching team members' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data, error } = await supabase
      .from('team_members')
      .insert([body])
      .select()

    if (error) throw error

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: 'Error adding team member' }, { status: 500 })
  }
} 
export const runtime = 'edge';
