'use client';

import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { LoginPage } from './LoginPage';
import { clearUserCache } from '@/lib/security';
import { setCurrentUserId } from '@/lib/storage';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      console.log('[AuthGuard] Initial session check:', session ? 'User logged in' : 'No session');
      if (!session && isDevelopment()) {
        const success = await attemptDevAutoLogin();
        if (success) return; // onAuthStateChange will handle the state update
      }
      
      setCurrentUserId(session?.user?.id || null);
      setSession(session);
      checkAuthorization(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AuthGuard] Auth state change event: ${event}`, session ? 'User logged in' : 'No session');
      if (!session) {
        clearUserCache();
      }
      setCurrentUserId(session?.user?.id || null);
      setSession(session);
      checkAuthorization(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthorization = (currentSession: Session | null) => {
    const authorizedEmail = process.env.NEXT_PUBLIC_AUTH_EMAIL;
    if (!currentSession) {
      setAuthorized(false);
      return;
    }

    if (authorizedEmail && currentSession.user?.email?.toLowerCase() !== authorizedEmail.toLowerCase()) {
      // Logged in but not the authorized user - sign them out
      supabase.auth.signOut();
      setAuthorized(false);
      return;
    }

    setAuthorized(true);
  };

  const isDevelopment = () => {
    return process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost';
  };

  const attemptDevAutoLogin = async () => {
    const email = process.env.NEXT_PUBLIC_AUTH_EMAIL;
    const password = process.env.NEXT_PUBLIC_DEV_AUTH_PASSWORD;

    if (!email || !password) {
      console.log('[DevAuth] Auto-login skipped: Missing email or password in .env.local');
      return false;
    }

    try {
      console.log('[DevAuth] Attempting automatic developer login...');
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[DevAuth] Auto-login failed:', error.message);
        return false;
      }

      console.log('[DevAuth] Successfully logged in as developer.');
      return true;
    } catch (err) {
      console.error('[DevAuth] Unexpected error during auto-login:', err);
      return false;
    }
  };

  if (!isMounted) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a] z-[9999]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a0a] z-[9999]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || !authorized) {
    return <LoginPage />;
  }

  return <>{children}</>;
}
