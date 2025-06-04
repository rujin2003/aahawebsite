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
        // Get the current session and user
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking session:', error);
          console.log("Error:", error);
          setIsAuthenticated(false);
        } else {
          // Check if user is authenticated (has a valid session)
          const authenticated = !!(session?.user);
          const userId = session?.user?.id;
          console.log("Current user ID:", userId);
          
          // Fetch admin data if user is authenticated
          if (authenticated) {
            const { data, error: adminError } = await supabase
              .from('admin')
              .select('*')
              .eq('user_id', userId)
              .single();
            
            console.log("Admin table data:", data);
            if (adminError) {
              console.log("Error:", adminError);
            }
          }
          
          setIsAuthenticated(authenticated);
          
          // If component is still mounted, handle redirects
          if (mounted) {
            if (requireAuth && !authenticated) {
              // Protected route: redirect to signin if not authenticated
              router.push("/signin");
              return;
            } else if (!requireAuth && authenticated) {
              // Public route (signin/signup): redirect to home if already authenticated
              router.push(redirectTo);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
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

        // Add console logs for auth state changes
        console.log('Auth state changed:', event);
        if (session?.user) {
          console.log('User logged in:', {
            id: session.user.id,
            email: session.user.email,
            lastSignIn: session.user.last_sign_in_at
          });
        }

        // Handle auth state changes
        if (event === 'SIGNED_IN' && !requireAuth) {
          // User signed in on a public route (signin/signup), redirect them
          router.push(redirectTo);
        } else if (event === 'SIGNED_OUT' && requireAuth) {
          // User signed out on a protected route, redirect to signin
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
