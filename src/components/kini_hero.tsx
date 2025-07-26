"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCountryStore } from "@/lib/countryStore";

export default function KiniHeroBanner() {
  const isSupportedCountry = useCountryStore(s=>s.isSupportedCountry)
  
  return (
    <div className="relative w-full h-[600px] overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/kini-hero.jpg"
          alt="Kini Hero"
          fill
          className="object-cover"
          priority
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
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="flex items-center gap-3 bg-[#614741] bg-opacity-80 text-white px-20 py-2 rounded-full shadow-md">
            <span className="opacity-90 text-sm font-saans">Get to know Kini now!</span>
            {isSupportedCountry ? (
              <span className="font-saans font-medium text-base">€149</span>
            ) : (
              <span className="font-saans text-sm opacity-90">Contact us for pricing</span>
            )}
            <Button 
              variant="secondary" 
              className="bg-white text-black px-3 py-1.5 rounded-full font-saans font-medium shadow-sm hover:bg-white/90"
              asChild
              disabled={!isSupportedCountry}
            >
              <Link href="/shop">
                {isSupportedCountry ? 'Buy now' : 'Shopping not available'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
