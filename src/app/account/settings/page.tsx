"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error: unknown) {
      console.error('Error logging out:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to log out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col pt-20">
      <SiteHeader />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          <h1 className="text-3xl font-medium mb-8">Account Settings</h1>

          <div className="bg-card rounded-3xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="font-medium">Account Actions</h2>
            </div>

            <div className="p-6">
              <Button
                variant="destructive"
                className="rounded-full"
                onClick={handleLogout}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Logging out...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
} 