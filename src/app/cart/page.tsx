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
import { useCountryStore } from "@/lib/countryStore";
import { 
  loadRazorpayScript, 
  createRazorpayOrder, 
  verifyPayment, 
  savePaymentRecord, 
  updateOrderWithPayment,
  createRazorpayPayment,
  PaymentData 
} from "@/lib/payment";
import { RazorpayOptions, RazorpayResponse } from "@/types/razorpay";

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart, promoCode, promoDiscount, applyPromoCode, removePromoCode } = useCart();
  const countryCode = useCountryStore(s=>s.countryCode)
  const isSupportedCountry = useCountryStore(s=>s.isSupportedCountry)
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: ''
  });
  const router = useRouter();

  const handleQuantityChange = (id: string, delta: number, currentQty: number) => {
    const item = items.find(i => i.id === id);
    const minQty = item?.minQuantity || 1;
    const newQty = Math.max(minQty, currentQty + delta);
    updateQuantity(id, newQty);
  };

  const handlePayment = async () => {
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
        country_code: countryCode,
        promo_code: promoCode,
        discount_amount: promoDiscount,
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

      // Create order first
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw orderError;
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Payment gateway failed to load. Please try again.");
        setLoading(false);
        return;
      }

      // Create Razorpay order
      const razorpayOrder = await createRazorpayOrder(totalPrice, 'INR');

      // Get user profile for prefill
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();

      const userName = profile?.full_name || user.user_metadata?.full_name || '';
      const userPhone = profile?.phone || user.phone || '';

      // Configure Razorpay options
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: razorpayOrder.amount.toString(),
        currency: razorpayOrder.currency,
        name: "Aaha Felt",
        description: `Order #${order.id}`,
        image: "/logo.png", // Add your logo path
        order_id: razorpayOrder.id,
        handler: async function (response: RazorpayResponse) {
          try {
            const paymentData: PaymentData = {
              orderCreationId: razorpayOrder.id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            };

            // Verify payment
            const verificationResult = await verifyPayment(paymentData);
            
            if (verificationResult.success) {
              // Save payment record
              const paymentRecord = await savePaymentRecord(
                order.id,
                paymentData,
                totalPrice,
                'INR'
              );

              // Update order with payment
              await updateOrderWithPayment(order.id, paymentRecord.id);

              // Clear cart and show success
              clearCart();
              setLoading(false);
              setOrderCompleted(true);
              toast.success("Payment successful! Your order has been placed.");
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment processing error:', error);
            toast.error('Payment processing failed. Please try again.');
            setLoading(false);
          }
        },
        prefill: {
          name: userName,
          email: user.email,
          contact: userPhone,
        },
        notes: {
          address: formattedAddress,
          order_id: order.id,
        },
        theme: {
          color: "#0f172a", // slate-900
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.info('Payment cancelled');
          }
        }
      };

      // Open Razorpay payment modal
      const paymentObject = createRazorpayPayment(options);
      paymentObject.open();

    } catch (error: unknown) {
      console.error('Payment setup error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to setup payment');
      setLoading(false);
    }
  };

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setApplyingPromo(true);
    try {
      const success = await applyPromoCode(promoCodeInput.trim());
      if (success) {
        setPromoCodeInput('');
      }
    } finally {
      setApplyingPromo(false);
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
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container py-8">
        <div className="max-w-7xl mx-auto pt-32">
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
                <div className="bg-white rounded-lg shadow-sm border border-border">
                  <div className="p-6">
                    <h1 className="text-2xl font-medium mb-6">Shopping Cart</h1>
                    <div className="space-y-6">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4">
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
                              {isSupportedCountry ? (
                                <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                              ) : (
                                <p className="text-sm text-muted-foreground">Contact us for pricing</p>
                              )}
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
                                  disabled={item.quantity <= (item.minQuantity || 1)}
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
              </div>

              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                  <h2 className="text-lg font-medium mb-4">Order Summary</h2>
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="font-medium">Promo Code</h3>
                      <div className="flex gap-2">
                        <Input
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value)}
                          placeholder="Enter promo code"
                          disabled={!!promoCode || applyingPromo}
                        />
                        {promoCode ? (
                          <Button
                            variant="outline"
                            onClick={removePromoCode}
                            disabled={applyingPromo}
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            onClick={handleApplyPromoCode}
                            disabled={applyingPromo}
                          >
                            {applyingPromo ? (
                              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              'Apply'
                            )}
                          </Button>
                        )}
                      </div>
                      {promoCode && (
                        <p className="text-sm text-green-600">
                          Promo code applied: {promoCode} (-${promoDiscount.toFixed(2)})
                        </p>
                      )}
                    </div>

                    <Separator />

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

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      {isSupportedCountry ? (
                        <span>${(totalPrice + promoDiscount).toFixed(2)}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Contact us for pricing</span>
                      )}
                    </div>

                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-${promoDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>Free</span>
                    </div>

                    <Separator />

                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      {isSupportedCountry ? (
                        <span>${totalPrice.toFixed(2)}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Contact us for pricing</span>
                      )}
                    </div>

                    <Button
                      className="w-full rounded-full mt-4"
                      onClick={handlePayment}
                      disabled={loading || !isSupportedCountry}
                    >
                      {loading ? (
                        <span className="flex items-center">
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                          Processing...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <CreditCard className="w-4 h-4 mr-2" />
                          {isSupportedCountry ? 'Pay Now' : 'Shopping not available'}
                        </span>
                      )}
                    </Button>
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
