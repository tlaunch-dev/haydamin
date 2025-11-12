import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MemoryTimelineConnectorProps {
  memoryCount: number;
  featuredIndex?: number; // Which memory is featured (full width)
}

// Helper functions for responsive sizing
const getCardHeight = (viewportWidth: number): number => {
  if (viewportWidth >= 1536) return 280; // 2xl - very compact
  if (viewportWidth >= 1280) return 320; // xl - compact
  if (viewportWidth >= 1024) return 380; // lg - iPad landscape
  if (viewportWidth >= 768) return 360; // md - iPad portrait
  return 300; // Mobile default
};

const getGap = (viewportWidth: number): number => {
  if (viewportWidth >= 1024) return 20; // lg:space-y-5 = 1.25rem = 20px
  if (viewportWidth >= 768) return 16; // md:space-y-4 = 1rem = 16px
  return 12; // space-y-3 = 0.75rem = 12px (mobile)
};

export function MemoryTimelineConnector({ memoryCount, featuredIndex = -1 }: MemoryTimelineConnectorProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const calculateDimensions = () => {
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const cardHeight = getCardHeight(viewportWidth);
      const gap = getGap(viewportWidth);
      const totalHeight = memoryCount * (cardHeight + gap) + 100;
      const width = Math.min(viewportWidth, 1400);
      setDimensions({ width, height: totalHeight });
    };
    
    // Initial calculation
    calculateDimensions();
    
    // Recalculate on resize
    window.addEventListener('resize', calculateDimensions);
    return () => window.removeEventListener('resize', calculateDimensions);
  }, [memoryCount]);

  if (memoryCount === 0) return null;

  const centerX = dimensions.width / 2;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const cardHeight = getCardHeight(viewportWidth);
  const gap = getGap(viewportWidth);

  // Generate simple vertical line path behind cards
  const generateLinePath = () => {
    const startY = 0;
    const endY = dimensions.height - 100;
    return `M ${centerX} ${startY} L ${centerX} ${endY}`;
  };

  // Generate node positions at the top of each card (after the featured one)
  const generateNodes = () => {
    const nodes: Array<{ y: number; delay: number }> = [];
    
    // Determine the index to start from (after featured card)
    const startIndex = featuredIndex >= 0 ? featuredIndex + 1 : 1;
    
    for (let i = startIndex; i < memoryCount; i++) {
      // Position node at the top of each card
      // Calculate cumulative height up to this card
      let cumulativeHeight = 0;
      for (let j = 0; j < i; j++) {
        cumulativeHeight += cardHeight + gap;
      }
      
      // Node position is at the top of the card
      const nodeY = cumulativeHeight;
      
      nodes.push({
        y: nodeY,
        delay: 0.5 + (i - startIndex) * 0.1, // Stagger node animations
      });
    }
    
    return nodes;
  };

  const linePath = generateLinePath();
  const nodes = generateNodes();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 1 }}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{ overflow: 'visible' }}
      >
        {/* Simple vertical line behind cards */}
        <motion.path
          d={linePath}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-accent/30"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: {
              duration: 1,
              ease: [0.4, 0, 0.2, 1],
            },
            opacity: {
              duration: 0.3,
            },
          }}
        />

        {/* Nodes at the top of each card (after the featured one) */}
        {nodes.map((node, idx) => (
          <motion.circle
            key={`node-${idx}`}
            cx={centerX}
            cy={node.y}
            r="6"
            className="text-accent/70"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: node.delay,
              duration: 0.3,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          />
        ))}
      </svg>
    </div>
  );
}
