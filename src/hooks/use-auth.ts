"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        // First check localStorage for existing session
        const storedSession = localStorage.getItem('supabase.auth.token');
        if (storedSession) {
          const session = JSON.parse(storedSession);
          if (mounted) {
            setUser(session?.user ?? null);
          }
        }

        // Then verify with Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          localStorage.removeItem('supabase.auth.token');
        } else if (mounted) {
          setUser(session?.user ?? null);
          if (session) {
            localStorage.setItem('supabase.auth.token', JSON.stringify(session));
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        localStorage.removeItem('supabase.auth.token');
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        if (session) {
          localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        } else {
          localStorage.removeItem('supabase.auth.token');
        }
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
  };
}
