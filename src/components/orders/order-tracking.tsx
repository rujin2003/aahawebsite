"use client";

import { useState, useEffect } from "react";
import { Order } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useCountryStore } from '@/lib/countryStore';
import { convertUSDToLocalCurrency } from '@/lib/utils';

interface OrderTrackingProps {
  order: Order;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'to_be_verified':
      return 'bg-yellow-500';
    case 'pending':
      return 'bg-yellow-500';
    case 'processing':
      return 'bg-blue-500';
    case 'shipped':
      return 'bg-purple-500';
    case 'delivered':
      return 'bg-green-500';
    case 'cancelled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusDescription = (status: string) => {
  switch (status) {
    case 'to_be_verified':
      return 'Your order has been received and is waiting for verification. We will review your order shortly.';
    case 'pending':
      return 'Your order has been verified and is waiting to be processed.';
    case 'processing':
      return 'Your order is being prepared for shipping.';
    case 'shipped':
      return 'Your order has been shipped and is on its way.';
    case 'delivered':
      return 'Your order has been delivered.';
    case 'cancelled':
      return 'Your order has been cancelled.';
    default:
      return '';
  }
};

export function OrderTracking({ order }: OrderTrackingProps) {
  const countryCode = useCountryStore(s => s.countryCode);
  const isSupportedCountry = useCountryStore(s => s.isSupportedCountry);
  const [localPrices, setLocalPrices] = useState<Record<string, { amount: number; symbol: string; code: string }>>({});
  const [localTotalPrice, setLocalTotalPrice] = useState<{ amount: number; symbol: string; code: string } | null>(null);

  // Convert prices to local currency
  useEffect(() => {
    if (!isSupportedCountry || !order.items.length) return;
    
    const convertPrices = async () => {
      const newLocalPrices: Record<string, { amount: number; symbol: string; code: string }> = {};
      
      for (const item of order.items) {
        if (!countryCode) {
          newLocalPrices[item.id] = { amount: item.price, symbol: '$', code: 'USD' };
          continue;
        }
        const converted = await convertUSDToLocalCurrency(item.price, countryCode);
        newLocalPrices[item.id] = converted;
      }
      
      setLocalPrices(newLocalPrices);
      
      // Convert total price
      if (!countryCode) {
        setLocalTotalPrice({ amount: order.total_amount, symbol: '$', code: 'USD' });
      } else {
        const convertedTotal = await convertUSDToLocalCurrency(order.total_amount, countryCode);
        setLocalTotalPrice(convertedTotal);
      }
    };
    
    convertPrices();
  }, [order.items, order.total_amount, countryCode, isSupportedCountry]);

  return (
    <Card className="p-6 mt-24">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-medium">Order #{order.id.slice(0, 8)}</h3>
          <p className="text-sm text-muted-foreground">
            Placed on {format(new Date(order.created_at), 'PPP')}
          </p>
        </div>
        <Badge className={getStatusColor(order.status)}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">
            {getStatusDescription(order.status)}
          </p>
        </div>

        {order.tracking_number && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-medium mb-1">Tracking Information</p>
            <p className="text-sm text-muted-foreground">
              Tracking Number: {order.tracking_number}
            </p>
            {order.estimated_delivery && (
              <p className="text-sm text-muted-foreground">
                Estimated Delivery: {format(new Date(order.estimated_delivery), 'PPP')}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <h4 className="font-medium">Order Items</h4>
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4">
              {item.product_image && (
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.product_name}</p>
                <p className="text-sm text-muted-foreground">
                  Quantity: {item.quantity}
                  {item.size && ` | Size: ${item.size}`}
                </p>
              </div>
              <p className="font-medium">
                {isSupportedCountry ? (
                  localPrices[item.id] 
                    ? `${localPrices[item.id].symbol}${(localPrices[item.id].amount * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : '...'
                ) : (
                  `$${(item.price * item.quantity).toFixed(2)}`
                )}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <p className="font-medium">Total Amount</p>
            <p className="font-medium">
              {isSupportedCountry ? (
                localTotalPrice 
                  ? `${localTotalPrice.symbol}${localTotalPrice.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '...'
              ) : (
                `$${order.total_amount.toFixed(2)}`
              )}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
} 