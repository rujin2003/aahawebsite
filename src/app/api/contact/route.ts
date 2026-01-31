import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendContactEmail } from '@/lib/email-api'

export const runtime = 'edge'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Received contact form submission:', body)

    // Validate required fields
    const { name, email, message, subject = 'Contact Form Submission' } = body

    if (!name || !email || !message) {
      console.error('Missing required fields:', { name, email, message })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      console.error('Invalid email format:', email)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('contacts')
      .insert([{
        name,
        email,
        subject,
        message,
        source: body.source || 'website',
        created_at: new Date().toISOString()
      }])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: error.message || 'Database error occurred' },
        { status: 500 }
      )
    }

    // Send contact email via deployed mail API (type: contact)
    let emailSent = false
    try {
      const result = await sendContactEmail({ name, email, message })
      if (result.ok) {
        console.log('Contact form email sent successfully')
        emailSent = true
      } else {
        console.error('Contact form email failed:', result.error)
      }
    } catch (emailError) {
      console.error('Failed to send contact form email:', emailError)
    }

    console.log('Successfully saved contact form submission:', data)
    return NextResponse.json({
      success: true,
      data,
      emailSent
    })
  } catch (error) {
    console.error('Contact form submission error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}