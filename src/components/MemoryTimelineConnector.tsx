import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface MemoryTimelineConnectorProps {
  memoryCount: number;
  featuredIndex?: number; // Which memory is featured (full width)
}

export function MemoryTimelineConnector({ memoryCount, featuredIndex = 0 }: MemoryTimelineConnectorProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Calculate dimensions based on memory count
    // Each memory card is ~600px tall with 48px gap (space-y-12)
    const cardHeight = 600;
    const gap = 48;
    const totalHeight = memoryCount * (cardHeight + gap);
    setDimensions({ width: 1200, height: totalHeight });
  }, [memoryCount]);

  if (memoryCount === 0) return null;

  // Generate organic path that flows between cards
  const generateVinePath = () => {
    const paths: string[] = [];
    const centerX = dimensions.width / 2;
    const cardHeight = 600;
    const gap = 48;
    const sectionHeight = cardHeight + gap;

    // Starting point at the top center
    let currentX = centerX;
    let currentY = 50;
    paths.push(`M ${currentX} ${currentY}`);

    for (let i = 0; i < memoryCount; i++) {
      const isFeatured = i === featuredIndex;
      const isLeft = i % 2 === 0 && !isFeatured;

      // Target position for this card
      const targetY = currentY + sectionHeight;
      let targetX: number;

      if (isFeatured) {
        // Featured card: stay centered
        targetX = centerX;
      } else if (isLeft) {
        // Left side card
        targetX = centerX - 300;
      } else {
        // Right side card
        targetX = centerX + 300;
      }

      // Create organic bezier curve to connect
      const controlPoint1X = currentX;
      const controlPoint1Y = currentY + sectionHeight * 0.3;
      const controlPoint2X = targetX;
      const controlPoint2Y = currentY + sectionHeight * 0.7;

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
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
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
          strokeWidth="3"
          fill="none"
          className="text-accent/30"
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
          const sectionHeight = cardHeight + gap;

          const centerX = dimensions.width / 2;
          let nodeX: number;
          const nodeY = 50 + (i + 1) * sectionHeight;

          if (isFeatured) {
            nodeX = centerX;
          } else if (isLeft) {
            nodeX = centerX - 300;
          } else {
            nodeX = centerX + 300;
          }

          return (
            <motion.g key={i}>
              {/* Outer circle */}
              <motion.circle
                cx={nodeX}
                cy={nodeY}
                r="8"
                className="text-accent/20"
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
                r="4"
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
