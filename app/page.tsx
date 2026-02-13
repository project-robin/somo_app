'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { astroShivaClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

type RedirectState = 'checking' | 'unauthenticated' | 'onboarding' | 'chat' | 'error';

// Helper to set a cookie
function setCookie(name: string, value: string, days: number = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// Helper to get a cookie
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Helper to delete a cookie
function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const [state, setState] = useState<RedirectState>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setState('unauthenticated');
      return;
    }

    let cancelled = false;

    const checkProfile = async () => {
      setState('checking');
      setError(null);

      try {
        const profile = await astroShivaClient.getProfile();

        if (cancelled) return;

        if (profile.success) {
          // Check if user has completed onboarding (status is 'completed')
          const userStatus = profile.data?.status;

          if (userStatus === 'completed') {
            // Set cookie to remember onboarding is complete
            setCookie('onboarding_status', 'completed', 7);

            // Check if there's a redirect destination after onboarding
            const redirectAfterOnboarding = getCookie('redirect_after_onboarding');
            if (redirectAfterOnboarding) {
              deleteCookie('redirect_after_onboarding');
              setState('chat');
              router.push(redirectAfterOnboarding);
              return;
            }

            // Check for redirect in URL params
            const redirectParam = searchParams.get('redirect');
            if (redirectParam && redirectParam.startsWith('/')) {
              setState('chat');
              router.push(redirectParam);
              return;
            }

            setState('chat');
            router.push('/chat');
            return;
          } else {
            // User exists but onboarding not complete
            setCookie('onboarding_status', 'incomplete', 1);
            setState('onboarding');
            router.push('/onboarding');
            return;
          }
        }

        if (!profile.success && profile.error?.code === 'USER_NOT_FOUND') {
          setCookie('onboarding_status', 'incomplete', 1);
          setState('onboarding');
          router.push('/onboarding');
          return;
        }

        if (!profile.success && profile.error?.code === 'NO_TOKEN') {
          setState('unauthenticated');
          router.push('/login');
          return;
        }

        setState('error');
        setError(!profile.success ? (profile.error?.message || 'Unable to determine onboarding status.') : 'Unknown error');
      } catch (err) {
        if (cancelled) return;
        setState('error');
        setError(err instanceof Error ? err.message : 'Unable to determine onboarding status.');
      }
    };

    checkProfile();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, router, searchParams]);

  const isChecking = state === 'checking';

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
            Astro Shiva
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            AI-powered Vedic astrology assistant
          </p>

          {!isLoaded ? (
            <div className="flex items-center justify-center gap-3 text-[var(--text-secondary)]">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : isSignedIn ? (
            <div className="space-y-4">
              {isChecking ? (
                <div className="flex items-center justify-center gap-3 text-[var(--text-secondary)]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Checking your profile...</span>
                </div>
              ) : state === 'onboarding' ? (
                <div className="flex items-center justify-center gap-3 text-[var(--text-secondary)]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Redirecting to onboarding...</span>
                </div>
              ) : state === 'chat' ? (
                <div className="flex items-center justify-center gap-3 text-[var(--text-secondary)]">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Redirecting to chat...</span>
                </div>
              ) : state === 'error' ? (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--error)]">
                    {error || 'Something went wrong while checking your profile.'}
                  </p>
                  <Button
                    className="w-full bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] border-0 rounded-lg"
                    onClick={() => router.push('/onboarding')}
                  >
                    Go to Onboarding
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[var(--text-secondary)] text-sm">
                Please sign in to access your personalized astrology assistant.
              </p>
              <Button
                className="w-full bg-[var(--text-primary)] hover:bg-[var(--text-secondary)] text-[var(--bg-primary)] border-0 rounded-lg"
                onClick={() => router.push('/login')}
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel p-8"
        >
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-warm)]" />
        </motion.div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
