"use client";

import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="bg-black text-white rounded-t-3xl mt-16 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full opacity-20">
        <div className="absolute top-[-50%] left-[-10%] w-[70%] h-[70%] rounded-full bg-blue-500/30 blur-[100px]"></div>
        <div className="absolute bottom-[-30%] right-[-5%] w-[60%] h-[60%] rounded-full bg-primary/30 blur-[100px]"></div>
      </div>

      <div className="container pt-16 pb-8 relative z-10">
        <div className="flex flex-col gap-16">
          <div className="flex flex-row justify-between flex-wrap gap-8">
            <div className="flex flex-col items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/logo.svg"
                  alt="Aaha Felt Logo"
                  width={70}
                  height={70}
                  className="h-[70px] w-[70px] filter invert"
                />
              </Link>

              <div className="flex mt-4 space-x-4">
                <Link
                  href="https://instagram.com"
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram className="w-5 h-5 text-white hover:text-primary transition-colors" />
                </Link>
                <Link
                  href="https://linkedin.com"
                  aria-label="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="w-5 h-5 text-white hover:text-primary transition-colors" />
                </Link>
                <Link
                  href="https://facebook.com"
                  aria-label="Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="w-5 h-5 text-white hover:text-primary transition-colors" />
                </Link>
                <Link
                  href="https://youtube.com"
                  aria-label="YouTube"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Youtube className="w-5 h-5 text-white hover:text-primary transition-colors" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
              {/* Footer Links */}
              {/* Technology */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium uppercase tracking-wider">Technology</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/felting-process" className="text-sm text-white/60 hover:text-white transition-colors">
                      Felting Process
                    </Link>
                  </li>
                  <li>
                    <Link href="/materials" className="text-sm text-white/60 hover:text-white transition-colors">
                      Materials
                    </Link>
                  </li>
                  <li>
                    <Link href="/sustainability" className="text-sm text-white/60 hover:text-white transition-colors">
                      Sustainability
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium uppercase tracking-wider">Company</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/about" className="text-sm text-white/60 hover:text-white transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/team" className="text-sm text-white/60 hover:text-white transition-colors">
                      Our Team
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="text-sm text-white/60 hover:text-white transition-colors">
                      Careers
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Shop */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium uppercase tracking-wider">Shop</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/shop/all" className="text-sm text-white/60 hover:text-white transition-colors">
                      All Products
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop/home-decor" className="text-sm text-white/60 hover:text-white transition-colors">
                      Home Decor
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop/accessories" className="text-sm text-white/60 hover:text-white transition-colors">
                      Accessories
                    </Link>
                  </li>
                  <li>
                    <Link href="/shop/gifts" className="text-sm text-white/60 hover:text-white transition-colors">
                      Gifts
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium uppercase tracking-wider">Support</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/contact" className="text-sm text-white/60 hover:text-white transition-colors">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link href="/shipping" className="text-sm text-white/60 hover:text-white transition-colors">
                      Shipping & Delivery
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-sm text-white/60 hover:text-white transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-sm text-white/60 hover:text-white transition-colors">
                      Terms & Conditions
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <Separator className="my-8 bg-white/10" />

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-white/60">
                Designed with love by felt experts. Handcrafted in Nepal.
              </p>
              <div className="flex items-center">
                <p className="text-xs text-white/60">100-day money-back guarantee</p>
                <Separator orientation="vertical" className="mx-3 h-4 bg-white/20" />
                <p className="text-xs text-white/60">Global express shipping</p>
              </div>
            </div>

            <p className="text-[10px] text-white/40 mt-6">
              These products are handcrafted with care. Each piece is unique and may vary slightly from the images shown. Colors may appear differently depending on your monitor settings.
            </p>

            {/* Payment Icons */}
            <span>
            <div className="flex flex-wrap gap-3 mt-6">
              <Image src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" width={32} height={20} className="h-[20px] w-[32px] object-contain" />
              <Image src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" width={32} height={20} className="h-[20px] w-[32px] object-contain" />
              <Image src="https://www.logo.wine/a/logo/American_Express/American_Express-Logo.wine.svg" alt="Amex" width={32} height={20} className="h-[20px] w-[32px] object-contain" />
              <Image src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" width={32} height={20} className="h-[20px] w-[32px] object-contain" />
            </div>

            {/* Credit */}
           
            <p className="text-xs text-white/60 mt-6 text-right">
              Designed & created by{" "}
              <Link href="https://github.com/rujin2003" target="_blank" className="underline hover:text-primary">
                Rujin / @rujin2003
              </Link>
            </p>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
