"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, ShoppingCart } from "lucide-react";
import { Product } from '@/lib/supabase'
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/CartContext';
import { useUserCountry } from '@/lib/useCountry';
import { getCategoriesQuery, getProductsQuery } from '@/lib/country';
import { toast } from 'sonner';

interface ProductSliderProps {
  title?: string;
  products?: Product[];
  categoryId?: string;
  countryCode?: string;
}

export function ProductSlider({ title, products: initialProducts, categoryId, countryCode }: ProductSliderProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [visibleProducts, setVisibleProducts] = useState(3);
  const [loading, setLoading] = useState(!initialProducts);
  const { addItem, isCartEnabled } = useCart();
  const { isSupportedCountry } = useUserCountry();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Get products using getProductsQuery
        const { data: productsData, error: productsError } = await getProductsQuery(supabase, countryCode || '');
     console.log(products)
        if (productsError) {
          console.error('Error fetching products:', productsError);
          return;
          
        }

        if (!Array.isArray(productsData)) {
          console.error('Unexpected products data format:', productsData);
          return;
        }

        // Group products by group_id to avoid showing same product with different colors
        const groupedProducts = productsData.reduce((acc: { [key: string]: Product[] }, product) => {
          const groupId = product.group_id || product.id;
          if (!acc[groupId]) {
            acc[groupId] = [];
          }
          acc[groupId].push(product);
          return acc;
        }, {});

        // Take one product from each group (preferring the first color variant)
        const uniqueProducts = Object.values(groupedProducts).map(group => group[0]);
        
        // Shuffle the products array to randomize the order
        const shuffledProducts = uniqueProducts.sort(() => Math.random() - 0.5);

        // Ensure each product has at least one image
        const productsWithImages = shuffledProducts.map(product => ({
          ...product,
          images: product.images && Array.isArray(product.images) && product.images.length > 0 
            ? product.images 
            : ['/placeholder.png']
        }));

        setProducts(productsWithImages);
      } catch (error) {
        console.error('Error in fetchProducts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!initialProducts) {
      fetchProducts();
    }
  }, [initialProducts, countryCode]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleProducts(1);
      } else if (window.innerWidth < 1024) {
        setVisibleProducts(2);
      } else {
        setVisibleProducts(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, products.length - visibleProducts);

  const handlePrev = () => {
    if (activeIndex > 0 && !isAnimating) {
      setIsAnimating(true);
      setActiveIndex(activeIndex - 1);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleNext = () => {
    if (activeIndex < maxIndex && !isAnimating) {
      setIsAnimating(true);
      setActiveIndex(activeIndex + 1);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!isCartEnabled) {
      toast.error('Shopping is not available in your country');
      return;
    }
    addItem(product, 1);
  };

  if (loading) {
    return (
      <div className="relative w-full py-8">
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full py-8">
      {title && <h3 className="text-2xl font-saans mb-8 text-center">{title}</h3>}
      
      {/* Slider Container */}
      <div className="relative flex items-center">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className="absolute left-0 z-10 bg-white shadow-lg p-2 rounded-full hidden md:flex"
          disabled={activeIndex === 0}
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>

        {/* Products */}
        <div ref={sliderRef} className="overflow-hidden w-full">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${activeIndex * (100 / visibleProducts)}%)` }}
          >
            {products.map((product) => (
              <div key={product.id} className="w-full px-3" style={{ flex: `0 0 ${100 / visibleProducts}%` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-0 z-10 bg-white shadow-lg p-2 rounded-full hidden md:flex"
          disabled={activeIndex === maxIndex}
        >
          <ArrowRight className="w-6 h-6 text-gray-700" />
        </button>
      </div>
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem, isCartEnabled } = useCart();
  const { isSupportedCountry } = useUserCountry();
  const fallbackImage = "/placeholder.png";
  const imageUrl = product.images?.[0] || fallbackImage;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isCartEnabled) {
      toast.error('Shopping is not available in your country');
      return;
    }
    addItem(product, 1);
  };

  return (
    <Card className="group relative overflow-hidden">
      <Link href={`/shop/product/${product.id}`}>
        <div className="relative">
          <div className="aspect-square overflow-hidden bg-white flex items-center justify-center">
            <Image
              src={imageUrl}
              alt={product.title || "Product image"}
              width={400}
              height={400}
              className="object-contain w-full h-full transition-transform group-hover:scale-105 duration-300 bg-white"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = fallbackImage;
              }}
            />
          </div>
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {isSupportedCountry ? (
              <Button
                onClick={handleAddToCart}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90"
              >
                <ShoppingCart className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  toast.error('Shopping is not available in your country');
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90"
              >
                <ShoppingCart className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-base truncate">{product.title || "Untitled Product"}</h3>
        </div>
      </Link>
    </Card>
  );
}