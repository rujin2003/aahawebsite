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
import FeltCarousel from "@/components/flet_carosuel";
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
      {/* Hero Section with Next.js Image */}
<section className="relative px-4 sm:px-6 md:px-8 lg:px-12 -mt-6 mb-16">
  <div className="rounded-3xl overflow-hidden relative mt-12" style={{ height: "70vh" }}>
    <div className="absolute inset-0 z-0">
      <Image
        src="/hero-bg.jpg"
        alt="Hero background"
        fill
        className="object-cover"
        priority
      />
    </div>
   
    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 to-primary/20 z-10"></div>
    <div className="absolute top-0 right-0 w-full h-full opacity-50 z-5">
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/30 blur-[100px]"></div>
      <div className="absolute bottom-[-20%] left-[5%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[80px]"></div>
    </div>
    <div className="container relative z-20 h-full flex items-center pt-16">
      <div className="max-w-xl space-y-5 text-white">
        <span className="text-sm font-medium animate-on-scroll fade-up">Natural Wool Felting: Sustainable, Handcrafted, Unique</span>
        <h1 className="text-4xl md:text-6xl font-medium leading-tight animate-on-scroll fade-up" style={{ transitionDelay: '100ms' }}>
          Your home, <br />artfully crafted
        </h1>
        <p className="text-white/90 text-lg max-w-md animate-on-scroll fade-up" style={{ transitionDelay: '200ms' }}>
          Discover our collection of sustainable, eco-friendly felt handicrafts made with care and traditional artisanal techniques.
        </p>
        <div className="flex gap-4 pt-4 animate-on-scroll fade-up" style={{ transitionDelay: '300ms' }}>
          <Button size="lg" className="rounded-full bg-white text-primary hover:bg-white/90" asChild>
            <Link href="/shop">
              Shop Now
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="rounded-full border-white text-white bg-transparent hover:bg-white/20" asChild>
            <Link href="/company">
              Learn More
            </Link>
          </Button>
        </div>
      </div>
    </div>
  </div>
</section>


<MissionSection></MissionSection>

<FeltCarousel />


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

       {/* Featured Product */}

  {/* </section> */}

        {/* Benefits Section */}
        <section className="py-20">
          <div className="container">
            <h2 className="text-3xl text-center mb-16 animate-on-scroll fade-up">Feel the difference in every piece</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="benefit-card animate-on-scroll fade-right card-hover-effect">
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl mb-2">Handcrafted Excellence</h3>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    Each piece is meticulously crafted by skilled artisans using traditional needle felting and wet felting techniques. Our dedication to craftsmanship ensures every item has its own unique character and exceptional quality.
                  </p>

                  <div className="mt-auto">
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start text-sm">
                        <span className="text-primary mr-2">•</span>
                        <span>Individual artisan attention</span>
                      </li>
                      <li className="flex items-start text-sm">
                        <span className="text-primary mr-2">•</span>
                        <span>Traditional techniques</span>
                      </li>
                      <li className="flex items-start text-sm">
                        <span className="text-primary mr-2">•</span>
                        <span>Unique character in every piece</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="benefit-card animate-on-scroll fade-left card-hover-effect" style={{ transitionDelay: '100ms' }}>
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <h3 className="text-2xl mb-2">Sustainable Materials</h3>
                  </div>

                  <p className="text-muted-foreground mb-6">
                    We use only the finest 100% natural wool sourced from farms that prioritize animal welfare and sustainable practices. Our dyes are eco-friendly and non-toxic, minimizing environmental impact.
                  </p>

                  <div className="mt-auto">
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-start text-sm">
                        <span className="text-primary mr-2">•</span>
                        <span>100% natural wool</span>
                      </li>
                      <li className="flex items-start text-sm">
                        <span className="text-primary mr-2">•</span>
                        <span>Eco-friendly dyes</span>
                      </li>
                      <li className="flex items-start text-sm">
                        <span className="text-primary mr-2">•</span>
                        <span>Ethically sourced materials</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
       
        {/* Testimonials */}
        <section className="py-20 bg-muted">
          <div className="container">
            <h2 className="text-3xl text-center mb-16 animate-on-scroll fade-up">Helping people create beautiful spaces</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((index) => (
                <div 
                  key={index}
                  className="p-6 bg-background rounded-xl animate-on-scroll fade-up card-hover-effect" 
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <p className="mb-6 italic text-muted-foreground">
                    {index === 0 && 
                      "The felt wall hanging I purchased from Felt Artistry transformed my living room. The colors are vibrant, the craftsmanship is exceptional, and it adds such a warm, artistic touch to our home."}
                    {index === 1 && 
                      "I ordered several felt animals from the Woodland Collection for my daughter's nursery. They are absolutely adorable, meticulously made, and completely child-safe. A perfect heirloom gift!"}
                    {index === 2 && 
                      "As someone who appreciates traditional crafts, I'm impressed by the attention to detail in every Felt Artistry piece. Their commitment to sustainable materials aligns perfectly with my values."}
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/10 mr-3"></div>
                    <div>
                      <p className="font-medium">
                        {index === 0 && "Sarah Miller"}
                        {index === 1 && "James Wilson"}
                        {index === 2 && "Emily Zhang"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {index === 0 && "Interior Designer"}
                        {index === 1 && "New Parent"}
                        {index === 2 && "Sustainability Advocate"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
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

        {/* Categories Section */}
        <section className="py-12 sm:py-20 bg-muted/50">
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
                    href={`/shop/${category.id}`} 
                    key={category.id}
                    className="group relative aspect-[1/1.2] rounded-lg overflow-hidden animate-fade-up w-full bg-white"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-white flex items-center justify-center p-4">
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-contain transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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