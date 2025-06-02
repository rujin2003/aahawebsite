"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function KiniHeroBanner() {
  return (
    <div className="flex justify-center items-center p-4 animate-on-scroll fade-up">
      <div className="relative w-full max-w-7xl rounded-3xl overflow-hidden shadow-lg h-[550px]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#E04E32] via-white to-[#E5A0A4] rounded-3xl"></div>

        {/* Title at the top, aligned left */}
        <div className="absolute top-8 left-8 px-8 text-left">
          <h2 className="text-3xl md:text-5xl font-saans font-medium text-[#FFFFFF]">
            Meet Kini,
          </h2>
          <p className="text-lg md:text-2xl font-saans text-[#FAE8E0] mt-2">
            The first wearable using non-invasive <br />
            light technology to support and improve <br />female longevity.
          </p>
        </div>

        {/* Image in the middle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-8">
          <img
            src="/image1.png"
            alt="Kini Wearable"
            className="w-80 md:w-[28rem] object-contain"
          />
        </div>

        {/* Buy Now button fixed at the bottom */}
        <div className="absolute bottom-8 left-0 right-0 flex justify-center">
          <div className="flex items-center gap-3 bg-[#614741] bg-opacity-80 text-white px-20 py-2 rounded-full shadow-md">
            <span className="opacity-90 text-sm font-saans">Get to know Kini now!</span>
            <span className="font-saans font-medium text-base">€149</span>
            <Button 
              variant="secondary" 
              className="bg-white text-black px-3 py-1.5 rounded-full font-saans font-medium shadow-sm hover:bg-white/90"
              asChild
            >
              <Link href="/shop">
                Buy now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
