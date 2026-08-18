"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useShopAvailability } from "@/lib/shop-availability";
import { EnquireButton } from "@/components/shipping-availability";
import { Skeleton } from "@/components/ui/skeleton";

export default function KiniHeroBanner() {
  const { isPending, canShop } = useShopAvailability();

  return (
    <div className="relative w-full h-[600px] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/kini-hero.jpg"
          alt="Kini Hero"
          fill
          className="object-cover"
          priority
          fetchPriority="high"
          quality={75}
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center text-white space-y-4">
          <h1 className="text-4xl md:text-6xl font-saans font-medium">
            Discover Kini
          </h1>
          <p className="text-lg md:text-xl font-saans max-w-2xl mx-auto">
            Experience the perfect blend of comfort and style with our premium collection
          </p>
        </div>
        <div className="absolute bottom-8 left-0 right-0 flex justify-center px-4">
          {/* One pill, three states — the width is driven by the copy so the
              bar doesn't jump when the country resolves. */}
          <div className="flex items-center gap-3 bg-[#614741]/80 text-white px-6 sm:px-10 py-2.5 rounded-full shadow-md">
            <span className="opacity-90 text-sm font-saans hidden sm:inline">
              Get to know Kini now!
            </span>

            {isPending ? (
              <>
                <Skeleton className="h-5 w-16 rounded-full bg-white/25" />
                <Skeleton className="h-9 w-24 rounded-full bg-white/25" />
              </>
            ) : canShop ? (
              <>
                <span className="font-saans font-medium text-base">€149</span>
                <Button
                  variant="secondary"
                  className="bg-white text-black px-4 py-1.5 rounded-full font-saans font-medium shadow-sm hover:bg-white/90"
                  asChild
                >
                  <Link href="/shop">Buy now</Link>
                </Button>
              </>
            ) : (
              <>
                <span className="font-saans text-sm opacity-90">
                  Made to order
                </span>
                <EnquireButton
                  variant="secondary"
                  label="Enquire"
                  className="bg-white text-black px-4 py-1.5 rounded-full font-saans font-medium shadow-sm hover:bg-white/90"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
