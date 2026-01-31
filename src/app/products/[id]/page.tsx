"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Product, supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Image from "next/image";
import { useCountryStore } from '@/lib/countryStore';
import { convertUSDToLocalCurrency } from '@/lib/utils';

// UUID validation function
const isValidUUID = (uuid: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
export type paramsType = Promise<{ id: string }>;

export default async function ProductPage(props: { params: paramsType }) {
  const [product, setProduct] = useState<Product | null>(null);
  const { id } = await props.params;
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const fallbackImage = "/path/to/fallback/image.jpg"; // Replace with actual fallback image path
  const [localPrice, setLocalPrice] = useState<{ amount: number; symbol: string; code: string } | null>(null);
  const countryCode = useCountryStore(s => s.countryCode);
  const isSupportedCountry = useCountryStore(s => s.isSupportedCountry);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // Validate UUID format
        if (!isValidUUID(id)) {
          toast.error("Invalid product ID format");
          router.push("/products");
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        // Ensure images array exists and has at least one image
        if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
          data.images = [fallbackImage];
        }
        
        setProduct(data);
        // Set initial selected size to first available size
        const availableSizes = Object.entries(data.size_stock as Record<string, number>)
          .filter(([_, stock]) => stock > 0)
          .map(([size]) => size);
        if (availableSizes.length > 0) {
          setSelectedSize(availableSizes[0]);
        }
        setSelectedColor(data.color);

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
      } catch (error: unknown) {
        console.error('Error fetching product:', error);
        toast.error("Failed to fetch product details");
        router.push("/products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, router]);

  // Convert price to local currency
  useEffect(() => {
    if (!product || !isSupportedCountry) return;
    
    const convertPrice = async () => {
      if (!countryCode) {
        setLocalPrice({ amount: product.price, symbol: '$', code: 'USD' });
        return;
      }
      const converted = await convertUSDToLocalCurrency(product.price, countryCode);
      setLocalPrice(converted);
    };
    
    convertPrice();
  }, [product, countryCode, isSupportedCountry]);

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

  const availableSizes = product ? Object.entries(product.size_stock as Record<string, number>)
    .filter(([_, stock]) => stock > 0)
    .map(([size]) => size) : [];

  const allSizes = product ? Object.keys(product.size_stock) : [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
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
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {product.images.map((image, index) => (
                <div key={index} className="relative w-full aspect-square">
                  <Image
                    src={image}
                    alt={`${product.title} - Image ${index + 1}`}
                    fill
                    priority={index === 0}
                    loading={index === 0 ? "eager" : "lazy"}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover rounded-lg"
                    quality={85}
                  />
                </div>
              ))}
            </div>
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold">{product.title}</h1>
                {isSupportedCountry ? (
                  <p className="text-2xl font-semibold mt-2">
                    {localPrice 
                      ? `${localPrice.symbol}${localPrice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : '...'}
                  </p>
                ) : (
                  <p className="text-lg text-muted-foreground mt-2">Contact us for pricing</p>
                )}
              </div>
              <p className="text-muted-foreground">{product.description}</p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                  />
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleOrder}
                  disabled={isOrdering}
                >
                  {isOrdering ? "Placing Order..." : "Place Order"}
                </Button>
              </div>
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Product Details</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Size:</span> {selectedSize}</p>
                  <p><span className="font-medium">Color:</span> {selectedColor}</p>
                  <div>
                    <span className="font-medium">Features:</span>
                    <ul className="list-disc list-inside">
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
} 

export const runtime = 'edge';