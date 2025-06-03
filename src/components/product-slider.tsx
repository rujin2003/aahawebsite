"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, ShoppingCart } from "lucide-react";
import { Product } from '@/lib/supabase'
import { supabase } from '@/lib/supabase';

interface ProductSliderProps {
  title?: string;
  products?: Product[];
  categoryId?: string;
}

export function ProductSlider({ title, products: initialProducts, categoryId }: ProductSliderProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [visibleProducts, setVisibleProducts] = useState(3);
  const [loading, setLoading] = useState(!initialProducts);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let query = supabase
          .from('products')
          .select('*')
          .limit(7);

        // If categoryId is provided, filter by category
        if (categoryId) {
          query = query.eq('category_id', categoryId);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching products:', error);
          return;
        }

        if (!data || data.length === 0) {
          console.log('No products found');
          return;
        }

        // Ensure each product has at least one image
        const productsWithImages = data.map(product => ({
          ...product,
          images: product.images && Array.isArray(product.images) && product.images.length > 0 
            ? product.images 
            : ['/placeholder.png']
        }));

        console.log('Fetched products:', productsWithImages);
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
  }, [initialProducts, categoryId]);

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
  const fallbackImage = "/placeholder.png";
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : fallbackImage;

  return (
    <div className="group relative">
      <Link href={`/shop/product/${product.id}`} className="block">
        <Card className="overflow-hidden border border-gray-200 rounded-2xl transition-all duration-300 group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] group-hover:-translate-y-1 bg-white">
          <div className="relative">
            <div className="aspect-square overflow-hidden bg-muted/50 flex items-center justify-center">
              <Image
                src={imageUrl}
                alt={product.title || "Product image"}
                width={400}
                height={400}
                //TODO: make this a square image
                className="object-cover  w-full h-full transition-transform group-hover:scale-105 duration-300"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = fallbackImage;
                }}
              />
            </div>
            {/* Add to Cart Button inside the Card */}
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90">
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-medium text-base truncate">{product.title || "Untitled Product"}</h3>
            <p className="text-lg font-semibold mt-1">${(product.price || 0).toFixed(2)}</p>
          </div>
        </Card>
      </Link>
    </div>
  );
}