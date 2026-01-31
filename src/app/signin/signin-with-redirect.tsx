"use client";

import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthGuard } from "@/components/auth/auth-guard";

export function SignInWithRedirect() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  return (
    <AuthGuard requireAuth={false} redirectTo={redirectTo}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1 py-12">
          <div className="container">
            <SignInForm />
          </div>
        </main>
        <SiteFooter />
      </div>
    </AuthGuard>
  );
}
