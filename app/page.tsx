'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Sparkles, Loader2, ArrowRight, ShieldCheck, Globe, Zap, Star, MessageCircle, ChevronDown } from 'lucide-react';
import { astroShivaClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';

// Cookie helpers
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

type RedirectState = 'idle' | 'checking' | 'unauthenticated' | 'onboarding' | 'chat' | 'error';

// Animated star field component
function StarField({ count = 60 }: { count?: number }) {
  const [stars, setStars] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    const generatedStars = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.6 + 0.2,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 8,
    }));
    setStars(generatedStars);
  }, [count]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, star.opacity, star.opacity * 0.4, star.opacity, 0],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Floating cosmic particles
function CosmicParticles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 2 === 0
              ? 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(200,200,255,0.6) 0%, transparent 70%)',
            left: `${15 + i * 14}%`,
            top: `${20 + (i % 4) * 18}%`,
          }}
          animate={{
            y: [-30, 30, -30],
            x: [-15, 15, -15],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 1.2,
          }}
        />
      ))}
    </div>
  );
}

// Beta badge with pulse animation
function BetaBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="mb-6 md:mb-8"
    >
      <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400/60 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
        </span>
        <span className="text-[10px] md:text-[11px] font-semibold tracking-[0.2em] uppercase text-white/60">
          Alpha Access
        </span>
        <span className="hidden sm:inline-block w-px h-3 bg-white/10 mx-1"></span>
        <span className="hidden sm:inline-block text-[10px] text-white/40">
          Invite Only
        </span>
      </div>
    </motion.div>
  );
}

// Main heading with character animation
function AnimatedTitle({ text }: { text: string }) {
  const characters = text.split('');

  return (
    <motion.h1
      className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-medium tracking-tight text-white mb-4 md:mb-6 font-playfair italic"
      initial="hidden"
      animate="visible"
    >
      {characters.map((char, i) => (
        <motion.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 50 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{
            duration: 0.6,
            delay: 0.1 + i * 0.03,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.h1>
  );
}

// Feature card component
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div className="relative p-5 md:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-sm transition-all duration-500 hover:bg-white/[0.04] hover:border-white/[0.12] hover:translate-y-[-2px]">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] group-hover:bg-white/[0.08] transition-colors">
            <Icon className="w-4 h-4 text-white/70" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80">
            {title}
          </h3>
        </div>
        <p className="text-[11px] md:text-xs text-white/40 leading-relaxed">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// Scroll indicator
function ScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 1 }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
    >
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Scroll</span>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronDown className="w-4 h-4 text-white/30" />
      </motion.div>
    </motion.div>
  );
}

// Testimonial/beta user section
function BetaContextSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <motion.section
      ref={containerRef}
      style={{ opacity }}
      className="relative py-24 md:py-32 px-6"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          style={{ y }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6">
              <MessageCircle className="w-3.5 h-3.5 text-white/50" />
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/50">
                Community First
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-playfair italic text-white mb-4">
              Built with Our Testers
            </h2>
            <p className="text-sm md:text-base text-white/50 leading-relaxed mb-6">
              This alpha release is exclusively available to our early community members from Reddit and Facebook. Your feedback directly shapes every feature we build.
            </p>
            <div className="flex flex-wrap gap-3">
              {['Reddit', 'Facebook', 'Discord'].map((platform) => (
                <span
                  key={platform}
                  className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/40 bg-white/[0.03] border border-white/[0.06] rounded-full"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-purple-500/10 rounded-3xl blur-3xl" />
            <div className="relative p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex -space-x-2">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-white/[0.1] border-2 border-black flex items-center justify-center"
                    >
                      <Star className="w-3.5 h-3.5 text-white/40" />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-white/60">Active Testers</p>
                  <p className="text-lg font-medium text-white">Limited Access</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '75%' }}
                    transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full bg-gradient-to-r from-amber-400/60 to-amber-400 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/40">
                  <span>Feedback Received</span>
                  <span>75%</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

// Loading state component (separate to avoid useScroll issues)
function LoadingState() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] grok relative flex items-center justify-center">
      <StarField count={30} />
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-white/30" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Loading</span>
      </div>
    </div>
  );
}

// Main content component
function HomeContent() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const [state, setState] = useState<RedirectState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-redirect signed-in, onboarded users to chat
  useEffect(() => {
    if (!isLoaded) return;

    const checkAuthAndRedirect = async () => {
      if (isSignedIn) {
        try {
          const profile = await astroShivaClient.getProfile();
          if (profile.success && profile.data?.status === 'completed') {
            // User is signed in and onboarded - redirect to chat
            router.push('/chat');
            return;
          } else if (profile.success && profile.data?.status !== 'completed') {
            // User is signed in but not onboarded - redirect to onboarding
            router.push('/onboarding');
            return;
          }
        } catch (err) {
          // If profile check fails, let them stay on landing page
          console.error('Profile check failed:', err);
        }
      }
      setIsCheckingAuth(false);
    };

    checkAuthAndRedirect();
  }, [isLoaded, isSignedIn, router]);

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return <LoadingState />;
  }

  return <LandingPageContent state={state} setState={setState} error={error} setError={setError} />;
}

