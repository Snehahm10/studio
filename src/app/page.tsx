'use client';

import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { HomePageClient } from '@/components/app/home-page-client';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // This case should be handled by the AuthProvider, but as a fallback
    return (
       <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <p>Redirecting to login...</p>
        <Loader2 className="ml-4 h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return <HomePageClient />;
}
