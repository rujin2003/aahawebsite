"use client";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function SignInPage() {
  return (
    <AuthGuard requireAuth={false} redirectTo="/">
      <div className="flex min-h-screen flex-col ">
        <SiteHeader />
        <main className="flex-1 py-12 mt-24">
          <div className="container">
            <SignInForm />
          </div>
        </main>
        <SiteFooter />
      </div>
    </AuthGuard>
  );
} 