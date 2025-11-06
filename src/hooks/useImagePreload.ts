import { useEffect, useRef, useMemo } from 'react';
import { Person } from '../types';

interface UseImagePreloadOptions {
  enabled?: boolean;
}

/**
 * Hook to preload images into browser cache
 * Uses a Set to track already-preloaded URLs to avoid duplicate requests
 */
export function useImagePreload(
  urls: string[],
  options: UseImagePreloadOptions = {}
) {
  const { enabled = true } = options;
  const preloadedRef = useRef<Set<string>>(new Set());

  // Create stable reference for URLs array based on content
  // Only recreate when actual URLs change, not on every render
  const urlKey = urls.sort().join('|');
  const stableUrls = useMemo(() => urls, [urlKey]);

  useEffect(() => {
    if (!enabled || stableUrls.length === 0) return;

    // Filter out already-preloaded URLs
    const toPreload = stableUrls.filter((url) => !preloadedRef.current.has(url));

    if (toPreload.length === 0) return;

    // Preload each image by creating Image objects
    toPreload.forEach((url) => {
      const img = new Image();
      img.src = url;

      // Track successful preloads
      img.onload = () => {
        preloadedRef.current.add(url);
      };

      // Silently ignore errors (image may not exist yet)
      img.onerror = () => {
        console.warn(`Failed to preload image: ${url}`);
      };
    });
  }, [stableUrls, enabled]);
}

/**
 * Convenience hook to preload primary photos for an array of people
 */
export function usePersonImagePreload(people: Person[], enabled = true) {
  const urls = useMemo(() =>
    people
      .map((p) => p.primaryPhoto)
      .filter((photo): photo is string => !!photo),
    [people]
  );

  useImagePreload(urls, { enabled });
}
