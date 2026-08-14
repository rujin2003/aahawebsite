"use client";

export const runtime = "edge";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loading } from "@/components/ui/loading";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // null = still checking, false = link invalid/expired, true = ready
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    // the recovery link signs the user in via URL tokens; the session may
    // land either before this effect runs or a moment after, so check now
    // and also listen for the auth event
    let settled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        settled = true;
        setHasSession(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        settled = true;
        setHasSession(true);
      }
    });

    const timeout = setTimeout(() => {
      if (!settled) setHasSession(false);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast.success("Password updated! You're signed in.");
      router.push("/account");
    } catch (error: unknown) {
      console.error("Password update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="w-full mt-20 max-w-md mx-auto space-y-6">
            {hasSession === null ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loading className="w-10 h-10" />
                <p className="text-muted-foreground">Verifying reset link...</p>
              </div>
            ) : hasSession === false ? (
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">Link expired</h1>
                <p className="text-muted-foreground">
                  This password reset link is invalid or has expired. Request a new one to continue.
                </p>
                <Button asChild className="rounded-full">
                  <Link href="/forgot-password">Request New Link</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <KeyRound className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold">Set New Password</h1>
                  <p className="text-muted-foreground">
                    Choose a new password of at least 8 characters.
                  </p>
                </div>
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <Input
                      id="password"
                      type={showPasswords ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                    {confirmPassword && password !== confirmPassword && (
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
                    className="w-full"
                    disabled={isLoading || !password || password !== confirmPassword}
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
