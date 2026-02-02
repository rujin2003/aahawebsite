"use client";

export const runtime = "edge";

import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/components/cart-provider";
import { Minus, Plus, Trash2, CreditCard, ShoppingBag, PlusCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Label } from "@/components/ui/label";
import { useCountryStore } from "@/lib/countryStore";
import { convertUSDToLocalCurrency, calculateShippingCost } from '@/lib/utils';
import { useAuth } from "@/hooks/use-auth";
import { CartSignInDialog } from "@/components/cart-signin-dialog";
import { parseAddress, formatAddress, validateAddress, type AddressParts } from "@/lib/address";
import {
  fetchUserAddresses,
  addressRowToParts,
  upsertAddressForCheckout,
  type AddressRow,
} from "@/lib/addresses";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

const emptyAddress: AddressParts = {
  street: "",
  city: "",
  state: "",
  country: "",
  zipCode: "",
};

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart, promoCode, promoDiscount, applyPromoCode, removePromoCode } = useCart();
  const { user, isAuthenticated } = useAuth();
  const countryCode = useCountryStore(s=>s.countryCode)
  const isSupportedCountry = useCountryStore(s=>s.isSupportedCountry)
  const [loading, setLoading] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [signInDialogOpen, setSignInDialogOpen] = useState(false);
  const [localPrices, setLocalPrices] = useState<Record<string, { amount: number; symbol: string; code: string }>>({});
  const [localTotalPrice, setLocalTotalPrice] = useState<{ amount: number; symbol: string; code: string } | null>(null);
  const [localPromoDiscount, setLocalPromoDiscount] = useState<{ amount: number; symbol: string; code: string } | null>(null);
  const [shippingCost, setShippingCost] = useState<{ amount: number; symbol: string; code: string }>({ amount: 0, symbol: '$', code: 'USD' });
  const [shippingAddress, setShippingAddress] = useState<AddressParts>({ ...emptyAddress });
  const [savedAddresses, setSavedAddresses] = useState<AddressRow[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const router = useRouter();

  // Load saved addresses from addresses table (and optionally migrate profile.address once)
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let mounted = true;
    (async () => {
      try {
        const list = await fetchUserAddresses(supabase, user.id);
        if (!mounted) return;
        setSavedAddresses(list);
        const defaultOrFirst = list.find((a) => a.is_default) ?? list[0];
        if (defaultOrFirst) {
          setShippingAddress(addressRowToParts(defaultOrFirst));
          setSelectedAddressId(defaultOrFirst.id);
        } else {
          // One-time: try to migrate profile.address into addresses table
          const { data: profile } = await supabase
            .from("profiles")
            .select("address")
            .eq("id", user.id)
            .single();
          const parsed = parseAddress(profile?.address);
          if (parsed && mounted) {
            const { insertAddress } = await import("@/lib/addresses");
            const inserted = await insertAddress(supabase, user.id, parsed, { setDefault: true });
            setSavedAddresses((prev) => [inserted, ...prev]);
            setShippingAddress(parsed);
            setSelectedAddressId(inserted.id);
          }
        }
      } catch (e) {
        if (mounted) setSavedAddresses([]);
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated, user?.id]);

  // Convert prices to local currency
  useEffect(() => {
    if (!isSupportedCountry || !items.length) return;

    const convertPrices = async () => {
      const newLocalPrices: Record<string, { amount: number; symbol: string; code: string }> = {};

      for (const item of items) {
        if (!countryCode) {
          newLocalPrices[item.id] = { amount: item.price, symbol: '$', code: 'USD' };
          continue;
        }
        const converted = await convertUSDToLocalCurrency(item.price, countryCode);
        newLocalPrices[item.id] = converted;
      }

      setLocalPrices(newLocalPrices);

      // Calculate total number of items
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

      // Calculate shipping cost based on country and item count
      const shipping = countryCode ? calculateShippingCost(countryCode, totalItems) : { amount: 0, symbol: '$', code: 'USD' };
      setShippingCost(shipping);

      // Convert total price
      if (!countryCode) {
        setLocalTotalPrice({ amount: totalPrice + shipping.amount, symbol: '$', code: 'USD' });
        setLocalPromoDiscount({ amount: promoDiscount, symbol: '$', code: 'USD' });
      } else {
        const convertedTotal = await convertUSDToLocalCurrency(totalPrice, countryCode);
        const convertedPromoDiscount = await convertUSDToLocalCurrency(promoDiscount, countryCode);
        setLocalTotalPrice({
          amount: convertedTotal.amount + shipping.amount,
          symbol: convertedTotal.symbol,
          code: convertedTotal.code
        });
        setLocalPromoDiscount(convertedPromoDiscount);
      }
    };

    convertPrices();
  }, [items, totalPrice, promoDiscount, countryCode, isSupportedCountry]);

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

    if (!isAuthenticated || !user) {
      setSignInDialogOpen(true);
      return;
    }

    const addressValidation = validateAddress(shippingAddress);
    if (!addressValidation.ok) {
      toast.error(addressValidation.message);
      return;
    }

    setLoading(true);

    try {
      // Save or update address in addresses table for next time
      if (user?.id) {
        await upsertAddressForCheckout(supabase, user.id, shippingAddress, selectedAddressId);
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

      // Get user display name for order and Razorpay prefill
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('id', user.id)
        .single();
      const userName = profile?.full_name || user.user_metadata?.full_name || '';
      const userPhone = profile?.phone || user.phone || '';

      // Calculate total with shipping (in USD for the order record)
      const totalWithShipping = totalPrice + shippingCost.amount;

      // Prepare order payload (will be created only after successful payment)
      const orderPayload = {
        user_id: user.id,
        customer_name: userName || 'Customer',
        customer_email: user.email ?? '',
        status: 'pending',
        total_amount: totalWithShipping,
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
            price: Number(item.price),
            product_name: item.name || 'Product',
            product_image: item.image || null,
            size: item.size ?? 'N/A'
          };
        })
      };

      // Load Razorpay script (do NOT create DB order yet - only after payment succeeds)
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Payment gateway failed to load. Please try again.");
        setLoading(false);
        return;
      }

      // Convert cart total with shipping (USD) to user's local currency for payment
      const localTotal = await convertUSDToLocalCurrency(totalWithShipping, countryCode ?? 'US');
      const paymentAmount = localTotal.amount;
      const paymentCurrency = localTotal.code;

      // Create Razorpay order in local currency (no DB order yet)
      let razorpayOrder: { id: string; amount: number; currency: string };
      try {
        razorpayOrder = await createRazorpayOrder(paymentAmount, paymentCurrency);
      } catch (razorpayErr) {
        const msg = razorpayErr instanceof Error ? razorpayErr.message : 'Failed to create payment order';
        toast.error(msg);
        setLoading(false);
        return;
      }

      // Configure Razorpay options
      const options: RazorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: razorpayOrder.amount.toString(),
        currency: razorpayOrder.currency,
        name: "Aaha Felt",
        description: "Cart checkout",
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

            // Verify payment with Razorpay before creating any DB order
            const verificationResult = await verifyPayment(paymentData);

            if (!verificationResult.success) {
              const msg = (verificationResult as { error?: string })?.error ?? 'Payment verification failed';
              toast.error(msg);
              setLoading(false);
              return;
            }

            // Only after successful verification: create DB order
            const { data: order, error: orderError } = await supabase
              .from('orders')
              .insert([orderPayload])
              .select()
              .single();

            if (orderError) {
              console.error('Order creation error after payment:', orderError);
              toast.error('Order could not be saved. Please contact support with payment ID: ' + paymentData.razorpayPaymentId);
              setLoading(false);
              return;
            }

            // Save payment record (amount in local currency as charged)
            const paymentRecord = await savePaymentRecord(
              order.id,
              paymentData,
              paymentAmount,
              paymentCurrency
            );

            await updateOrderWithPayment(order.id, paymentRecord.id);

            // Trigger order placed email (single call; backend handles admin + customer)
            let emailSent = false;
            try {
              const emailItems = items.map((item) => ({
                name: item.name || 'Product',
                qty: item.quantity,
                rate: Number(item.price),
                total: Number(item.price) * item.quantity,
              }));
              const res = await fetch('/api/email', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  type: 'order_placed',
                  data: {
                    orderId: order.id,
                    customerName: userName || 'Customer',
                    customerEmail: user.email ?? '',
                    items: emailItems,
                    grandTotal: Number(order.total_amount ?? 0),
                  },
                }),
              });
              emailSent = res.ok;
              if (!res.ok) {
                const text = await res.text().catch(() => '');
                console.error('Order emails:', text || `HTTP ${res.status}`);
              }
            } catch (emailError) {
              console.error('Failed to send order emails:', emailError);
            }

            clearCart();
            setLoading(false);
            setOrderCompleted(true);

            if (emailSent) {
              toast.success("Payment successful! Your order has been placed and confirmation email sent.");
            } else {
              toast.success("Payment successful! Your order has been placed. (Email confirmation may be delayed)");
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
          razorpay_order_id: razorpayOrder.id,
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
      const message = error instanceof Error ? error.message : 'Failed to setup payment';
      toast.error(message);
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
                                <p className="font-medium">
                                  {localPrices[item.id]
                                    ? `${localPrices[item.id].symbol}${(localPrices[item.id].amount * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    : '...'}
                                </p>
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
                          Promo code applied: {promoCode}
                          {localPromoDiscount
                            ? ` (-${localPromoDiscount.symbol}${localPromoDiscount.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
                            : ` (-$${promoDiscount.toFixed(2)})`}
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="font-medium">Shipping Address</h3>
                      {isAuthenticated && savedAddresses.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                          <div className="flex-1 min-w-0">
                            <Label className="text-xs text-muted-foreground mb-1.5 block">Saved addresses</Label>
                            <Select
                              value={selectedAddressId ?? "new"}
                              onValueChange={(value) => {
                                if (value === "new") {
                                  setShippingAddress({ ...emptyAddress });
                                  setSelectedAddressId(null);
                                  toast.info("Enter a new address");
                                } else {
                                  const addr = savedAddresses.find((a) => a.id === value);
                                  if (addr) {
                                    setShippingAddress(addressRowToParts(addr));
                                    setSelectedAddressId(addr.id);
                                  }
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose an address" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">Add new address</SelectItem>
                                {savedAddresses.map((addr) => (
                                  <SelectItem key={addr.id} value={addr.id}>
                                    {addr.label || `${addr.street}, ${addr.city}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                            <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => {
                              setShippingAddress({ ...emptyAddress });
                              setSelectedAddressId(null);
                              toast.info("Enter a new address");
                            }}
                          >
                            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                            New address
                          </Button>
                        </div>
                      )}
                      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                        <div>
                          <Label htmlFor="street">Street Address</Label>
                          <Input
                            id="street"
                            value={shippingAddress.street}
                            onChange={(e) => setShippingAddress((a) => ({ ...a, street: e.target.value }))}
                            placeholder="123 Main St"
                            className="mt-1"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              value={shippingAddress.city}
                              onChange={(e) => setShippingAddress((a) => ({ ...a, city: e.target.value }))}
                              placeholder="City"
                              className="mt-1"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="state">State / Province</Label>
                            <Input
                              id="state"
                              value={shippingAddress.state}
                              onChange={(e) => setShippingAddress((a) => ({ ...a, state: e.target.value }))}
                              placeholder="State"
                              className="mt-1"
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
                              onChange={(e) => setShippingAddress((a) => ({ ...a, country: e.target.value }))}
                              placeholder="Country"
                              className="mt-1"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="zipCode">ZIP / Postal Code</Label>
                            <Input
                              id="zipCode"
                              value={shippingAddress.zipCode}
                              onChange={(e) => setShippingAddress((a) => ({ ...a, zipCode: e.target.value }))}
                              placeholder="ZIP Code"
                              className="mt-1"
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
                        <span>
                          {localTotalPrice
                            ? `${localTotalPrice.symbol}${(localTotalPrice.amount + (promoDiscount > 0 ? localPromoDiscount?.amount || 0 : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '...'}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Contact us for pricing</span>
                      )}
                    </div>

                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>
                          {isSupportedCountry && localPromoDiscount
                            ? `-${localPromoDiscount.symbol}${localPromoDiscount.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `-$${promoDiscount.toFixed(2)}`}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      {isSupportedCountry ? (
                        <span>
                          {shippingCost.amount > 0
                            ? `${shippingCost.symbol}${shippingCost.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'Free'}
                        </span>
                      ) : (
                        <span>Free</span>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between font-medium">
                      <span>Total</span>
                      {isSupportedCountry ? (
                        <span>
                          {localTotalPrice
                            ? `${localTotalPrice.symbol}${localTotalPrice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '...'}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Contact us for pricing</span>
                      )}
                    </div>

                    {!isAuthenticated && items.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Sign in to checkout.{" "}
                        <button
                          type="button"
                          className="text-primary hover:underline font-medium"
                          onClick={() => setSignInDialogOpen(true)}
                        >
                          Sign in
                        </button>
                        {" or "}
                        <button
                          type="button"
                          className="text-primary hover:underline font-medium"
                          onClick={() => setSignInDialogOpen(true)}
                        >
                          create an account
                        </button>
                      </p>
                    )}
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
      <CartSignInDialog open={signInDialogOpen} onOpenChange={setSignInDialogOpen} />
    </div>
  );
}
