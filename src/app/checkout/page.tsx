"use client";

export const runtime = "edge";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { convertUSDToLocalCurrency } from '@/lib/utils';
import { useCountryStore } from "@/lib/countryStore";

export default function CheckoutPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const countryCode = useCountryStore(s => s.countryCode);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the order ID from the URL query parameter
      const params = new URLSearchParams(window.location.search);
      const orderId = params.get('orderId');

      if (!orderId) {
        throw new Error("Order ID not found");
      }

      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({ status: 'processing' })
        .eq('id', orderId);

      if (error) throw error;

      // Fetch order details for email
      const { data: order } = await supabase
        .from('orders')
        .select('id, user_id, total_amount, items, country_code')
        .eq('id', orderId)
        .single();

      // Trigger order placed email (single call; backend handles admin + customer)
      let emailSent = false;
      if (order) {
        try {
          // Get user details from auth and profiles
          const { data: { user } } = await supabase.auth.getUser();
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', order.user_id)
            .single();

          const customerName = profile?.full_name || user?.user_metadata?.full_name || 'Customer';
          const customerEmail = user?.email ?? '';

          // Convert prices to local currency for email
          const orderCountryCode = order.country_code || countryCode || 'US';
          const currencyInfo = await convertUSDToLocalCurrency(1, orderCountryCode);
          const currencySymbol = currencyInfo.symbol;
          const currencyCode = currencyInfo.code;

          const emailItems = await Promise.all((order.items || []).map(async (item: any) => {
            const localPrice = await convertUSDToLocalCurrency(item.price ?? 0, orderCountryCode);
            return {
              name: item.product_name || 'Product',
              qty: item.quantity || 1,
              rate: Number(localPrice.amount),
              total: Number(localPrice.amount) * (item.quantity || 1),
            };
          }));

          const localGrandTotal = await convertUSDToLocalCurrency(order.total_amount ?? 0, orderCountryCode);

          const res = await fetch('/api/email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'order_placed',
              data: {
                orderId: order.id,
                customerName,
                customerEmail,
                items: emailItems,
                grandTotal: Number(localGrandTotal.amount),
                currency: currencyCode,
                currencySymbol: currencySymbol,
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
      }

      if (emailSent) {
        toast.success("Payment successful! Your order is being processed and confirmation email sent.");
      } else {
        toast.success("Payment successful! Your order is being processed. (Email confirmation may be delayed)");
      }
      router.push(`/orders/${orderId}`);
    } catch (error: unknown) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>
            <Card className="p-6">
              <form onSubmit={handlePayment} className="space-y-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Payment Information</h2>
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name on Card</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing Payment..." : "Pay Now"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
