import { useState, useEffect } from 'react';

/**
 * Hook to calculate responsive width values for memory cards
 * Handles expanded, featured, and alternating layout patterns
 */
export const useResponsiveWidth = (
  isExpanded: boolean,
  isFeatured: boolean,
  index: number,
  nonFeaturedIndex?: number
) => {
  // Calculate initial values immediately to prevent flashing
  const getInitialValues = () => {
    if (typeof window === 'undefined') {
      return { width: '100%', maxWidth: '100%', marginLeft: 'auto', marginLeftPx: null };
    }

    const viewportWidth = window.innerWidth;

    if (isExpanded) {
      // Expanded state
      let expandedWidth: string;
      let expandedMaxWidth: string;

      if (viewportWidth >= 1536) {
        expandedWidth = '80%';
        expandedMaxWidth = '56rem';
      } else if (viewportWidth >= 1280) {
        expandedWidth = '85%';
        expandedMaxWidth = '64rem';
      } else if (viewportWidth >= 1024) {
        expandedWidth = '90%';
        expandedMaxWidth = '72rem';
      } else if (viewportWidth >= 768) {
        expandedWidth = '95%';
        expandedMaxWidth = '64rem';
      } else {
        expandedWidth = '100%';
        expandedMaxWidth = '100%';
      }

      // Always use pixel values for marginLeft to allow smooth animation (never 'auto')
      const containerMaxWidth = viewportWidth >= 1280 ? 1024 : Math.min(viewportWidth * 0.9, 1024);
      const widthValue = expandedWidth.includes('%')
        ? (viewportWidth * parseFloat(expandedWidth) / 100)
        : parseFloat(expandedWidth.replace('rem', '')) * 16;
      const actualWidth = Math.min(widthValue, parseFloat(expandedMaxWidth.replace('rem', '')) * 16);
      const centerMargin = Math.max(0, (containerMaxWidth - actualWidth) / 2); // Ensure non-negative

      return { width: expandedWidth, maxWidth: expandedMaxWidth, marginLeft: '0', marginLeftPx: centerMargin };
    } else if (isFeatured) {
      // Featured collapsed - always use pixel values for marginLeft to allow smooth animation
      const containerMaxWidth = viewportWidth >= 1280 ? 1024 : Math.min(viewportWidth * 0.9, 1024);
      const featuredMaxWidth = viewportWidth < 768
        ? Math.min(viewportWidth - 24, 672) // Mobile: respect viewport, max 42rem
        : 42 * 16; // Tablet+: 42rem in pixels
      const centerMargin = Math.max(0, (containerMaxWidth - featuredMaxWidth) / 2); // Ensure non-negative
      return {
        width: '100%',
        maxWidth: viewportWidth < 768 ? `${featuredMaxWidth}px` : '42rem',
        marginLeft: '0',
        marginLeftPx: centerMargin
      };
    } else {
      // Non-featured collapsed
      let collapsedWidth: string;
      let collapsedMaxWidth: string;

      if (viewportWidth >= 1536) {
        collapsedWidth = '33.333333%';
        collapsedMaxWidth = '28rem';
      } else if (viewportWidth >= 1280) {
        collapsedWidth = '40%';
        collapsedMaxWidth = '32rem';
      } else if (viewportWidth >= 1024) {
        collapsedWidth = '50%';
        collapsedMaxWidth = '36rem';
      } else if (viewportWidth >= 768) {
        collapsedWidth = '66.666667%';
        collapsedMaxWidth = '32rem';
      } else {
        collapsedWidth = '100%';
        collapsedMaxWidth = '100%';
      }

      const alternatingIndex = nonFeaturedIndex !== undefined ? nonFeaturedIndex : index;
      let marginLeftPx: number | null = null;

      if (viewportWidth >= 768 && alternatingIndex % 2 === 1) {
        const containerMaxWidth = viewportWidth >= 1280 ? 1024 : Math.min(viewportWidth * 0.9, 1024);
        const widthValue = collapsedWidth.includes('%')
          ? (viewportWidth * parseFloat(collapsedWidth) / 100)
          : parseFloat(collapsedWidth.replace('rem', '')) * 16;
        const actualWidth = Math.min(widthValue, parseFloat(collapsedMaxWidth.replace('rem', '')) * 16);
        marginLeftPx = containerMaxWidth - actualWidth;
      }

      return {
        width: collapsedWidth,
        maxWidth: collapsedMaxWidth,
        marginLeft: marginLeftPx !== null ? '0' : '0',
        marginLeftPx: marginLeftPx !== null ? marginLeftPx : 0
      };
    }
  };

  const initialValues = getInitialValues();
  const [width, setWidth] = useState<string>(initialValues.width);
  const [maxWidth, setMaxWidth] = useState<string>(initialValues.maxWidth);
  const [marginLeft, setMarginLeft] = useState<string>(initialValues.marginLeft);
  const [marginLeftPx, setMarginLeftPx] = useState<number | null>(initialValues.marginLeftPx);

  useEffect(() => {
    const updateWidth = () => {
      const viewportWidth = window.innerWidth;

      if (isExpanded) {
        // Expanded state - almost full width, always centered (applies to both featured and non-featured)
        let expandedWidth: string;
        let expandedMaxWidth: string;

        if (viewportWidth >= 1536) {
          expandedWidth = '80%';
          expandedMaxWidth = '56rem'; // max-w-4xl
        } else if (viewportWidth >= 1280) {
          expandedWidth = '85%';
          expandedMaxWidth = '64rem'; // max-w-5xl
        } else if (viewportWidth >= 1024) {
          expandedWidth = '90%';
          expandedMaxWidth = '72rem'; // max-w-6xl
        } else if (viewportWidth >= 768) {
          expandedWidth = '95%';
          expandedMaxWidth = '64rem'; // max-w-5xl
        } else {
          expandedWidth = '100%';
          expandedMaxWidth = '100%';
        }

        setWidth(expandedWidth);
        setMaxWidth(expandedMaxWidth);

        // Calculate center position for smooth animation (always use pixel values, never 'auto')
        // Get container width (assuming max-w-5xl = 64rem = 1024px or use viewport)
        const containerMaxWidth = viewportWidth >= 1280 ? 1024 : Math.min(viewportWidth * 0.9, 1024);
        const widthValue = expandedWidth.includes('%')
          ? (viewportWidth * parseFloat(expandedWidth) / 100)
          : parseFloat(expandedWidth.replace('rem', '')) * 16;
        const actualWidth = Math.min(widthValue, parseFloat(expandedMaxWidth.replace('rem', '')) * 16);
        const centerMargin = Math.max(0, (containerMaxWidth - actualWidth) / 2); // Ensure non-negative
        setMarginLeftPx(centerMargin);
        setMarginLeft('0'); // Use pixel value for animation
      } else if (isFeatured) {
        // Featured card collapsed state
        setWidth('100%');
        setMaxWidth('42rem'); // max-w-2xl
        // Featured cards are always centered
        // Always use pixel values for marginLeft to allow smooth animation (never 'auto')
        const containerMaxWidth = viewportWidth >= 1280 ? 1024 : Math.min(viewportWidth * 0.9, 1024);
        const featuredMaxWidth = viewportWidth < 768
          ? Math.min(viewportWidth - 24, 672) // Mobile: respect viewport, max 42rem
          : 42 * 16; // Tablet+: 42rem in pixels
        setMaxWidth(viewportWidth < 768 ? `${featuredMaxWidth}px` : '42rem');
        const centerMargin = Math.max(0, (containerMaxWidth - featuredMaxWidth) / 2); // Ensure non-negative
        setMarginLeftPx(centerMargin);
        setMarginLeft('0'); // Use pixel value for animation
      } else {
        // Collapsed state - alternating widths
        if (viewportWidth >= 1536) {
          setWidth('33.333333%'); // w-1/3
          setMaxWidth('28rem'); // max-w-md
        } else if (viewportWidth >= 1280) {
          setWidth('40%'); // w-2/5
          setMaxWidth('32rem'); // max-w-lg
        } else if (viewportWidth >= 1024) {
          setWidth('50%'); // w-1/2
          setMaxWidth('36rem'); // max-w-xl
        } else if (viewportWidth >= 768) {
          setWidth('66.666667%'); // w-2/3
          setMaxWidth('32rem'); // max-w-lg
        } else {
          setWidth('100%');
          setMaxWidth('100%');
        }
        // Set margin for alternating pattern (only on tablet+)
        // Use nonFeaturedIndex if provided (for proper alternating), otherwise fall back to index
        const alternatingIndex = nonFeaturedIndex !== undefined ? nonFeaturedIndex : index;
        if (viewportWidth >= 768 && alternatingIndex % 2 === 1) {
          // Right side - calculate margin to push to right
          let collapsedWidth: string;
          if (viewportWidth >= 1536) {
            collapsedWidth = '33.333333%';
          } else if (viewportWidth >= 1280) {
            collapsedWidth = '40%';
          } else if (viewportWidth >= 1024) {
            collapsedWidth = '50%';
          } else {
            collapsedWidth = '66.666667%';
          }

          const containerMaxWidth = viewportWidth >= 1280 ? 1024 : Math.min(viewportWidth * 0.9, 1024);
          const widthValue = collapsedWidth.includes('%')
            ? (viewportWidth * parseFloat(collapsedWidth) / 100)
            : parseFloat(collapsedWidth.replace('rem', '')) * 16;
          const actualWidth = Math.min(widthValue, parseFloat(maxWidth.replace('rem', '')) * 16);
          const rightMargin = containerMaxWidth - actualWidth;
          setMarginLeftPx(rightMargin);
          setMarginLeft('0'); // Use pixel value
        } else {
          setMarginLeft('0');
          setMarginLeftPx(0);
        }
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [isExpanded, isFeatured, index, nonFeaturedIndex]);

  return { width, maxWidth, marginLeft, marginLeftPx };
};

