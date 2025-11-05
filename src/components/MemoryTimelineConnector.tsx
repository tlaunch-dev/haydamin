import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MemoryTimelineConnectorProps {
  memoryCount: number;
  featuredIndex?: number; // Which memory is featured (full width)
}

export function MemoryTimelineConnector({ memoryCount, featuredIndex = -1 }: MemoryTimelineConnectorProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Calculate dimensions based on memory count
    // Each memory card is ~600px tall with 48px gap (space-y-12)
    const cardHeight = 600;
    const gap = 48;
    const totalHeight = memoryCount * (cardHeight + gap) + 200; // Extra padding
    // Responsive width based on viewport
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const width = Math.min(viewportWidth, 1400);
    setDimensions({ width, height: totalHeight });
  }, [memoryCount]);

  if (memoryCount === 0) return null;

  // Generate organic path that flows in the gaps between cards
  const generateVinePath = () => {
    const paths: string[] = [];
    const centerX = dimensions.width / 2;
    const cardHeight = 600;
    const gap = 48;

    // Responsive offset based on screen width
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    let horizontalOffset: number;
    if (viewportWidth < 768) {
      horizontalOffset = 150; // Mobile - smaller offset
    } else if (viewportWidth < 1024) {
      horizontalOffset = 250; // Tablet/iPad - medium offset
    } else {
      horizontalOffset = 350; // Desktop - larger offset
    }

    // Starting point - top of first card
    let currentX = centerX;
    let currentY = -50;
    paths.push(`M ${currentX} ${currentY}`);

    for (let i = 0; i < memoryCount; i++) {
      const isFeatured = i === featuredIndex;
      const isLeft = i % 2 === 0 && !isFeatured;

      // Calculate positions - connect through gaps between cards
      const cardTop = i * (cardHeight + gap);
      const cardBottom = cardTop + cardHeight;

      // Target Y is the gap before this card (or start for first card)
      const targetY = i === 0 ? cardTop - 25 : cardTop - gap / 2;

      // Target X based on card position
      let targetX: number;
      if (isFeatured) {
        targetX = centerX;
      } else if (isLeft) {
        targetX = centerX - horizontalOffset; // Offset to left of left cards
      } else {
        targetX = centerX + horizontalOffset; // Offset to right of right cards
      }

      // Create organic bezier curve to the gap
      const controlPoint1X = currentX;
      const controlPoint1Y = currentY + (targetY - currentY) * 0.4;
      const controlPoint2X = targetX;
      const controlPoint2Y = currentY + (targetY - currentY) * 0.6;

      paths.push(
        `C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`
      );

      currentX = targetX;
      currentY = targetY;
    }

    return paths.join(' ');
  };

  const vinePath = generateVinePath();

  // Animation timing
  const VINE_DURATION = 2.5;
  const NODE_DELAY = 0.3;
  const NODE_STAGGER = 0.15;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 10 }}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{ overflow: 'visible' }}
      >
        {/* Main vine path */}
        <motion.path
          d={vinePath}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-accent/50"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: {
              duration: VINE_DURATION,
              ease: [0.4, 0, 0.2, 1],
            },
            opacity: {
              duration: 0.3,
            },
          }}
        />

        {/* Decorative nodes at connection points */}
        {Array.from({ length: memoryCount }).map((_, i) => {
          const isFeatured = i === featuredIndex;
          const isLeft = i % 2 === 0 && !isFeatured;
          const cardHeight = 600;
          const gap = 48;

          // Responsive offset (same as vine path)
          const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
          let horizontalOffset: number;
          if (viewportWidth < 768) {
            horizontalOffset = 150;
          } else if (viewportWidth < 1024) {
            horizontalOffset = 250;
          } else {
            horizontalOffset = 350;
          }

          const centerX = dimensions.width / 2;
          let nodeX: number;
          const cardTop = i * (cardHeight + gap);
          // Position nodes in the gap between cards, not at card center
          const nodeY = i === 0 ? cardTop - 25 : cardTop - gap / 2;

          if (isFeatured) {
            nodeX = centerX;
          } else if (isLeft) {
            nodeX = centerX - horizontalOffset;
          } else {
            nodeX = centerX + horizontalOffset;
          }

          return (
            <motion.g key={i}>
              {/* Outer circle */}
              <motion.circle
                cx={nodeX}
                cy={nodeY}
                r="10"
                className="text-accent/30"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: NODE_DELAY + i * NODE_STAGGER,
                  duration: 0.4,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              />
              {/* Inner circle */}
              <motion.circle
                cx={nodeX}
                cy={nodeY}
                r="5"
                className="text-accent"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: NODE_DELAY + i * NODE_STAGGER + 0.1,
                  duration: 0.3,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              />
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
