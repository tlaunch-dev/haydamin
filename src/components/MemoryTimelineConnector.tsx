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
    // Adjusted to match actual card sizes (smaller now)
    const cardHeight = 400; // Reduced from 600
    const gap = 32; // space-y-8 = 2rem = 32px
    const totalHeight = memoryCount * (cardHeight + gap) + 100;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const width = Math.min(viewportWidth, 1400);
    setDimensions({ width, height: totalHeight });
  }, [memoryCount]);

  if (memoryCount === 0) return null;

  const centerX = dimensions.width / 2;
  const cardHeight = 400; // Match the actual smaller card height
  const gap = 32; // Match space-y-8

  // Generate central trunk path (vertical line down the center)
  const generateTrunkPath = () => {
    const startY = 0;
    const endY = dimensions.height - 100;
    return `M ${centerX} ${startY} L ${centerX} ${endY}`;
  };

  // Get responsive branch length - shorter so nodes stay visible
  const getBranchLength = () => {
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    if (viewportWidth < 768) {
      return 60; // Mobile - very short branches
    } else if (viewportWidth < 1024) {
      return 80; // Tablet - short branches
    } else {
      return 100; // Desktop - medium branches (not too long)
    }
  };

  const branchLength = getBranchLength();

  // Generate branches extending from trunk toward cards
  // Branches stop before reaching cards so nodes are visible in gaps
  const generateBranches = () => {
    const branches: Array<{
      path: string;
      delay: number;
      isLeft: boolean;
      y: number;
    }> = [];

    for (let i = 0; i < memoryCount; i++) {
      const isFeatured = i === featuredIndex;

      // Featured card: no branch (trunk goes straight through)
      if (isFeatured) {
        continue;
      }

      const isLeft = i % 2 === 0;

      // Position branch in the gap ABOVE each card
      const cardTop = i * (cardHeight + gap);
      const branchY = cardTop - gap / 2; // Position in middle of gap above card

      let branchPath: string;

      if (isLeft) {
        // Left branch: curves from trunk to left
        const startX = centerX;
        const endX = centerX - branchLength;
        const controlX = centerX - branchLength * 0.6;
        branchPath = `M ${startX} ${branchY} Q ${controlX} ${branchY} ${endX} ${branchY}`;
      } else {
        // Right branch: curves from trunk to right
        const startX = centerX;
        const endX = centerX + branchLength;
        const controlX = centerX + branchLength * 0.6;
        branchPath = `M ${startX} ${branchY} Q ${controlX} ${branchY} ${endX} ${branchY}`;
      }

      branches.push({
        path: branchPath,
        delay: 1.5 + i * 0.15, // Stagger branch animations after trunk (which is 1.5s)
        isLeft,
        y: branchY,
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
        {branches.map((branch, idx) => (
          <motion.path
            key={`branch-${idx}`}
            d={branch.path}
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-accent/60"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: {
                delay: branch.delay,
                duration: 0.5,
                ease: [0.4, 0, 0.2, 1],
              },
              opacity: {
                delay: branch.delay,
                duration: 0.3,
              },
            }}
          />
        ))}

        {/* Trunk nodes at branch connection points */}
        {branches.map((branch, idx) => (
          <motion.circle
            key={`trunk-node-${idx}`}
            cx={centerX}
            cy={branch.y}
            r="6"
            className="text-accent/70"
            fill="currentColor"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: branch.delay,
              duration: 0.3,
              ease: [0.34, 1.56, 0.64, 1],
            }}
          />
        ))}

        {/* Nodes at branch endpoints (the "leaves") */}
        {branches.map((branch, idx) => {
          const nodeX = branch.isLeft ? centerX - branchLength : centerX + branchLength;
          const nodeY = branch.y;

          return (
            <motion.g key={`leaf-${idx}`}>
              {/* Outer circle */}
              <motion.circle
                cx={nodeX}
                cy={nodeY}
                r="10"
                className="text-accent/40"
                fill="currentColor"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: branch.delay + 0.4,
                  duration: 0.3,
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
                  delay: branch.delay + 0.5,
                  duration: 0.2,
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
