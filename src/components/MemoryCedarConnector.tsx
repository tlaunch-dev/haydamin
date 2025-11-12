import { motion } from 'framer-motion';
import { useState, useLayoutEffect } from 'react';
import React from 'react';

interface MemoryCedarConnectorProps {
  cardRefs: Array<React.RefObject<HTMLDivElement> | null>; // Refs to actual card elements
}

export function MemoryCedarConnector({ 
  cardRefs
}: MemoryCedarConnectorProps) {
  const [connectors, setConnectors] = useState<Array<{
    fromY: number;
    toY: number;
    fromX: number;
    toX: number;
    path: string;
    delay: number;
  }>>([]);

  // Measure actual card positions using refs
  useLayoutEffect(() => {
    const calculateConnectors = () => {
      const validRefs = cardRefs.filter(ref => ref?.current) as Array<React.RefObject<HTMLDivElement>>;
      
      if (validRefs.length < 2) {
        setConnectors([]);
        return;
      }

      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
      const isMobile = viewportWidth < 768;
      const containerElement = validRefs[0].current?.closest('.relative') as HTMLElement;
      if (!containerElement) {
        setConnectors([]);
        return;
      }
      const containerRect = containerElement.getBoundingClientRect();

      const newConnectors: Array<{
        fromY: number;
        toY: number;
        fromX: number;
        toX: number;
        path: string;
        delay: number;
      }> = [];

      // Generate connectors between consecutive cards
      for (let i = 0; i < validRefs.length - 1; i++) {
        const currentCard = validRefs[i].current;
        const nextCard = validRefs[i + 1].current;
        
        if (!currentCard || !nextCard) continue;

        const currentRect = currentCard.getBoundingClientRect();
        const nextRect = nextCard.getBoundingClientRect();

        // Convert to relative coordinates within container
        const currentBottomY = currentRect.bottom - containerRect.top;
        const nextTopY = nextRect.top - containerRect.top;
        
        let fromX: number;
        let toX: number;

        if (isMobile) {
          // Mobile: connect from bottom center to top center
          fromX = currentRect.left + currentRect.width / 2 - containerRect.left;
          toX = nextRect.left + nextRect.width / 2 - containerRect.left;
        } else {
          // Staggered: connect from inside edge to top center
          const currentCenterX = currentRect.left + currentRect.width / 2;
          const containerCenterX = containerRect.left + containerRect.width / 2;
          
          // Determine which side current card is on
          if (currentCenterX > containerCenterX) {
            // Right side card: inside edge is left side
            fromX = currentRect.left - containerRect.left;
          } else {
            // Left side card: inside edge is right side
            fromX = currentRect.right - containerRect.left;
          }
          
          // Next card: connect to top center
          toX = nextRect.left + nextRect.width / 2 - containerRect.left;
        }

        const branchStartY = currentBottomY - 8; // Space from bottom
        const branchEndY = nextTopY + 8; // Space to top

        // Create curved branch path
        const midY = (branchStartY + branchEndY) / 2;
        const branchLength = branchEndY - branchStartY;
        const curveOffset = isMobile ? 15 : 20 + (i % 3) * 5;
        
        const xDiff = toX - fromX;
        const curveDirection = xDiff > 0 ? 1 : -1;
        
        const controlX1 = fromX + curveOffset * curveDirection;
        const controlX2 = toX - (curveOffset * 0.7) * curveDirection;
        const midY1 = branchStartY + branchLength * 0.4;
        const midY2 = branchStartY + branchLength * 0.6;
        
        const path = `M ${fromX} ${branchStartY} Q ${controlX1} ${midY1} ${(fromX + toX) / 2} ${midY} Q ${controlX2} ${midY2} ${toX} ${branchEndY}`;
        
        newConnectors.push({
          fromY: branchStartY,
          toY: branchEndY,
          fromX,
          toX,
          path,
          delay: 0.3 + i * 0.1,
        });
      }
      
      setConnectors(newConnectors);
    };

    // Small delay to ensure cards are rendered
    const timer = setTimeout(() => {
      calculateConnectors();
    }, 100);

    window.addEventListener('resize', calculateConnectors);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateConnectors);
    };
  }, [cardRefs]);

  if (connectors.length === 0) {
    return null;
  }

  const smoothEase = [0.4, 0, 0.2, 1] as [number, number, number, number];

  // Get container dimensions from first card's parent
  const container = cardRefs[0]?.current?.closest('.relative');
  const containerRect = container?.getBoundingClientRect();
  const svgWidth = containerRect?.width || 800;
  const svgHeight = containerRect?.height || 1000;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ zIndex: 10 }}>
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="absolute top-0 left-0"
        style={{ overflow: 'visible' }}
      >
        {/* Cedar branch connectors between cards */}
        {connectors.map((connector, idx) => {
          // Extract path data to create secondary branches
          // Path format: M x y Q cx1 cy1 x y Q cx2 cy2 x y
          const pathParts = connector.path.match(/M ([\d.]+) ([\d.]+) Q ([\d.-]+) ([\d.]+) ([\d.]+) ([\d.]+) Q ([\d.-]+) ([\d.]+) ([\d.]+) ([\d.]+)/);
          if (!pathParts) return null;
          
          const startX = parseFloat(pathParts[1]);
          const startY = parseFloat(pathParts[2]);
          const endX = parseFloat(pathParts[9]);
          const endY = parseFloat(pathParts[10]);
          
          // Create secondary small branches for texture (like cedar tree)
          const secondaryBranches: Array<{ path: string; opacity: number }> = [];
          if (idx % 2 === 0) {
            // Add a small branch on the left side
            const branchY = startY + (endY - startY) * 0.3;
            const branchPath = `M ${startX} ${branchY} Q ${startX - 8} ${branchY + 15} ${startX - 12} ${branchY + 25}`;
            secondaryBranches.push({ path: branchPath, opacity: 0.3 });
          }
          if (idx % 3 === 0) {
            // Add a small branch on the right side
            const branchY = startY + (endY - startY) * 0.7;
            const branchPath = `M ${endX} ${branchY} Q ${endX + 8} ${branchY + 15} ${endX + 12} ${branchY + 25}`;
            secondaryBranches.push({ path: branchPath, opacity: 0.25 });
          }
          
          return (
            <g key={`connector-group-${idx}`}>
              {/* Main branch */}
              <motion.path
                d={connector.path}
                stroke="#5F8575"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{
                  pathLength: {
                    duration: 0.8,
                    ease: smoothEase,
                    delay: connector.delay,
                  },
                  opacity: {
                    duration: 0.4,
                    delay: connector.delay,
                  },
                }}
              />
              {/* Secondary branches for texture */}
              {secondaryBranches.map((branch, branchIdx) => (
                <motion.path
                  key={`branch-${idx}-${branchIdx}`}
                  d={branch.path}
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                  className="text-accent/30"
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: branch.opacity }}
                  transition={{
                    pathLength: {
                      duration: 0.5,
                      ease: smoothEase,
                      delay: connector.delay + 0.3,
                    },
                    opacity: {
                      duration: 0.3,
                      delay: connector.delay + 0.3,
                    },
                  }}
                />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

