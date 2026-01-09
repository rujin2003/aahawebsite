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
      
      setIsScrolled(currentScrollY > 20);
      
      if (currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

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

  const isHomeHeaderExpanded = isHomePage && !isScrolled;

  return (
    <header 
      className={cn(
        "fixed top-0 left-0 right-0 z-50 px-2 sm:px-4 md:px-6 lg:px-10 transition-all duration-500 ease-in-out",
        isVisible ? "translate-y-0" : "-translate-y-full",
        isScrolled ? "pt-2 sm:pt-3" : isHomePage ? "pt-3 sm:pt-4 md:pt-6 lg:pt-8" : "pt-3 sm:pt-4 md:pt-6"
      )}
    >
      <div className="relative mx-auto max-w-7xl">
        
        {/* Background Layer */}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-500 ease-out border shadow-soft",
            isHomeHeaderExpanded 
              ? "bg-white/95 backdrop-blur-md rounded-r-2xl sm:rounded-r-3xl rounded-l-none left-[80px] sm:left-[120px] md:left-[180px] lg:left-[260px] border-l-0" 
              : "bg-white/95 backdrop-blur-md rounded-full left-0 border-border/20",
            isScrolled && "bg-white/98 border-border/30 shadow-soft-lg"
          )}
        />

        {/* Content Layer */}
        <div className={cn(
          "relative z-10 flex items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8 transition-all duration-300",
          isScrolled ? "h-9 sm:h-10 md:h-11" : "h-11 sm:h-12 md:h-14 lg:h-16"
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
                    ? "h-[40px] xs:h-[50px] sm:h-[65px] md:h-[80px] lg:h-[100px]"
                    : isScrolled
                      ? "h-[26px] xs:h-[30px] sm:h-[36px] md:h-[42px]"
                      : "h-[32px] xs:h-[38px] sm:h-[44px] md:h-[52px] lg:h-[58px]"
                )}
              />
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
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

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Icon (Desktop only) */}
            <button
              onClick={() => setSearchOpen(true)}
              className={cn(
                "hidden md:flex items-center justify-center w-8 h-8 lg:w-9 lg:h-9",
                "rounded-full transition-all duration-300",
                "hover:bg-muted hover:scale-105",
                isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: '250ms' }}
              aria-label="Search"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5 text-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Account Link (Desktop only) */}
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
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary text-white flex items-center justify-center text-xs lg:text-sm font-semibold shadow-soft hover:shadow-lg transition-all duration-300">
                  {userInitials}
                </div>
              ) : (
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-300 shadow-soft hover:shadow-lg">
                  <User className="w-4 h-4 lg:w-5 lg:h-5" />
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
                  "rounded-full w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 transition-all duration-300",
                  "bg-primary text-white hover:bg-primary/90 hover:scale-105",
                  "shadow-soft hover:shadow-lg"
                )}
              >
                <Link href="/cart">
                  <ShoppingCart className="h-4 w-4 sm:h-4.5 sm:w-4.5 lg:h-5 lg:w-5" />
                </Link>
              </Button>
            </div>

            {/* Mobile menu button */}
            <Sheet>
              <SheetTrigger
                asChild
                className={cn(
                  "lg:hidden transition-all duration-300",
                  isAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
                style={{ transitionDelay: '400ms' }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Menu"
                  className={cn(
                    "rounded-full transition-all duration-300 hover:scale-105 w-8 h-8 sm:w-9 sm:h-9",
                    "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className={cn(
                  "rounded-l-3xl border-none backdrop-blur-md transition-all duration-300 w-[280px] sm:w-[320px]",
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

      <SearchModal open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}