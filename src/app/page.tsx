'use client'
import FurnitureSlider from "@/components/ui/FurnitureSlider";

import { useEffect, useState, useRef } from 'react'
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { getCategoriesQuery, isAvailableInCountry } from '@/lib/country';
import { useCountryStore } from "@/lib/countryStore";
import { convertUSDToLocalCurrency } from '@/lib/utils';

import Categories from "./category";
import MissionSection from "@/components/mission_gradient";
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
        
      
        // Fetch products
        const productsResponse = await fetch(`/api/products?countryCode=${countryCode || ''}`)
        const productsData = await productsResponse.json()

        if (productsResponse.ok && Array.isArray(productsData)) {
          const processedProducts = productsData.map(product => ({
            ...product,
            images: product.images && Array.isArray(product.images) && product.images.length > 0 
              ? product.images 
              : ['/placeholder.png']
          })).slice(0, 7) // Limit products on the client side after fetching
          setProducts(processedProducts)
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
      
      for (const product of products) {
        if (!countryCode) {
          newLocalPrices[product.id] = { amount: product.price, symbol: '$', code: 'USD' };
          continue;
        }
        const converted = await convertUSDToLocalCurrency(product.price, countryCode);
        newLocalPrices[product.id] = converted;
      }
      
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

      const data = await response.json()
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
      {/* Enhanced Hero Section with Premium Design */}
{/* Enhanced Hero Section with Premium Design - Fully Responsive */}
<section className="relative min-h-[600px] xs:min-h-[650px] sm:min-h-[700px] md:min-h-[80vh] lg:min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-secondary via-background to-accent/10">
  {/* Background Image with Parallax Effect */}
  <div className="absolute inset-0 z-0">
    <Image
      src="/hero-bg.png"
      alt="Handcrafted felt products in a beautiful home setting"
      fill
      className="object-cover opacity-40"
      priority
      fetchPriority="high"
      quality={75}
      sizes="100vw"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAAUH/8QAIhAAAgEDBAMBAAAAAAAAAAAAAQIDAAQRBQYSIRMxQVH/xAAVAQEBAAAAAAAAAAAAAAAAAAADBP/EABkRAAMBAQEAAAAAAAAAAAAAAAABAhEDIf/aAAwDAQACEQMRAD8Awa0jljMjMpVc4VlIPYG9EHg/tbjaO6dQu7KCa5u2lldQWd+yT+mlKtTqCy0//9k="
    />
    <div className="absolute inset-0 bg-gradient-to-br from-background/60 via-background/40 to-transparent"></div>
  </div>
  
  {/* Organic shapes for visual interest */}
  <div className="absolute top-0 right-0 w-[250px] sm:w-[400px] md:w-[500px] lg:w-[600px] h-[250px] sm:h-[400px] md:h-[500px] lg:h-[600px] opacity-20 blur-3xl">
    <div className="absolute top-0 right-0 w-full h-full rounded-full bg-primary/20"></div>
  </div>
  <div className="absolute bottom-0 left-0 w-[200px] sm:w-[350px] md:w-[450px] lg:w-[500px] h-[200px] sm:h-[350px] md:h-[450px] lg:h-[500px] opacity-20 blur-3xl">
    <div className="absolute bottom-0 left-0 w-full h-full rounded-full bg-accent/30"></div>
  </div>

  <div className="container relative z-10 py-12 xs:py-14 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6">
    <div className="grid lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center">
      {/* Left: Content */}
      <div className="space-y-4 xs:space-y-5 sm:space-y-6 lg:space-y-8 max-w-2xl mx-auto lg:mx-0">
        {/* Badge */}
        <div className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/80 backdrop-blur-sm border border-primary/10 shadow-soft animate-on-scroll fade-up hover:shadow-md hover:border-primary/30 transition-all duration-300 cursor-default">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[10px] xs:text-xs sm:text-sm font-medium text-foreground flex items-center gap-1 sm:gap-1.5">
            <span className="inline-block animate-fade-in-tag" style={{ animationDelay: '0ms' }}>Sustainable</span>
            <span className="text-primary/40">•</span>
            <span className="inline-block animate-fade-in-tag" style={{ animationDelay: '150ms' }}>Handcrafted</span>
            <span className="text-primary/40">•</span>
            <span className="inline-block animate-fade-in-tag" style={{ animationDelay: '300ms' }}>Unique</span>
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-on-scroll fade-up font-playfair leading-[1.1] text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl" style={{ transitionDelay: '100ms' }}>
          Transform Your Space<br />
          <span className="text-primary">with Artisan Felt</span>
        </h1>

        {/* Subheadline */}
        <p className="text-base xs:text-lg sm:text-xl md:text-2xl text-foreground/70 leading-relaxed animate-on-scroll fade-up max-w-xl" style={{ transitionDelay: '200ms' }}>
          Discover eco-friendly home décor crafted with love by skilled artisans using traditional wool felting techniques.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 animate-on-scroll fade-up" style={{ transitionDelay: '300ms' }}>
          <Button 
            size="lg" 
            className="rounded-full px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto" 
            asChild
          >
            <Link href="/shop">
              Explore Collection
              <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="rounded-full px-6 sm:px-8 h-12 sm:h-14 text-sm sm:text-base border-2 hover:bg-primary/5 transition-all duration-300 w-full sm:w-auto" 
            asChild
          >
            <Link href="/company">
              Our Story
            </Link>
          </Button>
        </div>
      </div>

      {/* Right: Featured Product Image - Hidden on mobile, visible on lg+ */}
      <div className="hidden lg:block relative animate-on-scroll fade-left" style={{ transitionDelay: '300ms' }}>
        <div className="relative aspect-square rounded-3xl overflow-hidden shadow-soft-lg">
          <Image
            src="/hero-bg.png"
            alt="Featured felt products"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1024px) 0vw, 50vw"
          />
          {/* Floating badge */}
          <div className="absolute top-6 right-6 px-4 py-2 rounded-full bg-white shadow-lg backdrop-blur-sm">
            <span className="text-sm font-medium">✨ New Arrivals</span>
          </div>
        </div>
        {/* Decorative element */}
        <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-primary/10 blur-2xl"></div>
      </div>
    </div>
  </div>

  {/* Scroll indicator */}
  <div className="absolute bottom-4 sm:bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  </div>
