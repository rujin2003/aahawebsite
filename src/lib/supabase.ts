import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export type Product = {
  id: string
  created_at: string
  title: string
  description: string
  price: number
  color: string
  features: string[]
  category_id: string
  images: string[]
  size_stock: Record<string, number>
}

export type Category = {
  id: string
  created_at: string
  name: string
  description: string
  image: string
}

export type Contact = {
  id: string
  created_at: string
  name: string
  email: string
  message: string
  phone?: string
}

export type Gallery = {
  id: string
  created_at: string
  image_url: string
  title: string
  description?: string
  category?: string
}

export type TeamMember = {
  id: string
  created_at: string
  name: string
  role: string
  bio: string
  image_url: string
  social_links?: {
    linkedin?: string
    twitter?: string
    instagram?: string
  }
}

export type User = {
  id: string
  email?: string
  created_at?: string
  full_name?: string
  phone?: string
  address?: string
  is_admin?: boolean
  user_metadata?: any
  app_metadata?: any
  aud?: string
  role?: string
}

export type OrderStatus = 
  | 'to_be_verified'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  created_at: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: string;
  tracking_number?: string;
  estimated_delivery?: string;
  items: OrderItem[];
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
  product_name: string
  product_image?: string
}

export type Return = {
  id: string
  order_id: string
  user_id: string
  created_at: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  reason: string
  items: ReturnItem[]
}

export type ReturnItem = {
  id: string
  return_id: string
  order_item_id: string
  quantity: number
  reason: string
}

// Helper function to check if user is admin
export const checkAdminStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error checking admin status:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

// Helper function to get current user with admin status
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const isAdmin = await checkAdminStatus(user.id)
      return { ...user, is_admin: isAdmin }
    }
    return null
  } catch (error) {
    if (error instanceof Error && error.message.includes('Auth session missing')) {
      return null
    }
    console.error('Error getting current user:', error)
    return null
  }
}

// Helper function to get user profile
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Helper function to get user orders
export const getUserOrders = async (userId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Helper function to get order details
export const getOrderDetails = async (orderId: string) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*)
    `)
    .eq('id', orderId)
    .single()
  
  if (error) throw error
  return data
}

// Helper function to create a new order
export const createOrder = async (orderData: Omit<Order, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('orders')
    .insert([orderData])
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Helper function to create return request
export const createReturn = async (returnData: Omit<Return, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('returns')
    .insert([returnData])
    .select()
    .single()
  
  if (error) throw error
  return data
}
