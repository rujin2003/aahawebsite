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
        // First get all categories
        const { data: categories, error: categoriesError } = await supabase
          .from('categories')
          .select('id');

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          return;
        }

        // Get one random product from each category
        const productsPromises = categories.map(async (category) => {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('category_id', category.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error(`Error fetching products for category ${category.id}:`, error);
            return null;
          }

          // Group products by group_id to avoid showing same product with different colors
          const groupedProducts = data.reduce((acc: { [key: string]: Product[] }, product) => {
            const groupId = product.group_id || product.id;
            if (!acc[groupId]) {
              acc[groupId] = [];
            }
            acc[groupId].push(product);
            return acc;
          }, {});

          // Take one product from each group (preferring the first color variant)
          const uniqueProducts = Object.values(groupedProducts).map(group => group[0]);
          
          // Return a random product from the unique products
          return uniqueProducts[Math.floor(Math.random() * uniqueProducts.length)];
        });

        const productsResults = await Promise.all(productsPromises);
        const validProducts = productsResults.filter(Boolean);

        // If we have less than 7 products, fetch more random products to fill the gap
        if (validProducts.length < 7) {
          const { data: allProducts, error: additionalError } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

          if (!additionalError && allProducts) {
            // Group remaining products by group_id
            const groupedProducts = allProducts.reduce((acc: { [key: string]: Product[] }, product) => {
              const groupId = product.group_id || product.id;
              if (!acc[groupId]) {
                acc[groupId] = [];
              }
              acc[groupId].push(product);
              return acc;
            }, {});

            // Get unique products (one from each group)
            const uniqueProducts = Object.values(groupedProducts).map(group => group[0]);
            
            // Filter out products we already have
            const existingIds = new Set(validProducts.map(p => p.id));
            const additionalUniqueProducts = uniqueProducts
              .filter(p => !existingIds.has(p.id))
              .slice(0, 7 - validProducts.length);

            validProducts.push(...additionalUniqueProducts);
          }
        }

        // Ensure each product has at least one image
        const productsWithImages = validProducts.map(product => ({
          ...product,
          images: product.images && Array.isArray(product.images) && product.images.length > 0 
            ? product.images 
            : ['/placeholder.png']
        }));

        // Shuffle the products array to randomize the order
        const shuffledProducts = productsWithImages.sort(() => Math.random() - 0.5);

        setProducts(shuffledProducts);
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