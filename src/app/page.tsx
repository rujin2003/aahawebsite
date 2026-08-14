'use client'

import { useEffect, useState, useRef } from 'react'
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ProductSlider } from "@/components/product-slider";
import { AnimationProvider } from "@/components/animation-provider";
import Image from "next/image";
import Link from "next/link";
import { Category } from '@/lib/supabase'
import { Loading } from "@/components/ui/loading"
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/supabase';
import { toast } from "sonner";
import { Leaf, Check } from "lucide-react";
import { getCategoriesQuery, isAvailableInCountry } from '@/lib/country';
import { useCountryStore } from "@/lib/countryStore";
import { convertUSDToLocalCurrency } from '@/lib/utils';

import Categories from "./category";
import MissionSection from "@/components/mission_gradient";
import { CinematicIntro } from "@/components/cinematic-intro";
import { useIntroDone } from "@/lib/intro-state";
import { cn } from "@/lib/utils";
// import KiniHeroBanner from "@/components/kini_hero";

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [contactLoading, setContactLoading] = useState(false)
  const [contactSuccess, setContactSuccess] = useState<string|null>(null)
  const [contactError, setContactError] = useState<string|null>(null)
  const [localPrices, setLocalPrices] = useState<Record<string, { amount: number; symbol: string; code: string }>>({});
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const subjectRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const countryCode = useCountryStore(s=>s.countryCode)
  const isSupportedCountry = useCountryStore(s => s.isSupportedCountry)
  const countryLoading = useCountryStore(s=>s.isLoading)
  const introDone = useIntroDone()

  // staged hero reveal, released the moment the cinematic intro lets go
  const heroReveal = (delay: number) => ({
    className: cn(
      "transition-all duration-700 ease-out",
      introDone ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
    ),
    style: { transitionDelay: `${delay}ms` },
  })


  useEffect(() => {
    const fetchData = async () => {
      if(!countryCode) return;
      try {
        // Fetch categories
        const categoriesResponse = await getCategoriesQuery(supabase, countryCode || '')
        if (categoriesResponse.error) {
          console.error('Categories API error:', categoriesResponse.error)
          setCategories([])
        } else if (Array.isArray(categoriesResponse.data)) {
          setCategories(categoriesResponse.data)
        } else {
          console.warn('Categories response format unexpected:', categoriesResponse)
          setCategories([])
        }
        
      
        // Fetch products — parse defensively: an error page or empty body
        // isn't valid JSON and would throw in Safari ("string did not match
        // the expected pattern")
        const productsResponse = await fetch(`/api/products?countryCode=${countryCode || ''}`)
        let productsData: unknown = null
        try {
          productsData = await productsResponse.json()
        } catch {
          console.error('Products API returned a non-JSON response')
        }

        if (productsResponse.ok && Array.isArray(productsData)) {
          const withImages = productsData.map(product => ({
            ...product,
            images: product.images && Array.isArray(product.images) && product.images.length > 0
              ? product.images
              : ['/placeholder.png']
          }))

          // one variant per product group
          const seenGroups = new Set<string>()
          const unique: Product[] = []
          for (const p of withImages) {
            const gid = p.group_id || p.id
            if (!seenGroups.has(gid)) {
              seenGroups.add(gid)
              unique.push(p)
            }
          }

          // round-robin across categories so the first products the visitor
          // sees each come from a different collection
          const byCategory = new Map<string, Product[]>()
          for (const p of unique) {
            const key = p.category_id || 'uncategorized'
            const bucket = byCategory.get(key) || []
            bucket.push(p)
            byCategory.set(key, bucket)
          }
          const buckets = Array.from(byCategory.values())
          const picks: Product[] = []
          for (let round = 0; picks.length < 8; round++) {
            let added = false
            for (const bucket of buckets) {
              if (bucket[round]) {
                picks.push(bucket[round])
                added = true
                if (picks.length >= 8) break
              }
            }
            if (!added) break
          }
          setProducts(picks)
        } else {
          console.error('Products API error:', productsData)
          setProducts([])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (!countryLoading) {
      fetchData()
    }
  }, [countryCode, countryLoading])

  // Convert prices to local currency when products change
  useEffect(() => {
    if (!isSupportedCountry || !products.length) return;
    
    const convertPrices = async () => {
      const newLocalPrices: Record<string, { amount: number; symbol: string; code: string }> = {};

      await Promise.all(
        products.map(async (product) => {
          newLocalPrices[product.id] = countryCode
            ? await convertUSDToLocalCurrency(product.price, countryCode)
            : { amount: product.price, symbol: '$', code: 'USD' };
        })
      );

      setLocalPrices(newLocalPrices);
    };
    
    convertPrices();
  }, [products, countryCode, isSupportedCountry]);

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setContactLoading(true)
    setContactSuccess(null)
    setContactError(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameRef.current?.value,
          email: emailRef.current?.value,
          subject: subjectRef.current?.value,
          message: messageRef.current?.value,
          source: 'home_page'
        })
      })

      let data: { error?: string } = {}
      try {
        data = await response.json()
      } catch {}
      if (response.ok) {
        setContactSuccess('Message sent successfully!')
        if (nameRef.current) nameRef.current.value = ''
        if (emailRef.current) emailRef.current.value = ''
        if (subjectRef.current) subjectRef.current.value = ''
        if (messageRef.current) messageRef.current.value = ''
        toast.success('Message sent successfully!')
      } else {
        setContactError(data.error || 'Failed to send message.')
        toast.error(data.error || 'Failed to send message.')
      }
    } catch (err) {
      setContactError('Failed to send message.')
      toast.error('Failed to send message.')
    } finally {
      setContactLoading(false)
    }
  }

  // Update the product display to hide prices for unsupported countries
  const renderProductPrice = (product: Product) => {
    if (!isSupportedCountry) {
      return (
        <p className="text-sm text-muted-foreground">
          Contact us for pricing
        </p>
      )
    }
    return (
      <p className="text-lg font-medium">
        {localPrices[product.id] 
          ? `${localPrices[product.id].symbol}${localPrices[product.id].amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : '...'}
      </p>
    )
  }

  if (loading) {
    return (
      <div className="container py-10 flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AnimationProvider />
      <SiteHeader />

      <main className="flex-1 pt-0">
      {/* Scroll-scrubbed cinematic opening film */}
      <CinematicIntro />

      {/* Hero — the workshop the characters just rose out of. The hanging
          felt characters are the only product imagery; everything behind
          them is atmosphere. */}
<section className="relative min-h-[600px] sm:min-h-[700px] md:min-h-[85vh] lg:min-h-[92vh] flex items-center overflow-hidden" style={{ backgroundColor: '#f4eee3' }}>
  {/* soft plaster-wall light */}
  <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(180deg, #f8f3ea 0%, #f4eee3 55%, #efe6d5 100%)' }}></div>
  <div className="absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full opacity-50 blur-3xl z-0" style={{ background: 'radial-gradient(circle, rgba(255,243,222,0.9), transparent 70%)', contain: 'layout paint' }}></div>

  {/* the workshop table, after the characters left it for the navigation */}
  <div className="absolute inset-x-0 bottom-0 z-0 h-[38%] sm:h-[42%]">
    <Image
      src="/hero-table.webp"
      alt="The Aaha Felt workshop table with wool, felt textiles and a wicker basket"
      fill
      className="object-cover"
      style={{ filter: 'contrast(1.05) sepia(0.12) saturate(1.02) brightness(1.03)' }}
      priority
      fetchPriority="high"
      quality={80}
      sizes="100vw"
    />
    <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #f4eee3 0%, rgba(244,238,227,0.85) 16%, rgba(244,238,227,0) 60%)' }}></div>
  </div>

  <div className="container relative z-10 py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6">
    <div className="space-y-5 sm:space-y-6 lg:space-y-8 max-w-2xl mx-auto lg:mx-0">
      <h1 {...heroReveal(140)}>
        <span className="block font-playfair leading-[1.08] text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight">
          Transform Your Space<br />
          <span className="text-primary font-normal italic">with Artisan Felt</span>
        </span>
      </h1>

      <p {...heroReveal(300)}>
        <span className="block text-base sm:text-lg md:text-xl text-foreground/70 leading-relaxed max-w-xl">
          Discover eco-friendly home décor crafted with love by skilled artisans using traditional wool felting techniques.
        </span>
      </p>

      <div {...heroReveal(440)}>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
          <Button
            size="lg"
            className="group/btn rounded-full px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto"
            asChild
          >
            <Link href="/shop">
              Explore Collection
              <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base border-2 border-foreground/20 hover:border-primary hover:bg-primary/5 transition-all duration-300 w-full sm:w-auto"
            asChild
          >
            <Link href="/company">
              Our Story
            </Link>
          </Button>
        </div>
      </div>
    </div>
  </div>

  <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 opacity-40 hover:opacity-60 transition-opacity duration-500">
    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  </div>
</section>

<MissionSection></MissionSection>

        {/* Categories Section */}
        <section className="py-14 sm:py-20 bg-muted/50 overflow-hidden">
          <div className="container px-4 sm:px-6">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 mb-10 sm:mb-14">
              <div className="max-w-lg">
                <p className="text-[11px] uppercase tracking-[0.3em] text-primary font-medium mb-3 animate-fade-up">
                  Four small worlds of wool
                </p>
                <div className="relative inline-block">
                  {/* red heart-petal flower standing at the end of the title,
                      as if growing beside the last word */}
                  <Image
                    src="/flowers/flower-red-stem.png"
                    alt=""
                    width={320}
                    height={372}
                    className="absolute -bottom-1 -right-10 md:-right-[4.5rem] w-12 md:w-[4.25rem] h-auto rotate-[7deg] -z-10 pointer-events-none animate-float"
                    style={{ animationDuration: "10s" }}
                  />
                  <h2 className="relative font-playfair text-3xl sm:text-4xl md:text-5xl font-light tracking-tight animate-fade-up">
                    Explore Our Collections
                  </h2>
                </div>
                <p className="mt-3 text-sm sm:text-base text-muted-foreground animate-fade-up animate-delay-100">
                  Every collection begins on the same workshop table — pick the one your home is missing.
                </p>
              </div>
              <Link
                href="/shop"
                className="group inline-flex items-center gap-2 text-sm font-medium text-primary transition-all hover:gap-3"
              >
                Browse everything
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-2xl md:max-w-6xl mx-auto">
              {categories.slice(0, 4).map((category, index) => (
                <Link
                  href={`/shop?category=${category.id}`}
                  key={category.id}
                  className="group relative aspect-[1/1.25] rounded-2xl overflow-hidden w-full ring-1 ring-foreground/5 shadow-soft transition-shadow duration-500 hover:shadow-soft-lg animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Image
                    src={category.image}
                    alt={category.name || 'Category'}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                    loading="lazy"
                    quality={75}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10">
                    <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-5">
                      <h3 className="font-playfair text-base sm:text-xl text-white mb-0.5">
                        {category.name}
                      </h3>
                      <p className="text-white/75 text-xs line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
                        {category.description}
                      </p>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-white/90 opacity-70 sm:opacity-0 sm:-translate-x-1 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 transition-all duration-300">
                        Shop the collection
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Products Section */}
        <section className="py-14 md:py-20 overflow-hidden">
          <div className="container">
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5 mb-8 md:mb-10">
              <div className="max-w-lg animate-on-scroll fade-up">
                <p className="text-[11px] uppercase tracking-[0.3em] text-primary font-medium mb-3">
                  One piece from every collection
                </p>
                <div className="relative inline-block">
                  {/* pink felt bloom over the title's corner — its needle and
                      thread trail down behind the words like a stitch in
                      progress */}
                  <Image
                    src="/flowers/flower-pink-needle.png"
                    alt=""
                    width={320}
                    height={385}
                    className="absolute -top-5 -right-10 md:-top-8 md:-right-[4.25rem] w-14 md:w-20 h-auto rotate-[10deg] -z-10 pointer-events-none animate-float"
                    style={{ animationDuration: "11s" }}
                  />
                  <h2 className="relative font-playfair text-3xl sm:text-4xl md:text-5xl font-light tracking-tight">
                    Start shaping your space
                  </h2>
                </div>
                <p className="mt-3 text-sm sm:text-base text-muted-foreground">
                  A first look across the whole workshop — each of these comes from a different collection.
                </p>
              </div>
              <Button variant="outline" className="rounded-full border-foreground/20 hover:border-primary hover:bg-primary/5" asChild>
                <Link href="/shop">All products</Link>
              </Button>
            </div>

            <div className="animate-on-scroll fade-up" style={{ transitionDelay: '100ms' }}>
              <ProductSlider products={products} />
            </div>
          </div>
        </section>

        {/* Artisan Story Section */}
        <section className="py-10 md:py-14 lg:py-16 bg-gradient-to-b from-secondary/30 to-background overflow-hidden">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Image Side */}
              <div className="relative animate-on-scroll fade-right">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-soft-lg">
                  <Image
                    src="/artisan-img.png"
                    alt="Artisan crafting felt products"
                    fill
                    className="object-cover"
                    loading="lazy"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    quality={80}
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-accent/20 rounded-full blur-2xl"></div>
              </div>

              {/* Content Side */}
              <div className="space-y-6 animate-on-scroll fade-left">
                <h2 className="font-playfair">
                  Crafted with Love,<br />
                  <span className="text-primary">Inspired by Tradition</span>
                </h2>
                
                <div className="space-y-4 text-foreground/70 text-lg leading-relaxed">
                  <p>
                    Every piece at Aaha Felt tells a story of dedication, skill, and passion. Our artisans have spent years mastering the ancient art of wool felting, transforming natural fibers into beautiful, functional works of art.
                  </p>
                  <p>
                    We believe in preserving traditional craftsmanship while creating products that fit modern lifestyles. Each item is made by hand, ensuring that no two pieces are exactly alike—just like the homes they'll beautify.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 pt-4">
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">15+</div>
                    <p className="text-foreground/70">Years of Experience</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">100%</div>
                    <p className="text-foreground/70">Handcrafted</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">50+</div>
                    <p className="text-foreground/70">Skilled Artisans</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-primary">5000+</div>
                    <p className="text-foreground/70">Happy Customers</p>
                  </div>
                </div>

                <div className="pt-4">
                  <Button size="lg" className="rounded-full" asChild>
                    <Link href="/company">
                      Learn More About Us
                      <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sustainability Highlights Section */}
        <section className="py-10 md:py-12 lg:py-14">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-4 animate-on-scroll fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/30 text-foreground text-sm font-medium border border-accent/40 cursor-default">
                <Leaf className="w-4 h-4 text-green-700" />
                <span className="font-semibold tracking-wide uppercase text-xs text-green-800">Sustainability</span>
              </div>
              <h2 className="font-playfair">
                Beautiful Products,<br />
                <span className="text-primary">Beautiful Planet</span>
              </h2>
              <p className="text-lg text-foreground/70">
                We're committed to creating products that are as kind to the earth as they are beautiful in your home.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              <div className="group p-6 md:p-8 rounded-2xl bg-card border-l-4 border-l-rose-soft border border-border hover:shadow-soft-lg transition-all duration-500 animate-on-scroll fade-up">
                <div className="w-14 h-14 rounded-2xl bg-rose-soft flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500">
                  <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Natural Materials</h3>
                <p className="text-foreground/70 leading-relaxed">
                  100% natural wool from ethically-sourced farms, dyed with eco-friendly, non-toxic colors that are safe for your family and the planet.
                </p>
              </div>

              <div className="group p-6 md:p-8 rounded-2xl bg-card border-l-4 border-l-sage-soft border border-border hover:shadow-soft-lg transition-all duration-500 animate-on-scroll fade-up" style={{ transitionDelay: '100ms' }}>
                <div className="w-14 h-14 rounded-2xl bg-sage-soft flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500">
                  <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Minimal Waste</h3>
                <p className="text-foreground/70 leading-relaxed">
                  Our traditional felting techniques create minimal waste. Every scrap of wool is repurposed or composted, supporting a circular economy.
                </p>
              </div>

              <div className="group p-6 md:p-8 rounded-2xl bg-card border-l-4 border-l-clay-warm border border-border hover:shadow-soft-lg transition-all duration-500 animate-on-scroll fade-up" style={{ transitionDelay: '200ms' }}>
                <div className="w-14 h-14 rounded-2xl bg-clay-warm flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500">
                  <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Fair Trade Practices</h3>
                <p className="text-foreground/70 leading-relaxed">
                  We ensure fair wages and safe working conditions for all our artisans, supporting local communities and preserving traditional crafts.
                </p>
              </div>
            </div>
          </div>
        </section>

       {/* Featured Product */}

  {/* </section> */}

        {/* Benefits Section */}
        <section className="section-spacing-sm bg-secondary/20">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16 animate-on-scroll fade-up">
              <h2 className="font-playfair mb-4">Why Choose Aaha Felt?</h2>
              <p className="text-lg text-foreground/70">
                Experience the perfect blend of tradition, quality, and sustainability
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="group p-8 md:p-10 rounded-3xl bg-card border-t-4 border-t-rose-soft shadow-soft hover:shadow-soft-lg transition-all duration-500 animate-on-scroll fade-right">
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-rose-soft flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500">
                      <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-playfair mb-4">Handcrafted Excellence</h3>
                  </div>

                  <p className="text-foreground/70 leading-relaxed mb-6 text-lg">
                    Each piece is meticulously crafted by skilled artisans using traditional needle felting and wet felting techniques. Our dedication to craftsmanship ensures every item has its own unique character and exceptional quality.
                  </p>

                  <div className="mt-auto">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/80">Individual artisan attention to every detail</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/80">Time-honored traditional techniques</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/80">Unique character in every single piece</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="group p-8 md:p-10 rounded-3xl bg-card border-t-4 border-t-sage-soft shadow-soft hover:shadow-soft-lg transition-all duration-500 animate-on-scroll fade-left" style={{ transitionDelay: '100ms' }}>
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-sage-soft flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-500">
                      <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-playfair mb-4">Premium Natural Materials</h3>
                  </div>

                  <p className="text-foreground/70 leading-relaxed mb-6 text-lg">
                    We use only the finest 100% natural wool sourced from farms that prioritize animal welfare and sustainable practices. Our dyes are eco-friendly and non-toxic, minimizing environmental impact.
                  </p>

                  <div className="mt-auto">
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/80">100% natural, premium quality wool</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/80">Non-toxic, eco-friendly dyes</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-foreground/80">Ethically sourced from trusted farms</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
       
        {/* Customer Reviews / Testimonials */}
        <section className="section-spacing">
          <div className="container">
            <div className="text-center max-w-3xl mx-auto mb-16 animate-on-scroll fade-up">
              <h2 className="font-playfair mb-4">Loved by Our Customers</h2>
              <p className="text-lg text-foreground/70">
                Don't just take our word for it—hear what our community has to say
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Miller",
                  role: "Interior Designer",
                  review: "The felt wall hanging I purchased transformed my living room. The colors are vibrant, the craftsmanship is exceptional, and it adds such a warm, artistic touch to our home. Absolutely love it!",
                  rating: 5
                },
                {
                  name: "James Wilson",
                  role: "New Parent",
                  review: "I ordered several felt animals from the collection for my daughter's nursery. They are absolutely adorable, meticulously made, and completely safe. A perfect heirloom gift that will last generations!",
                  rating: 5
                },
                {
                  name: "Emily Zhang",
                  role: "Sustainability Advocate",
                  review: "As someone who appreciates traditional crafts, I'm impressed by the attention to detail in every piece. Their commitment to sustainable materials and fair trade aligns perfectly with my values.",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <div 
                  key={index}
                  className="group relative p-8 bg-card rounded-2xl border border-border hover:border-primary/20 shadow-soft hover:shadow-soft-lg transition-all duration-500 animate-on-scroll fade-up overflow-hidden" 
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <span className="absolute top-4 right-6 font-playfair text-6xl text-primary/8 leading-none select-none" aria-hidden="true">&ldquo;</span>
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <p className="text-foreground/70 leading-relaxed mb-6 italic">
                    "{testimonial.review}"
                  </p>
                  
                  <div className="flex items-center pt-4 border-t border-border">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-500">
                      <span className="text-primary font-semibold text-lg">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-foreground/60">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center items-center gap-8 mt-16 pt-12 border-t border-border animate-on-scroll fade-up">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-xl">4.9/5</div>
                  <div className="text-sm text-foreground/60">Average Rating</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-xl">5,000+</div>
                  <div className="text-sm text-foreground/60">Happy Customers</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-xl">100%</div>
                  <div className="text-sm text-foreground/60">Secure Checkout</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Contact Section */}
        <section className="mt-8 py-16 md:py-20 bg-secondary rounded-3xl mx-4 sm:mx-8 lg:mx-12 mb-16 overflow-hidden">
          <div className="container relative">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl mb-4 animate-on-scroll fade-up">
                  <span className="font-bold text-foreground">We believe</span> 
                  <span className="text-muted-foreground"> in meaningful conversations</span>
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto animate-on-scroll fade-up" style={{ transitionDelay: '100ms' }}>
                  To help you out, we provide personalized assistance for all your felt crafting needs. Whether you have questions about our products or need custom solutions, we&apos;re here to help.
                </p>
              </div>

              <form onSubmit={handleContactSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6 animate-on-scroll fade-right">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-foreground/80">
                      Your Name
                    </label>
                    <Input id="name" ref={nameRef} placeholder="Enter your name" className="rounded-lg shadow-sm border-border bg-card" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-foreground/80">
                      Email Address
                    </label>
                    <Input id="email" ref={emailRef} type="email" placeholder="you@example.com" className="rounded-lg shadow-sm border-border bg-card" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="block text-sm font-medium text-foreground/80">
                      Subject
                    </label>
                    <Input id="subject" ref={subjectRef} placeholder="How can we help you?" className="rounded-lg shadow-sm border-border bg-card" />
                  </div>
                </div>

                <div className="space-y-6 animate-on-scroll fade-left">
                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-sm font-medium text-foreground/80">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      ref={messageRef}
                      placeholder="Tell us about your inquiry..."
                      className="rounded-lg shadow-sm min-h-[160px] border-border bg-card"
                    />
                  </div>
                  <Button 
                    className="rounded-full" 
                    size="lg" 
                    type="submit"
                    disabled={contactLoading}
                  >
                    {contactLoading ? <Loading className="w-6 h-6" /> : 'Send Message'}
                  </Button>
                  {contactSuccess && <p className="text-green-600 mt-2">{contactSuccess}</p>}
                  {contactError && <p className="text-red-600 mt-2">{contactError}</p>}
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Inspired Split Section (replaces Meet Kini) */}
       
      </main>

      <SiteFooter />
    </div>
  );
}
export const runtime = 'edge';