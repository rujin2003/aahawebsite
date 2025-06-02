'use client'

import { useEffect, useState } from 'react'
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product, Category } from '@/lib/supabase'
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from 'lucide-react'
import { Loading } from "@/components/ui/loading"

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsResponse = await fetch('/api/products')
        const productsData = await productsResponse.json()
        
        if (productsResponse.ok && Array.isArray(productsData)) {
          setProducts(productsData)
        } else {
          console.error('Products API error:', productsData)
          setProducts([])
        }

        // Fetch categories
        const categoriesResponse = await fetch('/api/categories')
        const categoriesData = await categoriesResponse.json()
        
        if (categoriesResponse.ok && Array.isArray(categoriesData)) {
          setCategories(categoriesData)
        } else {
          console.error('Categories API error:', categoriesData)
          setCategories([])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.category_id === selectedCategory)

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col pt-20">
        <SiteHeader />
        <main className="flex-1 py-12">
          <div className="container">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loading className="w-12 h-12" />
                <p className="text-muted-foreground mt-4">Loading products...</p>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col pt-20">
      <SiteHeader />

      <main className="flex-1 py-12">
        <div className="container">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-500/20 to-primary/10 py-16 px-6 md:px-10 mb-16">
            <div className="absolute inset-0 z-0">
              <div className="absolute top-[-30%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[80px]"></div>
              <div className="absolute bottom-[-20%] right-[-5%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[60px]"></div>
            </div>
            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <h1 className="text-4xl font-saans font-medium mb-4 animate-fade-up">Shop Our Collection</h1>
              <p className="text-muted-foreground animate-fade-up animate-delay-200">
                Browse our selection of handcrafted felt products. Each piece is made with love and care by skilled artisans using traditional techniques.
              </p>
            </div>
          </div>

          <Tabs defaultValue="all" value={selectedCategory} onValueChange={setSelectedCategory} className="mb-12">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-muted/50 p-1 rounded-full">
                <TabsTrigger value="all" className="rounded-full">All Products</TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id} 
                    className="rounded-full"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Tabs>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative">
      <Link href={`/shop/product/${product.id}`} className="block">
        <Card className="overflow-hidden border border-gray-200 rounded-2xl transition-all duration-300 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:-translate-y-1 bg-white">
          <div className="relative p-4">
            <div className="aspect-square overflow-hidden bg-muted/50 flex items-center justify-center rounded-xl">
              <Image
                src={product.images[0]}
                alt={product.title}
                width={200}
                height={200}
                className="object-cover w-full h-full transition-transform group-hover:scale-105 duration-300 rounded-xl"
              />
            </div>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90">
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-medium text-base truncate">{product.title}</h3>
            <p className="text-lg font-semibold mt-1">${product.price.toFixed(2)}</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}