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
import Image from "next/image";
import { Heart, ArrowLeft, Check, Plus, Minus } from "lucide-react";
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Product } from '@/lib/supabase';
import { toast } from 'sonner';
import { use } from 'react';


export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [colorVariants, setColorVariants] = useState<Product[]>([]);
  const fallbackImage = "/placeholder.png";

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
        setSelectedSize(data.size);
        setSelectedColor(data.color);

        // Fetch color variants
        const { data: variants, error: variantsError } = await supabase
          .from('products')
          .select('*')
          .eq('group_id', data.group_id || data.id);

        if (!variantsError && variants) {
          setColorVariants(variants);
        }

        // Fetch related products from the same category
        if (data.category_id) {
          const { data: related, error: relatedError } = await supabase
            .from('products')
            .select('*')
            .eq('category_id', data.category_id)
            .neq('id', data.id)
            .limit(4);

          if (!relatedError) {
            // Ensure each related product has at least one image
            const relatedWithImages = related.map(p => ({
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

  const handleColorChange = (variant: Product) => {
    setProduct(variant);
    setSelectedColor(variant.color);
    setActiveImage(0);
  };

  const availableSizes = product ? Object.entries(product.size_stock)
    .filter(([_, stock]) => stock > 0)
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

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col pt-20">
        <SiteHeader />
        <main className="flex-1 py-12">
          <div className="container">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
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
                <Image
                  src={product.images[activeImage] || fallbackImage}
                  alt={product.title || "Product image"}
                  width={400}
                  height={400}
                  className="object-contain transition-all duration-300"
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
                    <Image
                      src={image || fallbackImage}
                      alt={`${product.title || "Product"} view ${i+1}`}
                      width={100}
                      height={100}
                      className="object-contain w-full h-full"
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
                <p className="text-3xl font-medium text-primary">${product.price.toFixed(2)}</p>
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
                        disabled={quantity <= 1}
                        className="p-2 hover:bg-muted rounded-l-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={selectedSize ? product.size_stock[selectedSize] : 1}
                        value={quantity}
                        onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                        className="w-16 text-center border-x py-2 focus:outline-none"
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
                      stock: product.size_stock[selectedSize || ''] || 0
                    }}
                    productSize={selectedSize}
                    color={product.color}
                    quantity={quantity}
                    className="rounded-full flex-1 md:flex-none"
                    disabled={!selectedSize || availableSizes.length === 0}
                  />
                  <Button size="lg" variant="outline" className="rounded-full">
                    <Heart className="w-5 h-5" />
                    <span className="sr-only">Add to Wishlist</span>
                  </Button>
                </div>
              </div>

              <Separator className="my-8" />

              <div className="space-y-4">
                <h3 className="font-medium">Features</h3>
                <ul className="space-y-2">
                  {product.features.map((feature: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <Check className="w-5 h-5 text-primary shrink-0 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
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
