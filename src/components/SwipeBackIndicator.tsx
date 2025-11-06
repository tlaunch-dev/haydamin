import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

interface SwipeBackIndicatorProps {
  isSwipping: boolean;
  progress: number;
}

const SwipeBackIndicator = ({ isSwipping, progress }: SwipeBackIndicatorProps) => {
  return (
    <AnimatePresence>
      {isSwipping && (
        <>
          {/* Overlay - fades in as user swipes */}
          <motion.div
            className="fixed inset-0 bg-black pointer-events-none z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: progress * 0.2 }}
            exit={{ opacity: 0 }}
          />

          {/* Arrow indicator */}
          <motion.div
            className="fixed left-4 top-1/2 -translate-y-1/2 pointer-events-none z-50"
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: Math.min(progress * 2, 1),
              x: progress * 30 - 20,
            }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="w-12 h-12 rounded-full bg-accent/90 backdrop-blur-md shadow-xl flex items-center justify-center">
              <ChevronLeft className="w-7 h-7 text-accent-text" strokeWidth={3} />
            </div>
          </motion.div>

          {/* Preview of previous page - slides in from left */}
          <motion.div
            className="fixed inset-0 bg-background pointer-events-none z-40"
            initial={{ x: '-100%' }}
            animate={{ x: `${-100 + progress * 30}%` }}
            exit={{ x: '-100%' }}
            style={{
              boxShadow: '2px 0 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-accent/50 text-lg font-light">
                {progress >= 0.5 ? 'Release to go back' : 'Swipe to go back'}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SwipeBackIndicator;
