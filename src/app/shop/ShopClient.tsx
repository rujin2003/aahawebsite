'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product, Category, supabase } from '@/lib/supabase'
import Link from "next/link";
import Image from "next/image";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { Heart } from 'lucide-react'
import { Loading } from "@/components/ui/loading"

import { getCategoriesQuery, getProductsQuery, isAvailableInCountry } from '@/lib/country';
import { useCountryStore } from '@/lib/countryStore';
import { convertUSDToLocalCurrency } from '@/lib/utils';

export default function ShopClient() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceSort, setPriceSort] = useState<'featured' | 'low' | 'high'>('featured')
  const [shipsToMeOnly, setShipsToMeOnly] = useState(false)
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

  let filteredGroupedProducts = selectedCategory === 'all'
    ? groupedProducts
    : Object.fromEntries(
      Object.entries(groupedProducts).filter(([_, products]) =>
        products[0].category_id === selectedCategory
      )
    )

  // optional shipping filter — the catalog itself always shows everything,
  // this just narrows to pieces that ship to the visitor's country
  if (shipsToMeOnly && countryCode) {
    filteredGroupedProducts = Object.fromEntries(
      Object.entries(filteredGroupedProducts).filter(([_, products]) =>
        products.some((p) => isAvailableInCountry(p.country_codes ?? null, countryCode))
      )
    )
  }

  // Default: groups with the most total stock first; otherwise sort by price
  const sortedGroupedEntries = Object.entries(filteredGroupedProducts).sort(([, aProducts], [, bProducts]) => {
    if (priceSort !== 'featured') {
      const minPrice = (products: Product[]) => Math.min(...products.map((p) => Number(p.price) || 0))
      return priceSort === 'low'
        ? minPrice(aProducts) - minPrice(bProducts)
        : minPrice(bProducts) - minPrice(aProducts)
    }

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

  // Group counts per category for the selector chips
  const categoryCounts: Record<string, number> = {};
  Object.values(groupedProducts).forEach((group) => {
    const catId = group[0].category_id;
    if (catId) categoryCounts[catId] = (categoryCounts[catId] || 0) + 1;
  });
  const totalGroups = Object.keys(groupedProducts).length;

  return (
    <div className="flex min-h-screen flex-col pt-20">
      <SiteHeader />

      <main className="flex-1 py-8">
        <div className="container">
          {/* Collection Heading — pink daisies tucked behind the title */}
          <div className="mb-10">
            <p className="relative z-10 text-[11px] uppercase tracking-[0.3em] text-primary font-medium mb-3">
              Hand-felted in Nepal
            </p>
            <div className="relative inline-block">
              <Image
                src="/flowers/daisy-pink.png"
                alt=""
                width={96}
                height={121}
                priority
                className="absolute -top-4 -left-1 md:-top-7 md:-left-7 w-10 md:w-16 h-auto -rotate-[8deg] -z-10 pointer-events-none animate-float"
                style={{ animationDuration: "9s" }}
              />
              <Image
                src="/flowers/daisy-pink.png"
                alt=""
                width={96}
                height={121}
                priority
                className="absolute top-6 left-0 md:top-10 md:-left-6 w-6 md:w-9 h-auto rotate-[130deg] -z-10 pointer-events-none"
              />
              <h1 className="relative font-playfair text-4xl md:text-5xl lg:text-6xl font-light tracking-tight text-foreground">
                Our Collection
              </h1>
            </div>
            <p className="mt-3 text-sm md:text-base text-muted-foreground max-w-md">
              Wool blooms, ornaments and slippers — every piece needled by hand, one at a time.
            </p>
            <div className="mt-4 w-16 h-px bg-primary/40"></div>
          </div>

          <Tabs
            defaultValue="all"
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="mb-12"
          >
            <div className="mb-8">
              {/* the strip scrolls sideways rather than wrapping, so it bleeds
                  past the container padding on small screens — a pill cut off
                  at the screen edge reads as "there's more", one cut off at an
                  arbitrary inset just looks broken */}
              <div className="-mx-4 px-4 md:mx-0 md:px-0 flex justify-start overflow-x-auto scroll-pl-4 scrollbar-hide py-1">
              <TabsList className="bg-transparent p-0 h-auto flex gap-2 min-w-max md:flex-wrap">
                <TabsTrigger
                  value="all"
                  className="group rounded-full whitespace-nowrap px-4 py-2 text-[13px] sm:px-5 sm:py-2.5 sm:text-sm bg-white border border-gray-200 text-muted-foreground shadow-none transition-all hover:border-primary/40 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:border-primary data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-primary/20"
                >
                  All Products
                  <span className="ml-1.5 sm:ml-2 rounded-full bg-foreground/[0.06] px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] tabular-nums transition-colors group-data-[state=active]:bg-white/20">
                    {totalGroups}
                  </span>
                </TabsTrigger>
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="group rounded-full whitespace-nowrap px-4 py-2 text-[13px] sm:px-5 sm:py-2.5 sm:text-sm bg-white border border-gray-200 text-muted-foreground shadow-none transition-all hover:border-primary/40 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:border-primary data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-primary/20"
                  >
                    {category.name}
                    <span className="ml-1.5 sm:ml-2 rounded-full bg-foreground/[0.06] px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] tabular-nums transition-colors group-data-[state=active]:bg-white/20">
                      {categoryCounts[category.id] || 0}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
              </div>

              {/* Price sort + shipping filter — the catalog always shows
                  everything; these only reorder or narrow the view */}
              <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                <label className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-semibold text-foreground/50">Price</span>
                  <select
                    value={priceSort}
                    onChange={(e) => setPriceSort(e.target.value as 'featured' | 'low' | 'high')}
                    className="min-w-0 rounded-full border border-gray-200 bg-white px-3 py-2 text-[13px] sm:px-4 sm:text-sm text-foreground shadow-none outline-none transition-colors hover:border-primary/40 focus:border-primary"
                  >
                    <option value="featured">Featured</option>
                    <option value="low">Low to high</option>
                    <option value="high">High to low</option>
                  </select>
                </label>

                {countryCode && (
                  <button
                    type="button"
                    onClick={() => setShipsToMeOnly((v) => !v)}
                    className={`whitespace-nowrap rounded-full border px-3 py-2 text-[13px] sm:px-4 sm:text-sm transition-all ${
                      shipsToMeOnly
                        ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                        : 'border-gray-200 bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    Ships to {countryCode}
                  </button>
                )}
              </div>
            </div>

            {/* Products Grid */}
            {totalProducts === 0 ? (
              <div className="text-center py-16">
                <Image
                  src="/flowers/daisies.png"
                  alt=""
                  width={512}
                  height={410}
                  className="w-32 h-auto mx-auto mb-6 opacity-80"
                />
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

          {/* Closing note — a loose scatter of felt flowers */}
          <div className="mt-16 mb-4 flex flex-col items-center text-center">
            <div className="relative w-full h-28 pointer-events-none" aria-hidden>
              <Image
                src="/flowers/flower-purple-head.png"
                alt=""
                width={130}
                height={125}
                className="absolute left-0 bottom-1 w-16 -rotate-12"
              />
              <Image
                src="/flowers/flower-white-head.png"
                alt=""
                width={99}
                height={128}
                className="absolute left-16 top-0 w-12 rotate-6"
              />
              <Image
                src="/flowers/flower-blue-head.png"
                alt=""
                width={92}
                height={133}
                className="absolute left-36 bottom-4 w-14 rotate-[18deg]"
              />
              <Image
                src="/flowers/flower-yellow-head.png"
                alt=""
                width={131}
                height={113}
                className="absolute left-56 top-5 w-16 -rotate-6"
              />
            </div>
            <p className="mt-5 font-playfair text-lg md:text-xl text-foreground/70 italic max-w-sm">
              Every piece begins as raw wool, shaped entirely by hand.
            </p>
            <div className="mt-4 w-10 h-px bg-primary/40"></div>
          </div>
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
      <Card className="h-full flex flex-col overflow-hidden border-0 rounded-2xl bg-white ring-1 ring-gray-100 sm:transition-all sm:duration-500 sm:group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:group-hover:-translate-y-2 sm:group-hover:ring-primary/20">
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
            <div className="aspect-square overflow-hidden bg-gray-50 rounded-xl relative">
              <ImageWithSkeleton
                src={selectedVariant.images?.[0] || '/placeholder.png'}
                alt={selectedVariant.title}
                fill
                draggable={false}
                priority={isPriority}
                loading={isPriority ? "eager" : "lazy"}
                fallbackSrc="/placeholder.png"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain p-5 sm:transition-transform sm:duration-500 sm:group-hover:scale-105"
              />

              {/* Subtle overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>

              {/* View Details — slides up over the image on hover, always visible on mobile */}
              <div className="absolute inset-x-3 bottom-3 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-2 sm:group-hover:translate-y-0 sm:transition-all sm:duration-300">
                <div className="w-full rounded-full bg-white/90 backdrop-blur-sm border border-black/[0.06] py-2 text-center text-xs font-medium text-foreground shadow-sm hover:bg-primary hover:text-white transition-colors">
                  View Details
                </div>
              </div>
            </div>
          </div>

          <CardContent className="p-4 pt-1 flex flex-col gap-3 flex-grow">
            <div className="space-y-1">
              <h3 className="font-medium text-base leading-snug line-clamp-2 min-h-[2.75rem] group-hover:text-primary transition-colors">
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

            {/* Color Variants — container keeps its height even without variants so cards stay aligned */}
            <div className="mt-auto min-h-[2.75rem]">
              {colorVariants.length > 1 && (
                <div className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.15em] font-semibold text-foreground/50">Available Colors</p>
                  <div className="flex gap-2 items-center pl-0.5 pt-0.5">
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

          </CardContent>
        </Link>
      </Card>
    </div>
  )
}
