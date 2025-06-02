const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://cfvhgmmfzowcxvuqcjjf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmdmhnbW1mem93Y3h2dXFjampmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTgzMjAsImV4cCI6MjA2Mjc5NDMyMH0.DpfdVovpEErFJPiwuP6W5osNMiwGF1LqvI2BKElYWY4c'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('Testing Supabase connection...')
  
  try {
    // Test categories table
    console.log('\n1. Testing categories table:')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .limit(5)
    
    if (categoriesError) {
      console.error('Categories error:', categoriesError)
    } else {
      console.log('Categories found:', categories?.length || 0)
      console.log('Sample categories:', categories)
    }
    
    // Test products table
    console.log('\n2. Testing products table:')
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .limit(5)
    
    if (productsError) {
      console.error('Products error:', productsError)
    } else {
      console.log('Products found:', products?.length || 0)
      console.log('Sample products:', products)
    }
    
  } catch (error) {
    console.error('Connection test failed:', error)
  }
}

testConnection()
