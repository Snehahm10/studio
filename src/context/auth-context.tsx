'use client';

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Simplified User interface
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  // This is now a simple string token, not a Firebase function
  idToken: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy user for demonstration until a proper non-Firebase OAuth flow is implemented
const getDummyUser = (): User => ({
    uid: 'dummy-user-12345',
    email: 'test.user@example.com',
    displayName: 'Test User',
    photoURL: 'https://picsum.photos/seed/user/40/40',
    idToken: 'dummy-token'
});


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // In a real non-Firebase OAuth flow, you'd check session storage 
    // or make a call to your backend to verify a session.
    // For now, we'll just simulate a logged-out state initially.
    const storedUser = sessionStorage.getItem('vtu-user');
    if (storedUser) {
        setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signInWithGoogle = () => {
    // This is a simplified placeholder. A real implementation would involve:
    // 1. Opening a popup to a Google consent screen.
    // 2. Handling the redirect/callback from Google.
    // 3. Exchanging the authorization code for an access token with your backend.
    // For now, we will simulate a successful login and create a dummy user.
    setLoading(true);
    const dummyUser = getDummyUser();
    sessionStorage.setItem('vtu-user', JSON.stringify(dummyUser));
    setUser(dummyUser);
    setLoading(false);
    router.push('/');
  };

  const logout = () => {
    sessionStorage.removeItem('vtu-user');
    setUser(null);
    router.push('/login');
  };
  
  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
