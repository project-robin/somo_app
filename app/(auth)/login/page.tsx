'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignInButton, SignedIn, SignedOut, useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 mx-auto mb-6 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-center"
          >
            <Sparkles className="w-8 h-8 text-[var(--accent-warm)]" />
          </motion.div>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
            Welcome Back
          </h1>
          <p className="text-[var(--text-secondary)] mb-8">
            Sign in to access your personalized Vedic astrology readings
          </p>

          <SignedOut>
            <SignInButton mode="modal">
              <Button className="w-full bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] border-0 rounded-lg h-11">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="text-center space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                You are already signed in.
              </p>
              <Button
                className="w-full bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] border-0 rounded-lg h-11"
                onClick={() => router.push('/')}
              >
                Continue to App
              </Button>
            </div>
          </SignedIn>
        </div>
      </motion.div>
    </div>
  );
}
