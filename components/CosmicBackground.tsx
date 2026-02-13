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

interface CosmicBackgroundProps {
  /** Number of stars to render (default: 60) */
  starCount?: number;
  /** Enable floating particles (default: true) */
  enableParticles?: boolean;
  /** Enable ambient gradient orbs (default: true) */
  enableOrbs?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * StarField - Animated twinkling stars background
 */
function StarField({ count = 60 }: { count?: number }) {
  const [stars, setStars] = useState<Star[]>([]);

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

/**
 * CosmicParticles - Floating cosmic particles effect
 */
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

/**
 * AmbientOrbs - Gradient orbs for ambient lighting effect
 */
function AmbientOrbs() {
  return (
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
  );
}

/**
 * CosmicBackground - Complete cosmic background with stars, particles, and orbs
 *
 * Features:
 * - Twinkling stars with random positions and sizes
 * - Subtle floating particles
 * - Animated gradient orbs (purple and amber)
 * - Pure black background
 */
export function CosmicBackground({
  starCount = 60,
  enableParticles = true,
  enableOrbs = true,
  className = '',
}: CosmicBackgroundProps) {
  return (
    <div className={`fixed inset-0 bg-black ${className}`}>
      <StarField count={starCount} />
      {enableParticles && <CosmicParticles />}
      {enableOrbs && <AmbientOrbs />}
    </div>
  );
}

export { StarField, CosmicParticles, AmbientOrbs };
