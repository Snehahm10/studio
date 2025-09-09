'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.804 12.8C34.661 8.966 29.698 6.5 24 6.5C13.489 6.5 5 14.989 5 25.5s8.489 19 19 19s19-8.489 19-19c0-1.897-.282-3.722-.796-5.417z" />
        <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12.5 24 12.5c3.059 0 5.842 1.154 7.961 3.039L38.804 12.8C34.661 8.966 29.698 6.5 24 6.5C16.318 6.5 9.779 10.435 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44.5c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36.5 24 36.5c-5.22 0-9.651-3.657-11.303-8.5H6.306C9.779 36.565 16.318 40.5 24 40.5z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.16-4.087 5.571l6.19 5.238C42.012 35.533 44.5 30.867 44.5 25.5c0-1.897-.282-3.722-.796-5.417z" />
    </svg>
);

export default function LoginPage() {
    const { signInWithGoogle, loading } = useAuth();

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-3xl font-bold text-primary">Welcome to VTU Assistant</CardTitle>
                    <CardDescription>Sign in to access your resources</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button 
                        onClick={signInWithGoogle} 
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon />}
                        Sign in with Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
