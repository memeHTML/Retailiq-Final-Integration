/**
 * src/components/ui/SkeletonLoader.tsx
 * Oracle Document sections consumed: 7, 9, 10
 * Last item from Section 11 risks addressed here: Mixed response envelopes
 */
interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rect' | 'circle';
}

export function SkeletonLoader({ width = '100%', height = '1rem', variant = 'text' }: SkeletonLoaderProps) {
  return (
    <div
      className={`skeleton skeleton--${variant}`}
      aria-hidden="true"
      style={{ width, height }}
    />
  );
}
