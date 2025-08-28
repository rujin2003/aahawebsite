import type { Metadata } from 'next'
import { supabase } from '@/lib/supabase'

type Params = { params: { id: string } }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { data: product } = await supabase
    .from('products')
    .select('id,title,description,images,updated_at,price')
    .eq('id', params.id)
    .single()

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The requested product could not be found.',
      alternates: { canonical: `${siteUrl}/products/${params.id}` },
      robots: { index: false, follow: false },
    }
  }

  const title = `${product.title}`
  const description = product.description?.slice(0, 160) || 'Handcrafted felt product.'
  const image = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '/hero-bg.jpg'

  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/products/${product.id}` },
    openGraph: {
      type: 'product',
      url: `${siteUrl}/products/${product.id}`,
      title,
      description,
      images: [{ url: image }],
      siteName: 'Felt Artistry',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function ProductLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const { data: product } = await supabase
    .from('products')
    .select('id,title,description,images,price')
    .eq('id', params.id)
    .single()

  const image = product && Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '/hero-bg.jpg'

  const jsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        description: product.description,
        image: image.startsWith('http') ? image : `${siteUrl}${image}`,
        sku: product.id,
        brand: {
          '@type': 'Brand',
          name: 'Felt Artistry',
        },
        offers: {
          '@type': 'Offer',
          url: `${siteUrl}/products/${product.id}`,
          priceCurrency: 'USD',
          price: product.price,
          availability: 'https://schema.org/InStock',
        },
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}


