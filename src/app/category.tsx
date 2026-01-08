'use client'

import { useEffect, useState } from 'react'
import { Category } from '@/lib/supabase'
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
          setCategories([])
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  if (loading) {
    return <div className="container py-10 text-center">Loading categories...</div>
  }

  return (
    <section className="py-16 bg-[#f6f3ee]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl text-center mb-12 font-semibold">
          Explore Our Collections
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const imageSrc = category.image?.startsWith('http')
              ? category.image
              : '/placeholder.jpg'

            return (
              <Link
                href={`/shop/${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                key={category.id}
                className="block group"
              >
                {/* CARD CONTAINER - using inline style for guaranteed background coverage */}
                <div 
                  className="relative w-full h-[420px] rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-xl"
                  style={{
                    background: `url(${imageSrc}) center center / cover no-repeat`,
                  }}
                >
                  {/* Scaled image layer for hover effect */}
                  <div 
                    className="absolute inset-[-10px] transition-transform duration-500 group-hover:scale-110"
                    style={{
                      background: `url(${imageSrc}) center center / cover no-repeat`,
                    }}
                  />

                  {/* OVERLAY */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10" />

                  {/* TEXT */}
                  <div className="absolute inset-0 flex flex-col justify-end p-5 z-20">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {category.name}
                    </h3>
                    <p className="text-white/80 text-sm line-clamp-2">
                      {category.description}
                    </p>
                  </div>

                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