</section>

<MissionSection></MissionSection>

        {/* Categories Section */}
        <section className="py-12 sm:py-16 bg-muted/50">
          <div className="container px-4 sm:px-6">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl font-medium mb-4 animate-fade-up">Explore Our Collections</h2>
              <p className="text-muted-foreground animate-fade-up animate-delay-100 text-sm sm:text-base">
                Browse our carefully curated categories of handcrafted felt products
              </p>
            </div>
            <div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-2xl md:max-w-6xl mx-auto">
                {categories.slice(0, 4).map((category, index) => (
                  <Link 
                    href={`/shop?category=${category.id}`} 
                    key={category.id}
                    className="group relative aspect-[1/1.2] rounded-lg overflow-hidden animate-fade-up w-full"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div 
                      className="absolute inset-0"
                      style={{
                        background: `url(${category.image}) center center / cover no-repeat`,
                      }}
                    />
                    {/* Scaled layer for hover effect */}
                    <div 
                      className="absolute inset-[-10px] transition-transform duration-500 group-hover:scale-110"
                      style={{
                        background: `url(${category.image}) center center / cover no-repeat`,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4">
                        <h3 className="text-sm sm:text-base font-medium text-white mb-1 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          {category.name}
                        </h3>
                        <p className="text-white/80 text-xs transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75 line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Popular Products Section */}
        <section className="py-10">
          <div className="container">
            <div className="relative">
              <h3 className="text-3xl mb-6 text-center animate-on-scroll fade-up">Start shaping your spaces</h3>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-24 h-1 bg-gradient-to-r from-transparent via-[#8B7355] to-transparent"></div>
            </div>
                
            <div className="animate-on-scroll fade-up" style={{ transitionDelay: '100ms' }}>
              <ProductSlider products={products} />
            </div>

            <div className="flex justify-center mt-10 animate-on-scroll fade-up" style={{ transitionDelay: '200ms' }}>
              <Button className="rounded-full" asChild>
                <Link href="/shop">
                  All Products
                </Link>
              </Button>
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
                    src="/hero-bg.png"
                    alt="Artisan crafting felt products"
                    fill
                    className="object-cover"
                  />
                </div>
                {/* Decorative elements */}
                <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-accent/20 rounded-full blur-2xl"></div>
              </div>

              {/* Content Side */}
              <div className="space-y-6 animate-on-scroll fade-left">
                <div className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 text-primary text-sm font-medium border border-primary/20 hover:border-primary/40 transition-all duration-300 cursor-default animate-shimmer bg-[length:200%_100%]">
                  <span className="animate-bounce-subtle">✨</span>
                  <span className="font-semibold tracking-wide">Our Story</span>
                </div>
                
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
              <div className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-100/80 via-accent/40 to-green-100/80 text-foreground text-sm font-medium border border-green-200/50 hover:border-green-300 transition-all duration-300 cursor-default animate-shimmer bg-[length:200%_100%]">
                <span className="animate-leaf-sway">🌱</span>
                <span className="font-semibold tracking-wide text-green-800">Sustainability</span>
              </div>
              <h2 className="font-playfair">
                Beautiful Products,<br />
                <span className="text-primary">Beautiful Planet</span>
              </h2>
              <p className="text-lg text-foreground/70">
                We're committed to creating products that are as kind to the earth as they are beautiful in your home.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Eco-Friendly Materials */}
              <div className="group p-8 rounded-2xl bg-white border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-soft-lg animate-on-scroll fade-up">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Natural Materials</h3>
                <p className="text-foreground/70 leading-relaxed">
                  100% natural wool from ethically-sourced farms, dyed with eco-friendly, non-toxic colors that are safe for your family and the planet.
                </p>
              </div>

              {/* Zero Waste */}
              <div className="group p-8 rounded-2xl bg-white border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-soft-lg animate-on-scroll fade-up" style={{ transitionDelay: '100ms' }}>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Minimal Waste</h3>
                <p className="text-foreground/70 leading-relaxed">
                  Our traditional felting techniques create minimal waste. Every scrap of wool is repurposed or composted, supporting a circular economy.
                </p>
              </div>

              {/* Fair Trade */}
              <div className="group p-8 rounded-2xl bg-white border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-soft-lg animate-on-scroll fade-up" style={{ transitionDelay: '200ms' }}>
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <div className="group p-10 rounded-3xl bg-white shadow-soft hover:shadow-soft-lg transition-all duration-500 animate-on-scroll fade-right">
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      <li className="flex items-start">
                        <span className="text-primary mr-3 mt-1">✓</span>
                        <span className="text-foreground/80">Individual artisan attention to every detail</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-3 mt-1">✓</span>
                        <span className="text-foreground/80">Time-honored traditional techniques</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-3 mt-1">✓</span>
                        <span className="text-foreground/80">Unique character in every single piece</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="group p-10 rounded-3xl bg-white shadow-soft hover:shadow-soft-lg transition-all duration-500 animate-on-scroll fade-left" style={{ transitionDelay: '100ms' }}>
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      <li className="flex items-start">
                        <span className="text-primary mr-3 mt-1">✓</span>
                        <span className="text-foreground/80">100% natural, premium quality wool</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-3 mt-1">✓</span>
                        <span className="text-foreground/80">Non-toxic, eco-friendly dyes</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-3 mt-1">✓</span>
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                <span>⭐ Customer Reviews</span>
              </div>
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
                  className="group p-8 bg-white rounded-2xl border border-border hover:border-primary/30 shadow-soft hover:shadow-soft-lg transition-all duration-500 animate-on-scroll fade-up" 
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Star Rating */}
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
        <section className="mt-8 py-20 bg-[rgb(240,236,226)] rounded-3xl mx-4 sm:mx-8 lg:mx-12 mb-16 overflow-hidden">
          <div className="container relative">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl mb-4 animate-on-scroll fade-up">
                  <span className="font-bold text-black">We believe</span> 
                  <span className="text-[rgb(180,170,160)]"> in meaningful conversations</span>
                </h2>
                <p className="text-[rgb(180,170,160)] max-w-2xl mx-auto animate-on-scroll fade-up" style={{ transitionDelay: '100ms' }}>
                  To help you out, we provide personalized assistance for all your felt crafting needs. Whether you have questions about our products or need custom solutions, we're here to help.
                </p>
              </div>

              <form onSubmit={handleContactSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side */}
                <div className="space-y-6 animate-on-scroll fade-right">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Your Name
                    </label>
                    <Input id="name" ref={nameRef} placeholder="Enter your name" className="rounded-lg shadow-sm border-gray-300" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <Input id="email" ref={emailRef} type="email" placeholder="you@example.com" className="rounded-lg shadow-sm border-gray-300" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <Input id="subject" ref={subjectRef} placeholder="How can we help you?" className="rounded-lg shadow-sm border-gray-300" />
                  </div>
                </div>

                {/* Right Side */}
                <div className="space-y-6 animate-on-scroll fade-left">
                  <div className="space-y-2">
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      ref={messageRef}
                      placeholder="Tell us about your inquiry..."
                      className="rounded-lg shadow-sm min-h-[160px] border-gray-300"
                    />
                  </div>
                  <Button 
                    className="rounded-full border border-black text-black bg-transparent hover:bg-gray-100 transition" 
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

        {/* Features Section */}
        <section className="py-20">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center animate-fade-up">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#4A90E2]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#4A90E2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">Handcrafted</h3>
                <p className="text-muted-foreground">
                  Each item is carefully made by skilled artisans using traditional techniques
                </p>
              </div>
              <div className="text-center animate-fade-up animate-delay-100">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#50C878]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#50C878]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">Sustainable</h3>
                <p className="text-muted-foreground">
                  We use eco-friendly materials and sustainable production methods
                </p>
              </div>
              <div className="text-center animate-fade-up animate-delay-200">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#FF9F43]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#FF9F43]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">Unique</h3>
                <p className="text-muted-foreground">
                  Every piece is one-of-a-kind, made with attention to detail
                </p>
              </div>
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