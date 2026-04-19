'use client';

import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null);
      setSession(session);
      checkAuthorization(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
