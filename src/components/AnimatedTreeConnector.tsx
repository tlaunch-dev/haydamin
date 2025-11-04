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
  parentCount,
  childCount,
  containerWidth = 800,
  className = '',
}: AnimatedTreeConnectorProps) {
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
  
  const trunkVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.6, ease: smoothEase },
        opacity: { duration: 0.4 },
      },
    },
  };

  const branchVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 0.7, ease: smoothEase, delay: 0.3 },
        opacity: { duration: 0.4, delay: 0.3 },
      },
    },
  };

  const dropVariants = (index: number) => ({
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 0.6,
      transition: {
        pathLength: { duration: 0.5, ease: smoothEase, delay: 0.7 + index * 0.05 },
        opacity: { duration: 0.4, delay: 0.7 + index * 0.05 },
      },
    },
  });

  return (
    <div className={`relative flex justify-center ${className}`} style={{ height: trunkHeight + branchHeight }}>
      <svg
        className="absolute top-0 left-1/2 -translate-x-1/2"
        width={branchWidth}
        height={trunkHeight + branchHeight}
        style={{ overflow: 'visible' }}
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
          style={{
            opacity: 0.4,
          }}
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
            style={{
              opacity: 0.3,
            }}
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

