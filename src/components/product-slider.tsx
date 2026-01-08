"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus, Heart } from "lucide-react";
import { Product } from '@/lib/supabase'
import { supabase } from '@/lib/supabase';
import { useCart } from '@/components/cart-provider';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCountryStore } from "@/lib/countryStore";
import { getCategoriesQuery, getProductsQuery } from '@/lib/country';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

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
  const { addItem } = useCart();
  const isSupportedCountry = useCountryStore(s=>s.isSupportedCountry)

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
      if (window.innerWidth < 640) {
        setVisibleProducts(2);
      } else if (window.innerWidth < 768) {
        setVisibleProducts(2);
      } else if (window.innerWidth < 1024) {
        setVisibleProducts(3);
      } else {
        setVisibleProducts(4);
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
    if (!isSupportedCountry) {
      toast.error('Shopping is not available in your country');
      return;
    }
    
    // Get the total stock from size_stock or use a default
    const totalStock = Object.values(product.size_stock || {}).reduce((sum, stock) => sum + stock, 0) || 999;
    
    // Convert Product to the format expected by addItem
    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.images[0],
      size: 'One Size', // Default size for products without size variants
      stock: totalStock,
      minQuantity: product.minimum_quantity || 1
    }, 1);
  };

  if (loading) {
    return (
      <div className="relative w-full py-6">
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full py-4">
      {title && <h3 className="text-2xl font-playfair mb-8 text-center">{title}</h3>}
      
      {/* Slider Container */}
      <div className="relative group/slider">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          disabled={activeIndex === 0}
          className={cn(
            "absolute -left-3 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full hidden sm:flex items-center justify-center",
            "bg-white/90 backdrop-blur-sm border border-border/50",
            "hover:bg-primary hover:text-white hover:border-primary transition-all duration-200",
            "opacity-0 group-hover/slider:opacity-100",
            "disabled:opacity-0 disabled:cursor-not-allowed"
          )}
          aria-label="Previous products"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Products */}
        <div ref={sliderRef} className="overflow-hidden w-full">
          <div
            className="flex gap-3 md:gap-4 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${activeIndex * (100 / visibleProducts)}%)` }}
          >
            {products.map((product) => (
              <div 
                key={product.id} 
                className="shrink-0" 
                style={{ width: `calc(${100 / visibleProducts}% - ${(visibleProducts - 1) * 12 / visibleProducts}px)` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          disabled={activeIndex === maxIndex}
          className={cn(
            "absolute -right-3 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full hidden sm:flex items-center justify-center",
            "bg-white/90 backdrop-blur-sm border border-border/50",
            "hover:bg-primary hover:text-white hover:border-primary transition-all duration-200",
            "opacity-0 group-hover/slider:opacity-100",
            "disabled:opacity-0 disabled:cursor-not-allowed"
          )}
          aria-label="Next products"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Minimal dots indicator */}
      {maxIndex > 0 && (
        <div className="flex justify-center gap-1 sm:gap-1.5 mt-4 sm:mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isAnimating) {
                  setIsAnimating(true);
                  setActiveIndex(index);
                  setTimeout(() => setIsAnimating(false), 500);
                }
              }}
              className={cn(
                "w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-300",
                activeIndex === index ? "bg-primary w-3 sm:w-4" : "bg-border/60 hover:bg-primary/30"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const fallbackImage = "/placeholder.png";
  const imageUrl = product.images?.[0] || fallbackImage;
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const isSupportedCountry = useCountryStore(s => s.isSupportedCountry);
  const inWishlist = isInWishlist(product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isSupportedCountry) {
      toast.error('Shopping is not available in your country');
      return;
    }
    
    const totalStock = Object.values(product.size_stock || {}).reduce((sum, stock) => sum + stock, 0) || 999;
    
    addItem({
      id: product.id,
      name: product.title,
      price: product.price,
      image: product.images[0],
      size: 'One Size',
      stock: totalStock,
      minQuantity: product.minimum_quantity || 1
    }, 1);
    
    toast.success('Added to cart!');
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images[0] || fallbackImage,
      });
    }
  };

  return (
    <Link 
      href={`/shop/product/${product.id}`}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary/20 mb-3">
        <Image
          src={imageUrl}
          alt={product.title || "Product image"}
          draggable={false}
          fill
          className={cn(
            "object-cover transition-transform duration-500 ease-out",
            isHovered ? "scale-105" : "scale-100"
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          quality={75}
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = fallbackImage;
          }}
        />
        
        {/* Wishlist Button - Always visible on mobile, hover on desktop */}
        <button
          onClick={handleWishlistToggle}
          className={cn(
            "absolute top-2 right-2 w-7 h-7 rounded-full",
            "bg-white/80 backdrop-blur-sm",
            "flex items-center justify-center",
            "transition-all duration-200",
            "sm:opacity-0 sm:group-hover:opacity-100",
            isHovered ? "opacity-100" : ""
          )}
        >
          <Heart 
            className={cn(
              "w-3.5 h-3.5 transition-colors duration-200",
              inWishlist 
                ? "fill-primary text-primary" 
                : "text-foreground/60 hover:text-primary"
            )}
          />
        </button>

        {/* Quick Add Button */}
        {isSupportedCountry && (
          <button
            onClick={handleQuickAdd}
            className={cn(
              "absolute bottom-2 right-2 w-7 h-7 rounded-full",
              "bg-white/90 backdrop-blur-sm",
              "flex items-center justify-center",
              "hover:bg-primary hover:text-white transition-all duration-200",
              "sm:opacity-0 sm:group-hover:opacity-100",
              isHovered ? "opacity-100" : ""
            )}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      
      {/* Product Info - Minimal */}
      <div className="space-y-0.5">
        <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">
          {product.title || "Untitled Product"}
        </h3>
        
        {isSupportedCountry ? (
          <p className="text-sm text-foreground/70">
            ${Number(product.price).toFixed(2)}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Contact for pricing</p>
        )}
      </div>
    </Link>
  );
}