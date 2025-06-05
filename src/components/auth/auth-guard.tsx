"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Loading } from "@/components/ui/loading";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean; // true = require authentication, false = require no authentication
}

export function AuthGuard({ 
  children, 
  redirectTo = "/", 
  requireAuth = false 
}: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        // First check localStorage for existing session
        const storedSession = localStorage.getItem('supabase.auth.token');
        if (storedSession) {
          const session = JSON.parse(storedSession);
          if (mounted) {
            setIsAuthenticated(!!session?.user);
          }
        }

        // Then verify with Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          localStorage.removeItem('supabase.auth.token');
          setIsAuthenticated(false);
        } else if (mounted) {
          const authenticated = !!(session?.user);
          setIsAuthenticated(authenticated);
          
          if (session) {
            localStorage.setItem('supabase.auth.token', JSON.stringify(session));
          } else {
            localStorage.removeItem('supabase.auth.token');
          }

          // Handle redirects based on auth state
          if (requireAuth && !authenticated) {
            router.push("/signin");
            return;
          } else if (!requireAuth && authenticated) {
            router.push(redirectTo);
            return;
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
        localStorage.removeItem('supabase.auth.token');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        const authenticated = !!(session?.user);
        setIsAuthenticated(authenticated);

        if (session) {
          localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        } else {
          localStorage.removeItem('supabase.auth.token');
        }

        // Handle auth state changes
        if (event === 'SIGNED_IN' && !requireAuth) {
          router.push(redirectTo);
        } else if (event === 'SIGNED_OUT' && requireAuth) {
          router.push("/signin");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, redirectTo, requireAuth]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  // For protected routes: only show content if authenticated
  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // For public routes (signin/signup): only show content if not authenticated
  if (!requireAuth && isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // Show the protected content
  return <>{children}</>;
}
