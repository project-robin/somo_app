'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignInButton, SignedIn, SignedOut, useAuth } from '@clerk/nextjs';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="min-h-screen flex items-center justify-center bg-black p-6 relative overflow-hidden">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-10 backdrop-blur-xl text-center">
          {/* Beta Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400/60 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-white/60">
                Alpha Access
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-white/[0.08] flex items-center justify-center group"
          >
            <Sparkles className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform duration-500" />
          </motion.div>

          <h1 className="text-3xl font-semibold text-white mb-3 font-playfair italic tracking-tight">
            Astro Shiva
          </h1>
          <p className="text-sm text-white/50 mb-8 font-light leading-relaxed">
            The Universal Assistant. Fusing ancient Vedic wisdom with modern intelligence.
          </p>

          <SignedOut>
            <SignInButton mode="modal">
              <Button className="w-full bg-white hover:bg-white/90 text-black border-0 rounded-xl h-12 text-sm font-medium transition-all duration-300 group shadow-lg shadow-white/5 hover:shadow-white/10 hover:scale-[1.02] active:scale-[0.98]">
                Begin Your Journey
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="text-center space-y-6">
              <p className="text-xs text-white/50 font-medium uppercase tracking-[0.2em]">
                Connection Active
              </p>
              <Button
                className="w-full bg-white hover:bg-white/90 text-black border-0 rounded-xl h-12 text-sm font-medium transition-all duration-300"
                onClick={() => router.push('/')}
              >
                Enter the Void
              </Button>
            </div>
          </SignedIn>

          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <p className="text-[10px] text-white/30 uppercase tracking-widest">
              Private Alpha &bull; Invite Only
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
