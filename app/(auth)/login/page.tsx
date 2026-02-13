'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SignInButton, SignedIn, SignedOut, useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CelestialBackground } from '@/components/CelestialBackground';

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
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-6 relative overflow-hidden grok">
      <CelestialBackground starCount={40} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="bg-[var(--surface-primary)] border border-[var(--border-subtle)] rounded-2xl p-10 backdrop-blur-xl text-center shadow-2xl">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border-subtle)] flex items-center justify-center group"
          >
            <Sparkles className="w-8 h-8 text-[var(--accent-warm)] group-hover:scale-110 transition-transform duration-500" />
          </motion.div>

          <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-3 font-playfair italic tracking-tight">
            Welcome
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mb-10 font-light leading-relaxed">
            Re-establish your connection with the cosmic intelligence.
          </p>

          <SignedOut>
            <SignInButton mode="modal">
              <Button className="w-full bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] border-0 rounded-xl h-12 text-sm font-medium transition-all duration-300 group">
                Sign In
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="text-center space-y-6">
              <p className="text-xs text-[var(--text-tertiary)] font-medium uppercase tracking-[0.2em]">
                Connection Active
              </p>
              <Button
                className="w-full bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] border-0 rounded-xl h-12 text-sm font-medium transition-all duration-300"
                onClick={() => router.push('/')}
              >
                Continue to App
              </Button>
            </div>
          </SignedIn>
          
          <div className="mt-10 pt-8 border-t border-[var(--border-subtle)]">
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
              Private Alpha Access
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
