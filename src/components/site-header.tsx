"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, ShoppingCart } from "lucide-react";
import CartDropdown from "@/components/cart-dropdown";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import { supabase } from "@/lib/supabase";

// Updated navigation items
const mainNavItems = [
  { name: "Shop", href: "/shop" },
  { name: "Company", href: "/company" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/contact" },
];

export function SiteHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInitials, setUserInitials] = useState<string>("");
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    setIsAnimated(true);

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
      
      if (user?.user_metadata?.full_name) {
        // Get initials from full name
        const names = user.user_metadata.full_name.split(' ');
        const initials = names
          .map((name: string) => name[0])
          .join('')
          .toUpperCase();
        setUserInitials(initials);
      }
    };

    checkUser();

    
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Set scrolled state
      setIsScrolled(currentScrollY > 20);
      
      // Handle header visibility with improved logic
      if (currentScrollY < 50) {
        // Always show header at the top
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Hide when scrolling down (after 100px)
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Show when scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledHandleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", throttledHandleScroll);
    };
  }, [lastScrollY]); 
  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-8 lg:px-10 transition-all duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "-translate-y-full",
        isScrolled ? "pt-4" : "pt-8"
      )}
    >
      <div
        className={cn(
          "mx-auto max-w-6xl transition-all duration-500",
          "rounded-full border",
          "animate-fade-down animate-duration-1000 animate-delay-300",
          isScrolled
            ? "bg-white/95 backdrop-blur-md border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.12)]" 
            : "bg-white/95 backdrop-blur-md border-white/20 shadow-[0_0px_20px_rgba(0,0,0,0.15)]"
        )}
      >
        <div className={cn(
          "flex items-center justify-between px-4 md:px-6 transition-all duration-300",
          isScrolled ? "h-10 md:h-12" : "h-12 md:h-14"
        )}>
          <div className="flex items-center">
            <Link
              href="/"
              className={cn(
                "flex items-center transition-all duration-300",
                isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: '100ms' }}
            >
              <Image 
                src="/logo.svg" 
                alt="Aaha Felt Logo" 
                width={130} 
                height={45} 
                className="h-12 w-auto sm:h-13 md:h-20 sm:w-auto md:w-auto"
              />
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {mainNavItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium hover:text-primary transition-all duration-300 relative group",
                  isScrolled ? "text-gray-700 font-semibold" : "text-gray-700", 
                  isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: `${150 + index * 50}ms` }}
              >
                {item.name}
                <span className={cn(
                  "absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full",
                  "bg-primary"
                )} />
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            <Link
              href={isLoggedIn ? "/account" : "/signin"}
              className={cn(
                "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full",
                "text-sm font-medium transition-all duration-300 hover:scale-105",
                "bg-[#AED6F1] text-gray-700 hover:bg-[#AED6F1]/90",
                isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: '300ms' }}
            >
              <User className="w-4 h-4" />
              {isLoggedIn && userInitials ? (
                <span className="font-semibold">{userInitials}</span>
              ) : (
                <span>Sign In</span>
              )}
            </Link>

            {/* Cart Icon with Circular Background */}
            <div
              className={cn(
                "transition-all duration-300",
                isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: '350ms' }}
            >
              <Button 
                variant="ghost" 
                size="icon" 
                asChild
                className={cn(
                  "rounded-full transition-all duration-300 hover:scale-105",
                  "bg-[#769a6e] text-white hover:bg-[#769a6e]/90"
                )}
              >
                <Link href="/cart">
                  <ShoppingCart className="h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger
                asChild
                className={cn(
                  "md:hidden transition-all duration-300",
                  isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: '400ms' }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Menu"
                  className={cn(
                    "rounded-full transition-all duration-300 hover:scale-105",
                    "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className={cn(
                  "rounded-l-3xl border-none backdrop-blur-md transition-all duration-300",
                  "bg-background/95 shadow-2xl"
                )}
              >
                <div className="flex flex-col mt-8 space-y-4">
                  {mainNavItems.map((item, index) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "text-foreground hover:text-primary transition-all duration-300",
                        "text-lg font-medium py-2 px-4 rounded-lg hover:bg-primary/10",
                        "transform hover:translate-x-2"
                      )}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <Link
                    href={isLoggedIn ? "/account" : "/signin"}
                    className="text-foreground hover:text-primary transition-all duration-300 text-lg font-medium py-2 px-4 rounded-lg hover:bg-primary/10 transform hover:translate-x-2"
                  >
                    {isLoggedIn ? "Account" : "Sign In"}
                  </Link>
                  <Link 
                    href="/cart" 
                    className="text-foreground hover:text-primary transition-all duration-300 text-lg font-medium py-2 px-4 rounded-lg hover:bg-primary/10 transform hover:translate-x-2"
                  >
                    Cart
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

