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
import { supabase, User, Order, Return } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn, getInitials } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";
import { useCountryStore } from "@/lib/countryStore";
import { convertUSDToLocalCurrency } from "@/lib/utils";
import {
  LogOut,
  Package,
  RotateCcw,
  ShieldCheck,
  UserRound,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const router = useRouter();
  const isSupportedCountry = useCountryStore((s) => s.isSupportedCountry);
  const countryCode = useCountryStore((s) => s.countryCode);
  const [localPrices, setLocalPrices] = useState<Record<string, { amount: number; symbol: string; code: string }>>({});
  const [localOrderTotals, setLocalOrderTotals] = useState<Record<string, { amount: number; symbol: string; code: string }>>({});

  // change-password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
        return;
      }

      setUser(user as User);
      await Promise.all([
        fetchProfile(user.id),
        fetchOrders(user.id),
        fetchReturns(user.id),
      ]);
      setIsLoading(false);
    };

    checkUser();
  }, [router]);

  // Convert prices to local currency when orders change
  useEffect(() => {
    if (!isSupportedCountry || !orders.length) return;

    const convertPrices = async () => {
      const newLocalPrices: Record<string, { amount: number; symbol: string; code: string }> = {};
      const newLocalOrderTotals: Record<string, { amount: number; symbol: string; code: string }> = {};

      // all conversions share one cached rate — run them together instead
      // of one at a time so order history paints in a single pass
      await Promise.all(
        orders.map(async (order) => {
          newLocalOrderTotals[order.id] = countryCode
            ? await convertUSDToLocalCurrency(order.total_amount, countryCode)
            : { amount: order.total_amount, symbol: "$", code: "USD" };

          await Promise.all(
            (order.items || []).map(async (item) => {
              newLocalPrices[item.id] = countryCode
                ? await convertUSDToLocalCurrency(item.price, countryCode)
                : { amount: item.price, symbol: "$", code: "USD" };
            })
          );
        })
      );

      setLocalPrices(newLocalPrices);
      setLocalOrderTotals(newLocalOrderTotals);
    };

    convertPrices();
  }, [orders, countryCode, isSupportedCountry]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: unknown) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to fetch profile information");
    }
  };

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          items:order_items(*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: unknown) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    }
  };

  const fetchReturns = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("returns")
        .select(`
          *,
          items:return_items(*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReturns(data || []);
    } catch (error: unknown) {
      console.error("Error fetching returns:", error);
      toast.error("Failed to fetch returns");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
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
        .from("returns")
        .insert([
          {
            order_id: selectedOrder.id,
            user_id: user.id,
            status: "pending",
            reason: returnReason,
            items: selectedOrder.items.map((item) => ({
              order_item_id: item.id,
              quantity: item.quantity,
              reason: returnReason,
            })),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success("Return request submitted successfully");
      setReturns([returnData, ...returns]);
      setSelectedOrder(null);
      setReturnReason("");
    } catch (error: unknown) {
      console.error("Error creating return:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create return request");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "processing":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId);

      if (error) throw error;

      setOrders(orders.map((order) =>
        order.id === orderId ? { ...order, status: "cancelled" } : order
      ));

      toast.success("Order cancelled successfully");
    } catch (error: unknown) {
      console.error("Error cancelling order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to cancel order");
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          address: profile.address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      // keep auth metadata in step so the header avatar never shows a stale name
      await supabase.auth.updateUser({ data: { full_name: profile.full_name } });

      toast.success("Profile updated successfully");
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      // confirm the current password before allowing a change
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verifyError) {
        toast.error("Current password is incorrect");
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      console.error("Error changing password:", error);
      toast.error(error instanceof Error ? error.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
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

  const displayName = profile?.full_name || user?.user_metadata?.full_name || "";
  const initials = getInitials(displayName, user?.email);
  const memberSince = profile?.created_at || user?.created_at;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pt-28 pb-16 md:pt-36">
        <div className="container">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Profile summary */}
            <Card className="p-6 md:p-8 rounded-3xl border-border/40 shadow-soft">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary text-white flex items-center justify-center text-2xl md:text-3xl font-semibold shadow-soft shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl md:text-3xl font-bold truncate">
                    {displayName || "My Account"}
                  </h1>
                  <p className="text-muted-foreground truncate">{user?.email}</p>
                  {memberSince && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Member since {format(new Date(memberSince), "MMMM yyyy")}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="rounded-full self-start sm:self-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </Card>

            <Tabs defaultValue="profile" className="space-y-8">
              <TabsList className="h-auto p-1 rounded-full flex-wrap">
                <TabsTrigger value="profile" className="rounded-full px-4 py-2 gap-2">
                  <UserRound className="w-4 h-4" />
                  Profile
                </TabsTrigger>
                {isSupportedCountry && (
                  <>
                    <TabsTrigger value="orders" className="rounded-full px-4 py-2 gap-2">
                      <Package className="w-4 h-4" />
                      Orders
                    </TabsTrigger>
                    <TabsTrigger value="returns" className="rounded-full px-4 py-2 gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Returns
                    </TabsTrigger>
                  </>
                )}
                <TabsTrigger value="security" className="rounded-full px-4 py-2 gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Security
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="space-y-6">
                <Card className="p-6 md:p-8 rounded-3xl border-border/40 shadow-soft">
                  <h2 className="text-xl font-semibold mb-1">Personal Information</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    This is how your details appear on orders and deliveries.
                  </p>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={profile?.full_name || ""}
                          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                          placeholder="Your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={profile?.phone || ""}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                          placeholder="+1234567890"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={user?.email || ""} disabled />
                      <p className="text-xs text-muted-foreground">
                        Your email is used for sign in and can't be changed here.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={profile?.address || ""}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        placeholder="Street, City, State, Country, ZIP"
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="rounded-full" disabled={isSavingProfile}>
                      {isSavingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Card>
              </TabsContent>

              {/* Orders Tab */}
              {isSupportedCountry && (
                <TabsContent value="orders" className="space-y-6">
                  {orders.length === 0 ? (
                    <Card className="p-12 rounded-3xl border-border/40 shadow-soft text-center">
                      <Package className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                      <Button className="rounded-full mt-4" onClick={() => router.push("/shop")}>
                        Browse the Shop
                      </Button>
                    </Card>
                  ) : (
                    orders.map((order) => (
                      <Card key={order.id} className="p-6 rounded-3xl border-border/40 shadow-soft">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium">Order #{order.id.slice(0, 8)}</h3>
                            <p className="text-sm text-muted-foreground">
                              Placed on {format(new Date(order.created_at), "PPP")}
                            </p>
                          </div>
                          <Badge className={cn(
                            "capitalize",
                            order.status === "to_be_verified" && "bg-yellow-500",
                            order.status === "pending" && "bg-yellow-500",
                            order.status === "processing" && "bg-blue-500",
                            order.status === "shipped" && "bg-purple-500",
                            order.status === "delivered" && "bg-green-500",
                            order.status === "cancelled" && "bg-red-500"
                          )}>
                            {order.status.replace("_", " ")}
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4">
                              {item.product_image && (
                                <img
                                  src={item.product_image}
                                  alt={item.product_name}
                                  className="w-16 h-16 object-cover rounded-xl"
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
                                    : "..."
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
                                  : "..."
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
                          {order.status !== "shipped" && order.status !== "delivered" && order.status !== "cancelled" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="mt-4 rounded-full"
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
                  <Card className="p-6 md:p-8 rounded-3xl border-border/40 shadow-soft">
                    <h2 className="text-xl font-semibold mb-4">Create Return Request</h2>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Select Order</Label>
                        <select
                          className="w-full p-2 border rounded-md bg-background"
                          value={selectedOrder?.id || ""}
                          onChange={(e) => {
                            const order = orders.find((o) => o.id === e.target.value);
                            setSelectedOrder(order || null);
                          }}
                        >
                          <option value="">Select an order</option>
                          {orders
                            .filter((order) => order.status === "delivered")
                            .map((order) => (
                              <option key={order.id} value={order.id}>
                                Order #{order.id.slice(0, 8)} - {format(new Date(order.created_at), "PPP")}
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
                                <div key={item.id} className="flex items-center gap-4 p-2 bg-muted/50 rounded-xl">
                                  {item.product_image && (
                                    <img
                                      src={item.product_image}
                                      alt={item.product_name}
                                      className="w-16 h-16 object-cover rounded-lg"
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
                            className="rounded-full"
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
                        <Card key={returnRequest.id} className="p-6 rounded-3xl border-border/40 shadow-soft">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Return #{returnRequest.id.slice(0, 8)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(returnRequest.created_at), "PPP")}
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

              {/* Security Tab */}
              <TabsContent value="security" className="space-y-6">
                <Card className="p-6 md:p-8 rounded-3xl border-border/40 shadow-soft">
                  <h2 className="text-xl font-semibold mb-1">Change Password</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Use a password of at least 8 characters that you don't use elsewhere.
                  </p>
                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-destructive">Passwords do not match</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showPasswords ? "Hide passwords" : "Show passwords"}
                    </button>
                    <Button
                      type="submit"
                      className="rounded-full"
                      disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword}
                    >
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Card>

                <Card className="p-6 md:p-8 rounded-3xl border-border/40 shadow-soft">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        Privacy Policy
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Read how we collect, use, and protect your personal information.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-full shrink-0"
                      onClick={() => window.open("/privacypolicy.pdf", "_blank")}
                    >
                      View Policy
                    </Button>
                  </div>
                </Card>

                <Card className="p-6 md:p-8 rounded-3xl border-border/40 shadow-soft">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 space-y-1">
                      <h2 className="text-xl font-semibold flex items-center gap-2">
                        <LogOut className="w-5 h-5 text-muted-foreground" />
                        Sign Out
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Sign out of your account on this device. You can sign back in at any time.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="rounded-full shrink-0"
                      onClick={handleSignOut}
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
