'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ThinkingBubbleProps {
  modelName?: string;
}

export function ThinkingBubble({ modelName }: ThinkingBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-2.5"
    >
      <div className="flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              opacity: [0.3, 1, 0.3],
              scale: [0.85, 1, 0.85],
              y: [0, -2, 0],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
            className="w-2 h-2 rounded-full bg-gradient-to-t from-[var(--accent-warm)] to-[var(--accent-warm-soft)]"
          />
        ))}
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-xs text-[var(--text-tertiary)] font-medium tracking-wide"
      >
        {modelName ? `${modelName} thinking` : 'Thinking'}
      </motion.span>
    </motion.div>
  );
}
