"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, User, ShoppingCart } from "lucide-react";
import { SearchModal } from "@/components/search-modal";
import { HangingFelt } from "@/components/hanging-felt";
import { getIntro, subscribeIntro } from "@/lib/intro-state";
import { cn, getInitials } from "@/lib/utils";
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
  // the hanging characters live on the home hero and (as a small garland)
  // on the shop page — nowhere else
  const showHangingFelt = isHomePage || pathname === "/shop";
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAnimated, setIsAnimated] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInitials, setUserInitials] = useState<string>("");
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setIsAnimated(true);

    const loadUser = async (user: { id: string; email?: string; user_metadata?: any } | null) => {
      setIsLoggedIn(!!user);
      if (!user) {
        setUserInitials("");
        return;
      }

      // the profiles table is the source of truth for the display name —
      // auth metadata can lag behind profile edits
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      setUserInitials(
        getInitials(profile?.full_name || user.user_metadata?.full_name, user.email)
      );
    };

    supabase.auth.getUser().then(({ data: { user } }) => loadUser(user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      const intro = getIntro();
      const effY = intro.enabled ? currentScrollY - intro.zoneBottom : currentScrollY;
      setIsScrolled(effY > 20);

      // during the cinematic intro the nav stays out of frame; it slides in
      // as the film fades and stays present through the hero that follows
      if (intro.enabled && currentScrollY < intro.zoneBottom + window.innerHeight * 0.9) {
        setIsVisible(intro.done);
      } else if (currentScrollY < 50) {
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

  // react to intro state changes that happen without a scroll event
  // (initial mount, and the moment the film completes)
  useEffect(() => {
    const sync = () => {
      const intro = getIntro();
      if (intro.enabled && window.scrollY < intro.zoneBottom + window.innerHeight * 0.9) {
        setIsVisible(intro.done);
        setIsScrolled(window.scrollY - intro.zoneBottom > 20);
      } else if (!intro.enabled && window.scrollY < 100) {
        // intro skipped, errored or just finished while we're at the top:
        // make sure the nav (and the dolls hanging from it) comes back
        setIsVisible(true);
        setIsScrolled(window.scrollY > 20);
      }
    };
    sync();
    return subscribeIntro(sync);
  }, []);

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

        {/* Hanging felt characters suspended from the nav rail — full
            installation on the home hero, small garland on the shop page */}
        {showHangingFelt && <HangingFelt navHidden={!isVisible} subtle={!isHomePage} />}

        {/* Background Layer */}
        <div
          className={cn(
            "absolute inset-0 transition-all duration-500 ease-out border shadow-soft",
            isHomeHeaderExpanded 
              ? "bg-white/95 backdrop-blur-md rounded-r-2xl sm:rounded-r-3xl rounded-l-none left-[90px] sm:left-[130px] md:left-[190px] lg:left-[280px] border-l-0" 
              : "bg-white/95 backdrop-blur-md rounded-full left-0 border-border/20",
            isScrolled && "bg-white/98 border-border/30 shadow-soft-lg"
          )}
        />

        {/* Content Layer */}
        <div className={cn(
          "relative z-10 flex items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8 transition-all duration-300",
          isScrolled ? "h-10 sm:h-11 md:h-12" : "h-12 sm:h-14 md:h-16 lg:h-18"
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
                    ? "h-[56px] sm:h-[72px] md:h-[90px] lg:h-[120px]"
                    : isScrolled
                      ? "h-[32px] sm:h-[38px] md:h-[44px]"
                      : "h-[40px] sm:h-[48px] md:h-[56px] lg:h-[64px]"
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
                    "text-foreground/70 hover:bg-muted"
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
                <div className="flex flex-col mt-8 space-y-1">
                  <SheetClose asChild>
                    <button
                      onClick={() => { setSearchOpen(true); }}
                      className="text-foreground hover:text-primary transition-all duration-200 text-lg font-medium py-3 px-4 rounded-lg hover:bg-primary/5 text-left flex items-center gap-3"
                    >
                      <svg className="w-5 h-5 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Search
                    </button>
                  </SheetClose>
                  {mainNavItems.map((item, index) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className="text-foreground hover:text-primary transition-all duration-200 text-lg font-medium py-3 px-4 rounded-lg hover:bg-primary/5"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {item.name}
                      </Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link
                      href={isLoggedIn ? "/account" : "/signin"}
                      className="text-foreground hover:text-primary transition-all duration-200 text-lg font-medium py-3 px-4 rounded-lg hover:bg-primary/5"
                    >
                      {isLoggedIn ? "Account" : "Sign In"}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href="/cart"
                      className="text-foreground hover:text-primary transition-all duration-200 text-lg font-medium py-3 px-4 rounded-lg hover:bg-primary/5"
                    >
                      Cart
                    </Link>
                  </SheetClose>
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