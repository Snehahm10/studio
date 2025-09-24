'use client';

import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">VTU Assistant</span>
        </Link>
        <nav className="flex flex-1 items-center gap-4 text-sm">
          <Link
            href="/upload"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Upload
          </Link>
        </nav>
      </div>
    </header>
  );
}
