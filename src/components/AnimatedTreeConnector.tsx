import { motion } from 'framer-motion';

interface AnimatedTreeConnectorProps {
  parentCount: number;
  childCount: number;
  containerWidth?: number;
  className?: string;
}

/**
 * AnimatedTreeConnector - Draws animated SVG tree lines connecting parents to children
 * Inspired by TreeChart connector patterns with progressive path drawing
 */
export default function AnimatedTreeConnector({
  childCount,
  containerWidth = 800,
  className = '',
}: AnimatedTreeConnectorProps) {
  // parentCount is kept in the interface for future use but not currently needed
  if (childCount === 0) return null;

  // Calculate positions - responsive to container width
  const trunkHeight = 48; // Height of vertical trunk
  const branchHeight = 40; // Height of horizontal branch section
  // Use 75% of container width but cap at 600px for large screens
  const branchWidth = Math.min(containerWidth * 0.75, 600);
  
  // Calculate connector positions
  const trunkStartY = 0;
  const trunkEndY = trunkHeight;
  const branchStartX = -branchWidth / 2;
  const branchEndX = branchWidth / 2;
  const branchY = trunkEndY;
  
  // Child drop positions - evenly spaced along branch
  const childDrops: Array<{ x: number; index: number }> = [];
  if (childCount > 0) {
    const spacing = branchWidth / (childCount + 1);
    for (let i = 0; i < childCount; i++) {
      childDrops.push({
        x: branchStartX + spacing * (i + 1),
        index: i,
      });
    }
  }

  // Smooth animation variants
  const smoothEase = [0.4, 0, 0.2, 1] as [number, number, number, number];
  
  // 30% faster timing
  const trunkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.42, ease: smoothEase },
        opacity: { duration: 0.28 },
      },
    },
  };

  const branchVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.49, ease: smoothEase, delay: 0.21 },
        opacity: { duration: 0.28, delay: 0.21 },
      },
    },
  };

  const dropVariants = (index: number) => ({
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 0.6,
      transition: {
        pathLength: { duration: 0.35, ease: smoothEase, delay: 0.7 + index * 0.035 },
        opacity: { duration: 0.28, delay: 0.7 + index * 0.035 },
      },
    },
  });

  return (
    <div className={`relative flex justify-center ${className}`} style={{ height: trunkHeight + branchHeight }}>
      <svg
        className="absolute top-0 left-1/2 -translate-x-1/2 overflow-visible"
        width={branchWidth}
        height={trunkHeight + branchHeight}
        viewBox={`${-branchWidth / 2} 0 ${branchWidth} ${trunkHeight + branchHeight}`}
      >
        {/* Vertical trunk from parents */}
        <motion.path
          d={`M 0 ${trunkStartY} L 0 ${trunkEndY}`}
          stroke="#5F8575"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          variants={trunkVariants}
          initial="hidden"
          animate="visible"
          className="opacity-40"
        />

        {/* Horizontal branch line */}
        {childCount > 0 && (
          <motion.path
            d={`M ${branchStartX} ${branchY} L ${branchEndX} ${branchY}`}
            stroke="#5F8575"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            variants={branchVariants}
            initial="hidden"
            animate="visible"
            className="opacity-30"
          />
        )}

        {/* Vertical drops to each child */}
        {childDrops.map((drop) => (
          <motion.path
            key={drop.index}
            d={`M ${drop.x} ${branchY} L ${drop.x} ${branchY + branchHeight}`}
            stroke="#5F8575"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            variants={dropVariants(drop.index)}
            initial="hidden"
            animate="visible"
          />
        ))}
      </svg>
    </div>
  );
}

