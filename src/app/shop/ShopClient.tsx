'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product, Category, supabase } from '@/lib/supabase'
import Link from "next/link";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { Heart } from 'lucide-react'
import { Loading } from "@/components/ui/loading"

import { getCategoriesQuery, getProductsQuery } from '@/lib/country';
import { useCountryStore } from '@/lib/countryStore';
import { convertUSDToLocalCurrency } from '@/lib/utils';

export default function ShopClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [groupedProducts, setGroupedProducts] = useState<{ [key: string]: Product[] }>({})
  const countryCode = useCountryStore(s => s.countryCode);
  const getCountry = useCountryStore(s => s.getCountry);
  const searchParams = useSearchParams();

  // Read category from URL on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    getCountry();
  }, [getCountry]);

  useEffect(() => {
    const fetchData = async () => {
      if (!countryCode) return;
      try {
        // Fetch products using getProductsQuery
        const { data: productsData, error: productsError } = await getProductsQuery(supabase, countryCode || '')

        if (productsError) {
          console.error('Products API error:', productsError)
          setProducts([])
          setGroupedProducts({})
        } else if (Array.isArray(productsData)) {
          setProducts(productsData)

          // Group products by group_id
          const grouped = productsData.reduce((acc: { [key: string]: Product[] }, product) => {
            const groupId = product.group_id || product.id
            if (!acc[groupId]) {
              acc[groupId] = []
            }
            acc[groupId].push(product)
            return acc
          }, {})
          setGroupedProducts(grouped)
        } else {
          console.error('Products data format error:', productsData)
          setProducts([])
          setGroupedProducts({})
        }

        // Fetch categories from Supabase
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
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [countryCode])

  const filteredGroupedProducts = selectedCategory === 'all'
    ? groupedProducts
    : Object.fromEntries(
      Object.entries(groupedProducts).filter(([_, products]) =>
        products[0].category_id === selectedCategory
      )
    )

  // Sort groups by total stock (sum of size_stock across all variants) in descending order
  const sortedGroupedEntries = Object.entries(filteredGroupedProducts).sort(([, aProducts], [, bProducts]) => {
    const sumStock = (products: Product[]) =>
      products.reduce((groupTotal, product) => {
        const sizeStock = product.size_stock || {}
        const productTotal = Object.values(sizeStock).reduce((sum, qty) => sum + (typeof qty === 'number' ? qty : 0), 0)
        return groupTotal + productTotal
      }, 0)

    const aTotal = sumStock(aProducts)
    const bTotal = sumStock(bProducts)
    return bTotal - aTotal
  })

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col pt-20">
        <SiteHeader />
        <main className="flex-1 py-12">
          <div className="container">
            <div className="flex items-center justify-center h-96">
              <div className="text-center space-y-4">
                <Loading className="w-12 h-12 mx-auto" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Loading products...</p>
                  <p className="text-sm text-muted-foreground">Please wait while we prepare our collection for you</p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  const totalProducts = Object.keys(filteredGroupedProducts).length;

  return (
    <div className="flex min-h-screen flex-col pt-20">
      <SiteHeader />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Hero Section */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-50 via-white to-primary/5 py-20 px-6 md:px-10 mb-12 border border-blue-100/50">
            <div className="absolute inset-0 z-0 opacity-40">
              <div className="absolute top-[-20%] left-[-5%] w-[40%] h-[40%] rounded-full bg-gradient-to-r from-blue-200 to-blue-300 blur-[100px]"></div>
              <div className="absolute bottom-[-15%] right-[-5%] w-[35%] h-[35%] rounded-full bg-gradient-to-r from-primary/20 to-primary/30 blur-[80px]"></div>
            </div>
            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-medium mb-6 animate-fade-up bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Handcrafted with Love
              </h1>
              <p className="text-lg text-muted-foreground animate-fade-up animate-delay-200 max-w-2xl mx-auto leading-relaxed">
                Discover our exclusive collection of handcrafted felt products. Each piece tells a story of traditional craftsmanship, 
                made with passion by skilled artisans using time-honored techniques.
              </p>
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground animate-fade-up animate-delay-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Premium Quality</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Eco-Friendly</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Artisan Made</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Filter & Product Count */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-saans font-medium">Our Collection</h2>
              <span className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground">
                {totalProducts} {totalProducts === 1 ? 'product' : 'products'}
              </span>
            </div>
          </div>

          <Tabs
            defaultValue="all"
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="mb-12"
          >
            <div className="flex justify-start mb-8 overflow-x-auto scroll-pl-4 scrollbar-hide">
              <TabsList className="bg-white border border-gray-200 p-1.5 rounded-2xl flex gap-1 min-w-max shadow-sm">
                <TabsTrigger 
                  value="all" 
                  className="rounded-xl whitespace-nowrap px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                >
                  All Products
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="rounded-xl whitespace-nowrap px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
                  >
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Products Grid */}
            {totalProducts === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Heart className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't find any products in this category. Try selecting a different category or check back later.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sortedGroupedEntries.map(([groupId, products], index) => (
                  <ProductCard
                    key={groupId}
                    product={products[0]}
                    colorVariants={products}
                    isPriority={index < 4}
                  />
                ))}
              </div>
            )}
          </Tabs>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ProductCard({ product, colorVariants, isPriority = false }: { product: Product, colorVariants: Product[], isPriority?: boolean }) {
  const [selectedVariant, setSelectedVariant] = useState(product)
  const [isLiked, setIsLiked] = useState(false)
  const isSupportedCountry = useCountryStore(s => s.isSupportedCountry);
  const countryCode = useCountryStore(s => s.countryCode);
  const [localPrice, setLocalPrice] = useState<{ amount: number; symbol: string; code: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchPrice() {
      if (!countryCode) {
        setLocalPrice({ amount: selectedVariant.price, symbol: '$', code: 'USD' });
        return;
      }
      const converted = await convertUSDToLocalCurrency(selectedVariant.price, countryCode);
      if (mounted) setLocalPrice(converted);
    }
    fetchPrice();
    return () => { mounted = false; };
  }, [selectedVariant, countryCode]);

  // Helper function to check if a color is light
  const isLightColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      'white': '#ffffff',
      'light': '#f5f5f5',
      'cream': '#f5f5dc',
      'beige': '#f5f5dc',
      'ivory': '#fffff0',
      'snow': '#fffafa',
      'ghostwhite': '#f8f8ff',
      'whitesmoke': '#f5f5f5',
      'linen': '#faf0e6',
      'antiquewhite': '#faebd7',
      'papayawhip': '#ffefd5',
      'blanchedalmond': '#ffebcd',
      'bisque': '#ffe4c4',
      'peachpuff': '#ffdab9',
      'navajowhite': '#ffdead',
      'moccasin': '#ffe4b5',
      'cornsilk': '#fff8dc',
      'oldlace': '#fdf5e6',
      'floralwhite': '#fffaf0',
      'seashell': '#fff5ee',
      'lavenderblush': '#fff0f5',
      'mistyrose': '#ffe4e1'
    };

    const normalizedColor = color.toLowerCase().trim();
    const hexColor = colorMap[normalizedColor] || color;

    if (hexColor.startsWith('#')) {
      const hex = hexColor.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 200;
    }

    const lightColors = ['white', 'light', 'cream', 'beige', 'ivory', 'snow', 'ghostwhite', 'whitesmoke', 'linen', 'yellow', 'lightyellow', 'lightgray', 'lightgrey', 'silver'];
    return lightColors.some(lightColor => normalizedColor.includes(lightColor));
  };

  return (
    <div className="group relative">
      <Card className="h-full flex flex-col overflow-hidden border-0 rounded-2xl transition-all duration-500 group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] group-hover:-translate-y-2 bg-white ring-1 ring-gray-100 group-hover:ring-primary/20">
        <Link href={`/shop/product/${selectedVariant.id}`} className="flex flex-col h-full">
          <div className="relative p-4">
            {/* Wishlist Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsLiked(!isLiked);
              }}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-white/20 transition-all opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110"
            >
              <Heart 
                className={`w-4 h-4 transition-colors ${
                  isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'
                }`} 
              />
            </button>

            {/* Product Image */}
            <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded-xl relative">
              <ImageWithSkeleton
                src={selectedVariant.images?.[0] || '/placeholder.png'}
                alt={selectedVariant.title}
                width={280}
                height={210}
                draggable={false}
                priority={isPriority}
                loading={isPriority ? "eager" : "lazy"}
                fallbackSrc="/placeholder.png"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain w-full h-full transition-all duration-500 group-hover:scale-110 rounded-xl"
              />
              
              {/* Subtle overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
            </div>
          </div>

          <CardContent className="p-4 pt-0 flex flex-col gap-4 flex-grow">
            <div className="space-y-1">
              <h3 className="font-medium text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                {selectedVariant.title}
              </h3>
              {/* Price Display */}
              <div className="text-lg font-semibold text-primary mt-1">
                {isSupportedCountry ? (
                  localPrice
                    ? `${localPrice.symbol}${localPrice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '...'
                ) : (
                  <span></span>
                )}
              </div>
            </div>

            {/* Color Variants */}
            <div className="mt-auto">
              {colorVariants.length > 1 && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground font-medium">Available Colors</p>
                  <div className="flex gap-2 items-center">
                    {colorVariants.slice(0, 6).map((variant) => {
                      const isLight = isLightColor(variant.color);
                      
                      return (
                        <button
                          key={variant.id}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedVariant(variant);
                          }}
                          className={`w-5 h-5 rounded-full transition-all relative flex-shrink-0 ${
                            selectedVariant.id === variant.id
                              ? 'scale-110 ring-2 ring-primary ring-offset-2'
                              : 'hover:scale-105 hover:ring-2 hover:ring-gray-300 hover:ring-offset-1'
                          }`}
                          title={variant.color}
                        >
                          <div
                            className={`w-full h-full rounded-full ${
                              isLight 
                                ? 'border-2 border-gray-200 shadow-sm' 
                                : 'border border-white/20 shadow-sm'
                            }`}
                            style={{ backgroundColor: variant.color }}
                          />
                          {selectedVariant.id === variant.id && (
                            <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                    {colorVariants.length > 6 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        +{colorVariants.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* View Product Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 border-primary/20 hover:bg-primary hover:text-white"
            >
              View Details
            </Button>
          </CardContent>
        </Link>
      </Card>
    </div>
  )
}
