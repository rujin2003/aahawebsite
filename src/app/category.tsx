'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Category } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        const data = await response.json()
        
        if (response.ok && Array.isArray(data)) {
          setCategories(data)
        } else {
          console.error('Categories API error:', data)
          setCategories([])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return <div className="container py-10">Loading categories...</div>
  }

  return (
    <section className="py-10">
      <div className="container">
        <h2 className="text-3xl text-center mb-10 animate-on-scroll fade-up">Explore Our Collections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link href={`/shop/${category.name.toLowerCase().replace(/\s+/g, '-')}`} key={category.id}>
              <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-on-scroll fade-up">
                <div className="relative h-48">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                  <p className="text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
