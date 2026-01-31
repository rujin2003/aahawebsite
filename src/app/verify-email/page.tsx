"use client";

export const runtime = "edge";

import { useSearchParams } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const signInHref = redirectTo !== "/" ? `/signin?redirect=${encodeURIComponent(redirectTo)}` : "/signin";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-20 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Check your email</h1>
          <p className="text-muted-foreground">
            We&apos;ve sent you a verification link. Please check your inbox and
            click the link to verify your account.
          </p>
          <p className="text-sm text-muted-foreground">
            Didn&apos;t see it? Check your <strong>spam</strong> or{" "}
            <strong>junk</strong> folder, or wait a few minutes and try again.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href={signInHref}>
                Go to Sign in
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
