"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { OrderTracking } from "@/components/orders/order-tracking";
import { Order, getOrderDetails } from "@/lib/supabase";
import { toast } from "sonner";

interface OrderTrackingClientProps {
  orderId: string;
}

export function OrderTrackingClient({ orderId }: OrderTrackingClientProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const orderData = await getOrderDetails(orderId);
        setOrder(orderData);
      } catch (error: unknown) {
        console.error('Error fetching order:', error);
        toast.error("Failed to fetch order details");
        router.push("/account");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col ">
        <SiteHeader />
        <main className="flex-1 py-24">
          <div className="container">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-muted-foreground mt-4">Loading order details...</p>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <OrderTracking order={order} />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
} 