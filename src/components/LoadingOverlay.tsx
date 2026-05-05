/**
 * Loading Overlay Component
 * Shows a loading spinner while the app is initializing
 */

import React from 'react';
import { motion } from 'motion/react';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Animated spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-slate-200 border-t-accent rounded-full mx-auto mb-4"
        />
        
        {/* Loading text */}
        <p className="text-sm text-muted font-semibold">{message}</p>
        
        {/* Animated dots */}
        <motion.div
          className="mt-2 flex gap-1 justify-center"
          initial="hidden"
          animate="visible"
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.2,
              },
            },
          }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-accent rounded-full"
              variants={{
                hidden: { opacity: 0.3, scale: 0.8 },
                visible: {
                  opacity: 1,
                  scale: 1,
                  transition: {
                    repeat: Infinity,
                    repeatType: 'reverse',
                    duration: 0.6,
                  },
                },
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default LoadingOverlay;
