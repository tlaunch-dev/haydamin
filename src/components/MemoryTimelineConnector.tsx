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
    const cardHeight = 600;
    const gap = 48;
    const totalHeight = memoryCount * (cardHeight + gap) + 100;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const width = Math.min(viewportWidth, 1400);
    setDimensions({ width, height: totalHeight });
  }, [memoryCount]);

  if (memoryCount === 0) return null;

  const centerX = dimensions.width / 2;
  const cardHeight = 600;
  const gap = 48;

  // Generate central trunk path (vertical line down the center)
  const generateTrunkPath = () => {
    const startY = 0;
    const endY = dimensions.height - 100;
    return `M ${centerX} ${startY} L ${centerX} ${endY}`;
  };

  // Generate branches extending from trunk to cards
  const generateBranches = () => {
    const branches: Array<{ path: string; delay: number }> = [];

    // Responsive branch length
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    let branchLength: number;
    if (viewportWidth < 768) {
      branchLength = 80; // Mobile - shorter branches
    } else if (viewportWidth < 1024) {
      branchLength = 120; // Tablet - medium branches
    } else {
      branchLength = 180; // Desktop - longer branches
    }

    for (let i = 0; i < memoryCount; i++) {
      const isFeatured = i === featuredIndex;
      const isLeft = i % 2 === 0 && !isFeatured;

      // Branch starts at card middle height
      const cardTop = i * (cardHeight + gap);
      const branchY = cardTop + cardHeight / 2;

      let branchPath: string;

      if (isFeatured) {
        // Featured card: no branch (trunk goes straight through)
        continue;
      } else if (isLeft) {
        // Left branch: curves from trunk to left
        const startX = centerX;
        const endX = centerX - branchLength;
        const controlX = centerX - branchLength * 0.4;
        branchPath = `M ${startX} ${branchY} Q ${controlX} ${branchY} ${endX} ${branchY}`;
      } else {
        // Right branch: curves from trunk to right
        const startX = centerX;
        const endX = centerX + branchLength;
        const controlX = centerX + branchLength * 0.4;
        branchPath = `M ${startX} ${branchY} Q ${controlX} ${branchY} ${endX} ${branchY}`;
      }

      branches.push({
        path: branchPath,
        delay: 0.8 + i * 0.1, // Stagger branch animations after trunk
      });
    }

    return branches;
  };

  const trunkPath = generateTrunkPath();
  const branches = generateBranches();

  // Animation timing
  const TRUNK_DURATION = 1.5;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 10 }}>
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="absolute top-0 left-1/2 -translate-x-1/2"
        style={{ overflow: 'visible' }}
      >
        {/* Central trunk - vertical timeline */}
        <motion.path
          d={trunkPath}
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-accent/40"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: {
              duration: TRUNK_DURATION,
              ease: [0.4, 0, 0.2, 1],
            },
            opacity: {
              duration: 0.3,
            },
          }}
        />

        {/* Branches extending to each card */}
        {branches.map((branch, i) => (
          <motion.path
            key={i}
            d={branch.path}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-accent/50"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: {
                delay: branch.delay,
                duration: 0.4,
                ease: [0.4, 0, 0.2, 1],
              },
              opacity: {
                delay: branch.delay,
                duration: 0.2,
              },
            }}
          />
        ))}

        {/* Nodes at branch endpoints */}
        {Array.from({ length: memoryCount }).map((_, i) => {
          const isFeatured = i === featuredIndex;
          if (isFeatured) return null; // No node for featured cards

          const isLeft = i % 2 === 0;
          const cardTop = i * (cardHeight + gap);
          const nodeY = cardTop + cardHeight / 2;

          const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
          let branchLength: number;
          if (viewportWidth < 768) {
            branchLength = 80;
          } else if (viewportWidth < 1024) {
            branchLength = 120;
          } else {
            branchLength = 180;
          }

          const nodeX = isLeft ? centerX - branchLength : centerX + branchLength;

          return (
            <motion.g key={i}>
              {/* Outer circle */}
              <motion.circle
                cx={nodeX}
                cy={nodeY}
                r="8"
                className="text-accent/30"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.8 + i * 0.1 + 0.3,
                  duration: 0.3,
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
                  delay: 0.8 + i * 0.1 + 0.4,
                  duration: 0.2,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              />
            </motion.g>
          );
        })}

        {/* Trunk nodes at branch connection points */}
        {Array.from({ length: memoryCount }).map((_, i) => {
          const isFeatured = i === featuredIndex;
          if (isFeatured) return null;

          const cardTop = i * (cardHeight + gap);
          const nodeY = cardTop + cardHeight / 2;

          return (
            <motion.circle
              key={`trunk-node-${i}`}
              cx={centerX}
              cy={nodeY}
              r="5"
              className="text-accent/60"
              fill="currentColor"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.8 + i * 0.1,
                duration: 0.3,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
