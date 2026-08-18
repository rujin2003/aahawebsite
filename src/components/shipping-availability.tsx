"use client";

import Link from "next/link";
import { Globe, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supportedCountriesLabel } from "@/lib/shop-availability";

/**
 * Everything a visitor outside our delivery range sees.
 *
 * The old copy ("Shopping not available") read like an error and sat on dead
 * disabled buttons. These pieces say where we ship, name the visitor's own
 * country, and always leave a way to actually order — so the state reads as
 * an invitation rather than a wall.
 */

/** Placeholder held while we're still working out where the visitor is. */
export function PricePending({ className }: { className?: string }) {
  return <Skeleton className={cn("h-5 w-20 rounded-full", className)} />;
}

/** Compact stand-in for a price outside the delivery range. */
export function PriceOnEnquiry({ className }: { className?: string }) {
  return (
    <Link
      href="/contact"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center gap-1.5 text-sm text-muted-foreground",
        "underline-offset-4 hover:text-primary hover:underline transition-colors",
        className
      )}
    >
      <Mail className="w-3.5 h-3.5" />
      Price on enquiry
    </Link>
  );
}

/** Non-interactive version, for cards where the whole tile is already a link. */
export function PriceOnEnquiryLabel({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-normal text-muted-foreground",
        className
      )}
    >
      <Mail className="w-3.5 h-3.5" />
      Price on enquiry
    </span>
  );
}

/** The action that replaces every disabled "Shopping not available" button. */
export function EnquireButton({
  className,
  size,
  variant = "outline",
  label = "Enquire to order",
}: {
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
  label?: string;
}) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <Link href="/contact">
        <Mail className="w-4 h-4" />
        {label || <span className="sr-only">Enquire to order</span>}
      </Link>
    </Button>
  );
}

/**
 * The explainer. `inline` sits inside a summary column, `card` stands alone on
 * a product or cart page.
 */
export function ShippingNotice({
  countryName,
  variant = "card",
  className,
}: {
  countryName?: string | null;
  variant?: "card" | "inline";
  className?: string;
}) {
  const where = countryName ? ` to ${countryName}` : " to your country";

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/15 bg-primary/[0.04]",
        variant === "card" ? "p-5" : "p-4",
        className
      )}
    >
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Globe className="h-4 w-4" />
        </span>
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-medium leading-snug">
            We don&apos;t ship{where} just yet
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Online orders are open in {supportedCountriesLabel()}. Everywhere
            else we arrange delivery by hand — send us a note with what you&apos;re
            after and we&apos;ll come back with pricing and a delivery quote.
          </p>
          <div className="pt-1.5">
            <EnquireButton size="sm" className="rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** One-line version for tight spots like the cart dropdown. */
export function ShippingNoticeCompact({
  countryName,
  className,
}: {
  countryName?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2.5 text-center", className)}>
      <p className="text-xs text-muted-foreground leading-relaxed">
        We don&apos;t ship to {countryName ?? "your country"} yet — we can still
        arrange delivery by hand.
      </p>
      <EnquireButton size="sm" className="w-full rounded-full" />
    </div>
  );
}
