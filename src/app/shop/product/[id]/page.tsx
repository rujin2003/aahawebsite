"use client";

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductSlider } from "@/components/product-slider";
import AddToCartButton from '@/components/add-to-cart-button';
import Link from "next/link";
import { ImageWithSkeleton } from "@/components/ui/image-with-skeleton";
import { Heart, ArrowLeft, Check,  Plus, Minus } from "lucide-react";
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/supabase';
import { toast } from 'sonner';
import { use } from 'react';
import { Loading } from "@/components/ui/loading"
import { useCountryStore } from '@/lib/countryStore';
import { useRouter } from 'next/navigation';
import { convertUSDToLocalCurrency } from '@/lib/utils';
import { isCountrySupported } from '@/lib/validCountries';


export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const countryCode = useCountryStore(s => s.countryCode);
  const isSupportedCountry = isCountrySupported(countryCode);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [colorVariants, setColorVariants] = useState<Product[]>([]);
  const fallbackImage = "/placeholder.png";
  const router = useRouter();
  const [localPrice, setLocalPrice] = useState<{ amount: number; symbol: string; code: string } | null>(null);

  // Utility function to validate UUID
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', resolvedParams.id)
          .single();
    
        if (error) throw error;
    
        // Ensure images array exists and has at least one image
        if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
          data.images = [fallbackImage];
        }
    
        setProduct(data);
        setQuantity(data.minimum_quantity)
        
        // Get available sizes (sizes with stock > 0)
        const availableSizes = Object.entries(data.size_stock)
          .filter(([_, stock]) => (stock as number) > 0)
          .map(([size]) => size);
        
        // Auto-select size if there's only one available size
        if (availableSizes.length === 1) {
          setSelectedSize(availableSizes[0]);
        } else {
          setSelectedSize(data.size);
        }
      
        setSelectedColor(data.color);
    
        // Fetch color variants using correct array filter syntax
        const { data: variants, error: variantsError } = await supabase
          .from('products')
          .select('*')
          .eq('group_id', data.group_id || data.id)
          .limit(4);

        if (!variantsError && variants) {
          // Filter variants based on user's region
          const filteredVariants = isSupportedCountry 
            ? variants.filter(variant => 
                !variant.country_codes || 
                variant.country_codes.includes(countryCode)
              )
            : variants; // Show all variants for unsupported regions
          setColorVariants(filteredVariants);
        }

        // Fetch related products from the same category
        if (data.category_id) {
          const { data: related, error: relatedError } = await supabase
            .from('products')
            .select('*')
            .eq('category_id', data.category_id)
            .neq('id', data.id)
            .limit(4);

          if (!relatedError && related) {
            // Filter related products based on user's region
            const filteredRelated = isSupportedCountry 
              ? related.filter(rel => 
                  !rel.country_codes || 
                  rel.country_codes.includes(countryCode)
                )
              : related; // Show all related products for unsupported regions
            
            const relatedWithImages = filteredRelated.map(p => ({
              ...p,
              images: p.images && Array.isArray(p.images) && p.images.length > 0 ? p.images : [fallbackImage]
            }));
            setRelatedProducts(relatedWithImages);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    

    fetchProduct();
  }, [resolvedParams.id]);

  useEffect(() => {
    if (!product || !isSupportedCountry) return;
    let mounted = true;
    async function fetchPrice() {
      if (!countryCode) {
        setLocalPrice({ amount: product.price, symbol: '$', code: 'USD' });
        return;
      }
      const converted = await convertUSDToLocalCurrency(product.price, countryCode);
      if (mounted) setLocalPrice(converted);
    }
    fetchPrice();
    return () => { mounted = false; };
  }, [product, countryCode, isSupportedCountry]);

  const handleColorChange = (variant: Product) => {
    setProduct(variant);
    setSelectedColor(variant.color);
    setActiveImage(0);
  };

  const availableSizes = product ? Object.entries(product.size_stock)
    .filter(([_, stock]) => (stock as number) > 0)
    .map(([size]) => size) : [];

  const allSizes = product ? Object.keys(product.size_stock) : [];

  const handleQuantityChange = (newQuantity: number) => {
    if (!selectedSize || !product) return;
    
    const maxStock = product.size_stock[selectedSize] || 0;
    if (newQuantity > 0 && newQuantity <= maxStock) {
      setQuantity(newQuantity);
    } else if (newQuantity > maxStock) {
      toast.error(`Only ${maxStock} items available in stock`);
    }
  };

  const incrementQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      handleQuantityChange(quantity - 1);
    }
  };

  const handleOrder = async () => {
    setIsOrdering(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to place an order");
        router.push("/signin");
        return;
      }

      // Validate product ID
      if (!isValidUUID(product!.id)) {
        toast.error("Invalid product ID format");
        return;
      }

      // Prepare order payload
      const orderPayload = {
        user_id: user.id,
        status: 'pending',
        total_amount: product!.price * quantity,
        shipping_address: user.user_metadata.address || '',
        country_code: countryCode,
        items: [
          {
            product_id: product!.id,
            quantity: quantity,
            price: product!.price,
            product_name: product!.title,
            product_image: product!.images[0],
          }
        ]
      };
      console.log('Order Payload:', JSON.stringify(orderPayload, null, 2));

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          orderPayload
        ])
        .select()
        .single();

      if (orderError) {
        console.error('Order placement error:', orderError, 'Payload:', orderPayload);
        throw orderError;
      }

      // Redirect to checkout page with order ID
      router.push(`/checkout?orderId=${order.id}`);
    } catch (error: unknown) {
      console.error('Order placement exception:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
    } finally {
      setIsOrdering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col pt-20">
        <SiteHeader />
        <main className="flex-1 py-12">
          <div className="container">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loading className="w-12 h-12" />
                <p className="text-muted-foreground mt-4">Loading product details...</p>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    return notFound();
  }

  return (
    <div className="flex min-h-screen flex-col pt-20">
      <SiteHeader />

      <main className="flex-1 py-12">
        <div className="container">
          <div className="mb-8">
            <Link
              href="/shop"
              className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Shop
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="relative animate-fade-right">
              <div className="mb-4 aspect-square bg-muted/50 rounded-2xl overflow-hidden flex items-center justify-center p-8">
                <ImageWithSkeleton
                  src={product.images[activeImage] || fallbackImage}
                  alt={product.title || "Product image"}
                  width={400}
                  height={400}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  quality={85}
                  className="object-contain transition-all duration-300"
                  fallbackSrc={fallbackImage}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = fallbackImage;
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                {product.images.map((image: string, i: number) => (
                  <button
                    key={i}
                    className={cn(
                      "aspect-square rounded-xl overflow-hidden transition-all p-2 cursor-pointer bg-white",
                      i === activeImage
                        ? "border-2 border-primary"
                        : "border-2 border-transparent hover:border-primary/50"
                    )}
                    onClick={() => setActiveImage(i)}
                  >
                    <ImageWithSkeleton
                      src={image || fallbackImage}
                      alt={`${product.title || "Product"} view ${i+1}`}
                      width={100}
                      height={100}
                      loading="lazy"
                      sizes="100px"
                      quality={75}
                      className="object-contain w-full h-full"
                      fallbackSrc={fallbackImage}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = fallbackImage;
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8 animate-fade-left">
              <div>
                <h1 className="text-3xl font-medium mb-2">{product.title}</h1>
                {isSupportedCountry ? (
                  <p className="text-3xl font-medium text-primary">
                    {localPrice
                      ? `${localPrice.symbol}${localPrice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '...'}
                  </p>
                ) : (
                  <div className="text-lg text-destructive font-semibold">
                    We'll be bringing service to your country soon
                  </div>
                )}
              </div>

              <p className="text-muted-foreground">{product.description}</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {allSizes.map((size) => {
                      const isAvailable = product.size_stock[size] > 0;
                      return (
                        <Button
                          key={size}
                          variant={selectedSize === size ? "default" : "outline"}
                          className={cn(
                            "rounded-full",
                            !isAvailable && "opacity-40 cursor-not-allowed"
                          )}
                          onClick={() => isAvailable && setSelectedSize(size)}
                          disabled={!isAvailable}
                        >
                          {size}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {colorVariants.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {colorVariants.map((variant) => (
                        <Button
                          key={variant.id}
                          variant={selectedColor === variant.color ? "default" : "outline"}
                          className="rounded-full"
                          onClick={() => handleColorChange(variant)}
                        >
                          {variant.color}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border rounded-full">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= product.minimum_quantity}
                        className="p-2 hover:bg-muted rounded-l-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min={product.minimum_quantity || 1}
                        max={selectedSize ? product.size_stock[selectedSize] : 1}
                        value={quantity ?? 1}
                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                        className="no-spinner w-16 text-center border-x py-2 focus:outline-none"
                      />
                      <button
                        onClick={incrementQuantity}
                        disabled={!selectedSize || quantity >= (product.size_stock[selectedSize] || 0)}
                        className="p-2 hover:bg-muted rounded-r-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <AddToCartButton
                    product={{
                      id: product.id,
                      name: product.title,
                      price: product.price,
                      image: product.images[0],
                      stock: product.size_stock[selectedSize || ''] || 0,
                      minQuantity: product.minimum_quantity
                    }}
                    productSize={selectedSize}
                    color={product.color}
                    quantity={quantity}
                    className="rounded-full flex-1 md:flex-none"
                    disabled={!selectedSize || availableSizes.length === 0 || !isSupportedCountry}
                  />
                  <Button size="lg" variant="outline" className="rounded-full" disabled={!isSupportedCountry}>
                    <Heart className="w-5 h-5" />
                    <span className="sr-only">Add to Wishlist</span>
                  </Button>
                </div>
              </div>

              <Separator className="my-8" />

              <div className="space-y-4">
                <h3 className="font-medium">Features</h3>
                {isSupportedCountry ? (
                  <ul className="space-y-2">
                    {product.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-5 h-5 text-primary shrink-0 mr-2" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl mb-8 text-center">You may also like</h2>
              <ProductSlider 
                products={relatedProducts}
                categoryId={product.category_id}
              />
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
export const runtime = 'edge';
