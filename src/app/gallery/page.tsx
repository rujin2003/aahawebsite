"use client";

export const runtime = "edge";

import { useEffect, useState } from 'react'
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { Gallery } from '@/lib/supabase'
import { Loading } from "@/components/ui/loading"

export default function GalleryPage() {
  const [gallery, setGallery] = useState<Gallery[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [columns, setColumns] = useState<Gallery[][]>([[], [], [], []])

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch('/api/gallery')
        const data = await response.json()
        setGallery(data)
        // Create masonry layout with 4 columns
        const newColumns: Gallery[][] = [[], [], [], []]
        data.forEach((item: Gallery, index: number) => {
          newColumns[index % 4].push(item)
        })
        setColumns(newColumns)
      } catch (error) {
        console.error('Error fetching gallery:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGallery()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col pt-20">
        <SiteHeader />
        <main className="flex-1 py-12">
          <div className="container">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loading className="w-12 h-12" />
                <p className="text-muted-foreground mt-4">Loading gallery...</p>
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
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h1 className="text-4xl font-medium mb-4 animate-fade-up">Our Gallery</h1>
            <p className="text-foreground/70 animate-fade-up animate-delay-100">
              Explore our collection of handcrafted felt creations and behind-the-scenes glimpses
              of our artisans at work. Each piece tells a story of traditional craftsmanship.
            </p>
          </div>

          {/* Pinterest-style Masonry Grid */}
          <div className="flex gap-4">
            {columns.map((column, columnIndex) => (
              <div key={columnIndex} className="flex-1 space-y-4">
                {column.map((item) => {
                  // Random height variation for Pinterest-like layout
                  const heightClass = Math.random() > 0.5 ? 'aspect-[3/4]' : 'aspect-[4/3]'
                  return (
                    <div
                      key={item.id}
                      className="group relative rounded-xl overflow-hidden bg-muted animate-fade-up card-hover-effect"
                      style={{ animationDelay: `${(item.id.length % 10) * 50}ms` }}
                      onClick={() => setSelectedImage(item.id)}
                    >
                      <div className={`relative ${heightClass}`}>
                        <ImageWithSkeleton
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-white font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-white/70 text-sm line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Image modal */}
          {selectedImage && (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
              <div className="relative max-w-4xl w-full bg-background rounded-lg overflow-hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="w-6 h-6" />
                </Button>
                <div className="relative aspect-[4/3] w-full">
                  <ImageWithSkeleton
                    src={gallery.find(img => img.id === selectedImage)?.image_url || ""}
                    alt={gallery.find(img => img.id === selectedImage)?.title || ""}
                    fill
                    className="object-contain"
                  />
                  {/* Navigation Arrows */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentIndex = gallery.findIndex(img => img.id === selectedImage);
                      const prevIndex = (currentIndex - 1 + gallery.length) % gallery.length;
                      setSelectedImage(gallery[prevIndex].id);
                    }}
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentIndex = gallery.findIndex(img => img.id === selectedImage);
                      const nextIndex = (currentIndex + 1) % gallery.length;
                      setSelectedImage(gallery[nextIndex].id);
                    }}
                  >
                    <ArrowRight className="w-6 h-6" />
                  </Button>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-medium mb-1">
                    {gallery.find(img => img.id === selectedImage)?.title}
                  </h3>
                  <p className="text-foreground/70">
                    {gallery.find(img => img.id === selectedImage)?.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
