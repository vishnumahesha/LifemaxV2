'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navigation } from './Navigation';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AppShellProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AppShell({ children, requireAuth = false }: AppShellProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);

      if (requireAuth && !user) {
        router.push('/auth');
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (requireAuth && !session?.user) {
          router.push('/auth');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [requireAuth, router, supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        user={user ? { email: user.email || '' } : null} 
        onSignOut={handleSignOut} 
      />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}