// Landing page content with scroll animations
function LandingPageContent({
  state,
  setState,
  error,
  setError,
}: {
  state: RedirectState;
  setState: (state: RedirectState) => void;
  error: string | null;
  setError: (error: string | null) => void;
}) {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  const handleStart = async () => {
    if (!isSignedIn) {
      router.push('/login');
      return;
    }

    setState('checking');
    setError(null);

    try {
      const profile = await astroShivaClient.getProfile();

      if (profile.success) {
        const userStatus = profile.data?.status;

        if (userStatus === 'completed') {
          setCookie('onboarding_status', 'completed', 7);
          const redirectAfterOnboarding = getCookie('redirect_after_onboarding');
          if (redirectAfterOnboarding) {
            deleteCookie('redirect_after_onboarding');
            router.push(redirectAfterOnboarding);
            return;
          }
          router.push('/chat');
        } else {
          setCookie('onboarding_status', 'incomplete', 1);
          router.push('/onboarding');
        }
      } else if (profile.error?.code === 'USER_NOT_FOUND') {
        router.push('/onboarding');
      } else {
        setState('error');
        setError(profile.error?.message || 'Something went wrong.');
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Unable to connect.');
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[var(--bg-primary)] grok relative overflow-x-hidden">
      {/* Background Effects */}
      <StarField count={70} />
      <CosmicParticles />

      {/* Ambient gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] md:w-[800px] md:h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
          }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] md:w-[700px] md:h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Hero Section */}
      <motion.section
        style={{ y, opacity }}
        className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6"
      >
        <main className="w-full max-w-5xl mx-auto relative z-10 flex flex-col items-center text-center">
          {/* Beta Badge */}
          <BetaBadge />

          {/* Title */}
          <AnimatedTitle text="Astro Shiva" />

          {/* Subtitle with word animation */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg md:text-xl text-white/60 max-w-lg md:max-w-xl mb-8 md:mb-12 leading-relaxed font-light px-4"
          >
            The Universal Assistant. Fusing ancient Vedic wisdom with modern intelligence to illuminate your path.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xs sm:max-w-sm"
          >
            <Button
              size="lg"
              onClick={handleStart}
              disabled={state === 'checking'}
              className="w-full h-14 bg-white hover:bg-white/90 text-black border-0 rounded-2xl text-sm md:text-base font-medium group transition-all duration-300 shadow-lg shadow-white/5 hover:shadow-white/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              {state === 'checking' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">
                    {isSignedIn ? 'Enter the Void' : 'Begin Your Journey'}
                  </span>
                  <span className="sm:hidden">
                    {isSignedIn ? 'Enter' : 'Begin'}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            {state === 'error' && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-sm text-red-400/80"
              >
                {error}
              </motion.p>
            )}
          </motion.div>

          {/* Mobile hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-4 text-[10px] text-white/30"
          >
            Optimized for all devices
          </motion.p>
        </main>

        {/* Scroll Indicator - hidden on mobile */}
        <div className="hidden md:block">
          <ScrollIndicator />
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="relative px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-12 md:mb-16"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-3 block">
              What Awaits
            </span>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-playfair italic text-white/90">
              More Than Astrology
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <FeatureCard
              icon={ShieldCheck}
              title="Private Alpha"
              description="Currently in invite-only testing. Access is prioritized for our Reddit and Facebook community testers who help shape the experience."
              delay={0.1}
            />
            <FeatureCard
              icon={Globe}
              title="Universal Guide"
              description="A companion for career decisions, relationship insights, and deep spiritual inquiry. Ancient wisdom meets modern understanding."
              delay={0.2}
            />
            <FeatureCard
              icon={Zap}
              title="Your Feedback Matters"
              description="Report issues directly in the interface. Every suggestion helps us build something truly transformative."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Beta Context Section */}
      <BetaContextSection />

      {/* Footer */}
      <footer className="relative px-4 sm:px-6 py-12 md:py-16 border-t border-white/[0.06]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/40">Astro Shiva</span>
          </div>
          <p className="text-[10px] text-white/30 tracking-wider">
            &copy; 2026 &bull; Developed by the Hive Mind &bull; Alpha v0.1
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/30">Made with cosmic intention</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] grok">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-white/30" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Loading</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomeContent />
    </Suspense>
  );
}
