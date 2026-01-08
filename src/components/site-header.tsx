"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, ShoppingCart } from "lucide-react";
import CartDropdown from "@/components/cart-dropdown";
import { SearchModal } from "@/components/search-modal";
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
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInitials, setUserInitials] = useState<string>("");
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

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

  // Custom home page header logic
  const isHomeHeaderExpanded = isHomePage && !isScrolled;

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 md:px-8 lg:px-10 transition-all duration-500 ease-in-out",
        isVisible ? "translate-y-0" : "-translate-y-full",
        isScrolled ? "pt-4" : isHomePage ? "pt-8" : "pt-8"
      )}
    >
      <div className="relative mx-auto max-w-7xl">
        
        {/* Background Layer - Handles the shape and "hole" for logo on Home */}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-500 ease-out border shadow-soft",
            isHomeHeaderExpanded 
              ? "bg-white/95 backdrop-blur-md rounded-r-3xl rounded-l-none left-[140px] md:left-[260px] border-l-0" 
              : "bg-white/95 backdrop-blur-md rounded-full left-0 border-border/20",
            isScrolled && "bg-white/98 border-border/30 shadow-soft-lg"
          )}
        />

        {/* Content Layer */}
        <div className={cn(
          "relative z-10 flex items-center justify-between px-5 md:px-8 transition-all duration-300",
          isScrolled ? "h-[48px] md:h-[56px]" : "h-[56px] md:h-[64px]"
        )}>
          <div className="flex items-center">
           <Link
  href="/"
  className={cn(
    "flex items-center shrink-0 transition-all duration-500 hover:opacity-80",
    isAnimated ? "opacity-100" : "opacity-0"
  )}
  style={{ transitionDelay: "100ms" }}
>
 <Image 
  src="/logo.svg" 
  alt="Aaha Felt - Handcrafted Home Décor" 
  width={300} 
  height={100} 
  priority
  className={cn(
    "w-auto object-contain transition-all duration-300",
    isHomeHeaderExpanded
      ? "h-[100px] md:h-[130px]"   // ⬅ Bigger on homepage
      : isScrolled
        ? "h-[48px] md:h-[56px]"  // Compact on scroll
        : "h-[64px] md:h-[72px]"  // Normal size
  )}
/>

</Link>

          </div>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {mainNavItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-all duration-300 relative group",
                  "text-foreground/80 hover:text-primary",
                  isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: `${150 + index * 50}ms` }}
              >
                {item.name}
                <span className={cn(
                  "absolute -bottom-1 left-0 w-0 h-0.5 transition-all duration-300 group-hover:w-full",
                  "bg-gradient-to-r from-primary to-primary/50 rounded-full"
                )} />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Search Icon (Desktop) */}
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                "hidden md:flex items-center justify-center w-9 h-9",
                "rounded-full transition-all duration-300",
                "hover:bg-muted hover:scale-105",
                isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: '250ms' }}
              aria-label="Search"
            >
              <svg className="w-5 h-5 text-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Account Link */}
            <Link
              href={isLoggedIn ? "/account" : "/signin"}
              className={cn(
                "hidden md:flex items-center justify-center transition-all duration-300",
                "hover:scale-105",
                isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: '300ms' }}
            >
              {isLoggedIn && userInitials ? (
                <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold shadow-soft hover:shadow-lg transition-all duration-300">
                  {userInitials}
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-300 shadow-soft hover:shadow-lg">
                  <User className="w-5 h-5" />
                </div>
              )}
            </Link>

            {/* Cart Icon */}
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
                  "rounded-full w-10 h-10 transition-all duration-300",
                  "bg-primary text-white hover:bg-primary/90 hover:scale-105",
                  "shadow-soft hover:shadow-lg"
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

      {/* Search Modal */}
      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );}