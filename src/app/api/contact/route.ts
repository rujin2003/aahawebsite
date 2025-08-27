import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendContactFormEmail } from '@/lib/mailing'

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

    // Send email via mailing microservice
    let emailSent = false;
    try {
      const emailPayload = {
        name,
        email,
        subject,
        message,
        source: body.source || 'website',
        created_at: new Date().toISOString()
      }

      const emailResponse = await sendContactFormEmail(emailPayload)
      console.log('Contact form email sent successfully:', emailResponse)
      emailSent = true;
    } catch (emailError) {
      console.error('Failed to send contact form email:', emailError)
      // Don't fail the entire request if email fails, just log the error
      // The form submission is still saved to the database
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
export const runtime = 'edge';