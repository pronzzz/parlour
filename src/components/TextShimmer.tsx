// Adapted from motion-primitives "Text Shimmer" by ibelick (MIT), as listed on 21st.dev.
// Swapped the `cn` helper and zinc colours for Parlour's tokens.
import { motion } from 'motion/react';
import type { CSSProperties } from 'react';

export function TextShimmer({ children, className = '', duration = 2.2 }: { children: string; className?: string; duration?: number }) {
  return (
    <motion.span
      className={`relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent [background-repeat:no-repeat,padding-box] ${className}`}
      initial={{ backgroundPosition: '100% center' }}
      animate={{ backgroundPosition: '0% center' }}
      transition={{ repeat: Infinity, duration, ease: 'linear' }}
      style={
        {
          '--spread': `${children.length * 2}px`,
          backgroundImage:
            'linear-gradient(90deg, #0000 calc(50% - var(--spread)), var(--ink), #0000 calc(50% + var(--spread))), linear-gradient(var(--mute), var(--mute))',
        } as CSSProperties
      }
    >
      {children}
    </motion.span>
  );
}
