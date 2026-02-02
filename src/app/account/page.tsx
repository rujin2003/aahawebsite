"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase, User, Order, Return } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading"
import { useCountryStore } from "@/lib/countryStore";
import { convertUSDToLocalCurrency } from '@/lib/utils';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const isSupportedCountry = useCountryStore(s=>s.isSupportedCountry)
  const countryCode = useCountryStore(s => s.countryCode);
  const [localPrices, setLocalPrices] = useState<Record<string, { amount: number; symbol: string; code: string }>>({});
  const [localOrderTotals, setLocalOrderTotals] = useState<Record<string, { amount: number; symbol: string; code: string }>>({});


  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
        return;
      }

      setUser(user as User);
      fetchProfile(user.id);
      fetchOrders(user.id);
      fetchReturns(user.id);
      fetchSettings(user.id);
    };

    checkUser();
  }, [router]);

  // Convert prices to local currency when orders change
  useEffect(() => {
    if (!isSupportedCountry || !orders.length) return;

    const convertPrices = async () => {
      const newLocalPrices: Record<string, { amount: number; symbol: string; code: string }> = {};
      const newLocalOrderTotals: Record<string, { amount: number; symbol: string; code: string }> = {};

      for (const order of orders) {
        // Convert order total
        if (!countryCode) {
          newLocalOrderTotals[order.id] = { amount: order.total_amount, symbol: '$', code: 'USD' };
        } else {
          const convertedTotal = await convertUSDToLocalCurrency(order.total_amount, countryCode);
          newLocalOrderTotals[order.id] = convertedTotal;
        }

        // Convert item prices
        for (const item of order.items) {
          if (!countryCode) {
            newLocalPrices[item.id] = { amount: item.price, symbol: '$', code: 'USD' };
          } else {
            const converted = await convertUSDToLocalCurrency(item.price, countryCode);
            newLocalPrices[item.id] = converted;
          }
        }
      }

      setLocalPrices(newLocalPrices);
      setLocalOrderTotals(newLocalOrderTotals);
    };

    convertPrices();
  }, [orders, countryCode, isSupportedCountry]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: unknown) {
      console.error('Error fetching profile:', error);
      toast.error("Failed to fetch profile information");
    }
  };

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: unknown) {
      console.error('Error fetching orders:', error);
      toast.error("Failed to fetch orders");
    }
  };

  const fetchReturns = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          items:return_items(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReturns(data || []);
    } catch (error: unknown) {
      console.error('Error fetching returns:', error);
      toast.error("Failed to fetch returns");
    }
  };

  const fetchSettings = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setEmailNotifications(data?.email_notifications ?? false);
    } catch (error: unknown) {
      console.error('Error fetching settings:', error);
      toast.error("Failed to fetch settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleEmailNotificationsChange = async (checked: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_notifications: checked
        });

      if (error) throw error;
      setEmailNotifications(checked);
      toast.success("Settings updated successfully");
    } catch (error: unknown) {
      console.error('Error updating email notifications:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
    }
  };

  const handleCreateReturn = async () => {
    if (!selectedOrder || !returnReason) {
      toast.error("Please select an order and provide a reason");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data: returnData, error } = await supabase
        .from('returns')
        .insert([
          {
            order_id: selectedOrder.id,
            user_id: user.id,
            status: 'pending',
            reason: returnReason,
            items: selectedOrder.items.map(item => ({
              order_item_id: item.id,
              quantity: item.quantity,
              reason: returnReason
            }))
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Return request submitted successfully");
      setReturns([returnData, ...returns]);
      setSelectedOrder(null);
      setReturnReason("");
    } catch (error: unknown) {
      console.error('Error creating return:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create return request');
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Delete user preferences
      await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', user.id);

      // Delete user profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id);

      // Delete user account
      const { error } = await supabase.auth.admin.deleteUser(user.id);
      if (error) throw error;

      toast.success("Account deleted successfully");
      router.push("/");
    } catch (error: unknown) {
      console.error('Error deleting account:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      // Update the orders list
      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: 'cancelled' } : order
      ));

      toast.success("Order cancelled successfully");
    } catch (error: unknown) {
      console.error('Error cancelling order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel order');
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 py-12">
          <div className="container">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loading className="w-12 h-12" />
                <p className="text-muted-foreground mt-4">Loading account information...</p>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">My Account</h1>
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>

            <Tabs defaultValue={isSupportedCountry ? "orders" : "settings"} className="space-y-8">
              <TabsList>
                {isSupportedCountry && (
                  <>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="returns">Returns</TabsTrigger>
                  </>
                )}
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Orders Tab */}
              {isSupportedCountry && (
                <TabsContent value="orders" className="space-y-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No orders found</p>
                    </div>
                  ) : (
                    orders.map((order) => (
                      <Card key={order.id} className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium">Order #{order.id.slice(0, 8)}</h3>
                            <p className="text-sm text-muted-foreground">
                              Placed on {format(new Date(order.created_at), 'PPP')}
                            </p>
                          </div>
                          <Badge className={cn(
                            "capitalize",
                            order.status === 'to_be_verified' && "bg-yellow-500",
                            order.status === 'pending' && "bg-yellow-500",
                            order.status === 'processing' && "bg-blue-500",
                            order.status === 'shipped' && "bg-purple-500",
                            order.status === 'delivered' && "bg-green-500",
                            order.status === 'cancelled' && "bg-red-500"
                          )}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>

                        <div className="space-y-4">
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

                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <p className="font-medium">Total</p>
                            <p className="font-medium">
                              {isSupportedCountry ? (
                                localOrderTotals[order.id]
                                  ? `${localOrderTotals[order.id].symbol}${localOrderTotals[order.id].amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                  : '...'
                              ) : (
                                `$${order.total_amount.toFixed(2)}`
                              )}
                            </p>
                          </div>
                          {order.tracking_number && (
                            <p className="text-sm text-muted-foreground mt-2">
                              Tracking: {order.tracking_number}
                            </p>
                          )}
                          {order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'cancelled' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="mt-4"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              Cancel Order
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))
                  )}
                </TabsContent>
              )}

              {/* Returns Tab */}
              {isSupportedCountry && (
                <TabsContent value="returns" className="space-y-6">
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Create Return Request</h2>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select Order</Label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={selectedOrder?.id || ''}
                          onChange={(e) => {
                            const order = orders.find(o => o.id === e.target.value);
                            setSelectedOrder(order || null);
                          }}
                        >
                          <option value="">Select an order</option>
                          {orders
                            .filter(order => order.status === 'delivered')
                            .map((order) => (
                              <option key={order.id} value={order.id}>
                                Order #{order.id.slice(0, 8)} - {format(new Date(order.created_at), 'PPP')}
                              </option>
                            ))}
                        </select>
                      </div>

                      {selectedOrder && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Order Items</Label>
                            <div className="space-y-2">
                              {selectedOrder.items.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 p-2 bg-muted/50 rounded">
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
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Return Reason</Label>
                            <Textarea
                              value={returnReason}
                              onChange={(e) => setReturnReason(e.target.value)}
                              placeholder="Please provide a reason for your return..."
                              required
                            />
                          </div>

                          <Button
                            onClick={handleCreateReturn}
                            disabled={!returnReason}
                          >
                            Submit Return Request
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>

                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Return History</h2>
                    {returns.length === 0 ? (
                      <p className="text-muted-foreground">No return requests found</p>
                    ) : (
                      returns.map((returnRequest) => (
                        <Card key={returnRequest.id} className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Return #{returnRequest.id.slice(0, 8)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(returnRequest.created_at), 'PPP')}
                              </p>
                            </div>
                            <Badge className={getStatusColor(returnRequest.status)}>
                              {returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">Reason:</p>
                            <p className="text-muted-foreground">{returnRequest.reason}</p>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              )}

              {/* Profile Tab */}

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h2 className="text-xl font-semibold">Email Notifications</h2>
                      <p className="text-sm text-muted-foreground">
                        Receive email notifications about your orders and account updates
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={emailNotifications}
                        onChange={(e) => handleEmailNotificationsChange(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label>Enable</Label>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Privacy Policy</h2>
                    <p className="text-sm text-muted-foreground">
                      We take your privacy seriously. Read our privacy policy to understand how we collect,
                      use, and protect your personal information.
                    </p>
                      <Button variant="outline" onClick={() => window.open('/privacypolicy.pdf', '_blank')}>
                      View Privacy Policy
                    </Button>
                  </div>
                </Card>


                <Card className="p-6">
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Logout</h2>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account. You can sign back in at any time.
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleSignOut}
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
