'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

interface CelestialBackgroundProps {
  /** Number of stars to render (default: 50) */
  starCount?: number;
  /** Enable floating particles (default: true) */
  enableParticles?: boolean;
  /** Enable gradient animation (default: true) */
  animateGradient?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * CelestialBackground - Animated cosmic background with stars and particles
 *
 * Features:
 * - Twinkling stars with random positions and sizes
 * - Subtle floating particles
 * - Animated gradient background
 * - Respects prefers-reduced-motion
 */
export function CelestialBackground({
  starCount = 50,
  enableParticles = true,
  animateGradient = true,
  className = '',
}: CelestialBackgroundProps) {
  const [stars, setStars] = useState<Star[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Generate random stars
    const generatedStars: Star[] = Array.from({ length: starCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 5,
    }));
    setStars(generatedStars);
  }, [starCount]);

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Base gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#1a1a2e] to-[#16213e] ${
          animateGradient && !reducedMotion ? 'animate-gradient' : ''
        }`}
        style={{
          backgroundSize: animateGradient ? '200% 200%' : '100% 100%',
        }}
      />

      {/* Subtle nebula effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 20% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
        }}
      />

      {/* Stars */}
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
          initial={{ opacity: star.opacity }}
          animate={
            reducedMotion
              ? { opacity: star.opacity }
              : {
                  opacity: [star.opacity, star.opacity * 0.3, star.opacity],
                }
          }
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Floating particles */}
      {enableParticles && !reducedMotion && (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute w-1 h-1 rounded-full bg-[var(--celestial-gold)] opacity-40"
              style={{
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [-20, 20, -20],
                x: [-10, 10, -10],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 1.5,
              }}
            />
          ))}
        </>
      )}

      {/* Subtle glow orbs */}
      {!reducedMotion && (
        <>
          <motion.div
            className="absolute w-96 h-96 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
              left: '-10%',
              top: '20%',
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute w-80 h-80 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, transparent 70%)',
              right: '-5%',
              bottom: '10%',
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 3,
            }}
          />
        </>
      )}
    </div>
  );
}

/**
 * Simple gradient background without animations (for performance)
 */
export function StaticCelestialBackground({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{
        background:
          'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    >
      {/* Static nebula effect */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            'radial-gradient(ellipse at 20% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(245, 158, 11, 0.1) 0%, transparent 50%)',
        }}
      />
    </div>
  );
}
