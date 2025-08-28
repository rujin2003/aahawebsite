import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/shop',
    '/about',
    '/company',
    '/contact',
    '/privacy',
    '/terms',
    '/gallery',
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }))

  // Fetch dynamic categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, updated_at')

  const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map((c: any) => ({
    url: `${siteUrl}/shop/${c.id}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // Fetch dynamic products
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .order('updated_at', { ascending: false })

  const productRoutes: MetadataRoute.Sitemap = (products || []).map((p: any) => ({
    url: `${siteUrl}/products/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [...staticRoutes, ...categoryRoutes, ...productRoutes]
}


export const runtime = 'edge';