"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/components/cart-provider";
import { Minus, Plus, Trash2, CreditCard, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: ''
  });
  const router = useRouter();

  const handleQuantityChange = (id: string, delta: number, currentQty: number) => {
    const newQty = Math.max(1, currentQty + delta);
    updateQuantity(id, newQty);
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate shipping address
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.country || !shippingAddress.zipCode) {
      toast.error("Please fill in all shipping address fields");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in to place an order");
        router.push("/signin");
        return;
      }

      // First, get the actual product IDs from the database
      const productIds = items.map(item => item.id);
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, title, price, images')
        .in('id', productIds);

      if (productsError) throw productsError;

      // Format shipping address
      const formattedAddress = `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.country}, ${shippingAddress.zipCode}`;

      // Prepare order payload
      const orderPayload = {
        user_id: user.id,
        status: 'to_be_verified',
        total_amount: totalPrice,
        shipping_address: formattedAddress,
        items: items.map(item => {
          const product = products.find(p => p.id === item.id);
          if (!product) {
            throw new Error(`Product with ID ${item.id} not found`);
          }
          return {
            product_id: product.id,
            quantity: item.quantity,
            price: item.price,
            product_name: item.name,
            product_image: item.image,
            size: item.size
          };
        })
      };

      // Log the data for debugging
      console.log('Cart Items:', JSON.stringify(items, null, 2));
      console.log('Products from DB:', JSON.stringify(products, null, 2));

      // Add detailed logging before placing the order
      console.log('=== Order Details ===');
      console.log('User ID:', user.id);
      console.log('Total Amount:', totalPrice);
      console.log('Shipping Address:', formattedAddress);
      console.log('Order Items:', JSON.stringify(orderPayload.items, null, 2));
      console.log('Full Order Payload:', JSON.stringify(orderPayload, null, 2));
      console.log('===================');

      // Create order with verification required status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([
          orderPayload
        ])
        .select()
        .single();

      if (orderError) {
        console.log('Order Payload:', JSON.stringify(productIds));
        console.error('Order placement error:', orderError, 'Payload:', orderPayload);
        throw orderError;
      }

      // Clear cart after successful order creation
      clearCart();
      setLoading(false);
      setOrderCompleted(true);
      toast.success("Order placed successfully! Your order will be verified shortly.");
    } catch (error: unknown) {
      console.error('Order placement exception:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to place order');
      setLoading(false);
    }
  };

  if (orderCompleted) {
    return (
      <div className="flex min-h-screen flex-col pt-20">
        <SiteHeader />

        <main className="flex-1 py-12">
          <div className="container max-w-4xl">
            <div className="bg-gradient-to-r from-blue-500/20 to-primary/10 rounded-3xl p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[60px]"></div>
                <div className="absolute bottom-[-10%] right-[5%] w-[30%] h-[30%] rounded-full bg-primary/20 blur-[50px]"></div>
              </div>

              <div className="relative z-10 animate-fade-up">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag className="w-10 h-10 text-primary" />
                </div>

                <h1 className="text-3xl font-medium mb-4">Order Confirmed!</h1>
                <p className="text-foreground/80 mb-8 max-w-md mx-auto">
                  Thank you for your purchase. Your order has been confirmed and will be shipped soon.
                </p>

                <div className="flex justify-center gap-4">
                  <Button className="rounded-full" asChild>
                    <Link href="/">
                      Back to Home
                    </Link>
                  </Button>
                  <Button variant="outline" className="rounded-full" asChild>
                    <Link href="/shop">
                      Continue Shopping
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pt-20">
      <SiteHeader />

      <main className="flex-1 py-12">
        <div className="container max-w-6xl">
          <h1 className="text-3xl font-medium mb-8">Your Cart</h1>

          {items.length === 0 ? (
            <div className="bg-muted rounded-3xl p-12 text-center">
              <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
              <p className="text-muted-foreground mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
              <Button className="rounded-full" asChild>
                <Link href="/shop">
                  Browse Products
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="bg-card rounded-3xl shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-border">
                    <h2 className="font-medium">Cart Items ({items.reduce((sum, item) => sum + item.quantity, 0)})</h2>
                  </div>

                  <div className="divide-y divide-border">
                    {items.map((item) => (
                      <div
                        key={`${item.id}-${item.size || ""}-${item.color || ""}`}
                        className="p-6 flex flex-col sm:flex-row items-start gap-4 group animate-fade-up"
                      >
                        <div className="w-24 h-24 bg-muted/50 rounded-xl overflow-hidden flex items-center justify-center p-3">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={80}
                            height={80}
                            className="object-contain"
                          />
                        </div>

                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>

                          {(item.size || item.color) && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.size && `Size: ${item.size}`}
                              {item.size && item.color && " | "}
                              {item.color && `Color: ${item.color}`}
                            </p>
                          )}

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center border border-border rounded-full">
                              <button
                                onClick={() => handleQuantityChange(item.id, -1, item.quantity)}
                                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(item.id, 1, item.quantity)}
                                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-destructive hover:text-destructive/70 transition-colors"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-card rounded-3xl shadow-sm overflow-hidden sticky top-24">
                  <div className="p-6 border-b border-border">
                    <h2 className="font-medium">Order Summary</h2>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Shipping Address</h3>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="street">Street Address</Label>
                          <Input
                            id="street"
                            value={shippingAddress.street}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                            placeholder="123 Main St"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={shippingAddress.city}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                              placeholder="City"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State/Province</Label>
                            <Input
                              id="state"
                              value={shippingAddress.state}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                              placeholder="State"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={shippingAddress.country}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                              placeholder="Country"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="zipCode">ZIP/Postal Code</Label>
                            <Input
                              id="zipCode"
                              value={shippingAddress.zipCode}
                              onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                              placeholder="ZIP Code"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>${totalPrice.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>Free</span>
                      </div>

                      <Separator />

                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>${totalPrice.toFixed(2)}</span>
                      </div>

                      <Button
                        className="w-full rounded-full mt-4"
                        onClick={handleCheckout}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center">
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                            Processing...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Checkout
                          </span>
                        )}
                      </Button>

                      <div className="text-xs text-center text-muted-foreground mt-4">
                        <p>Secure checkout powered by Stripe</p>
                        <p className="mt-2">100-day money-back guarantee • Free shipping on all orders</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
