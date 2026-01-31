"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ImageWithSkeletonProps = ImageProps & {
  /** Optional fallback image URL on error */
  fallbackSrc?: string;
};

/**
 * Wraps Next.js Image with a skeleton placeholder while loading.
 * No blur placeholder — shows a clean animated skeleton until the image loads.
 */
export function ImageWithSkeleton({
  className,
  fallbackSrc,
  onLoad,
  onError,
  ...props
}: ImageWithSkeletonProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setLoaded(true);
    onLoad?.(e);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setError(true);
    setLoaded(true); // hide skeleton so fallback or broken state shows
    onError?.(e);
  };

  const showSkeleton = !loaded && !error;
  const src = error && fallbackSrc ? fallbackSrc : props.src;
  const useFill = "fill" in props && props.fill;

  return (
    <span
      className={cn(
        "relative block overflow-hidden",
        useFill && "absolute inset-0"
      )}
    >
      {showSkeleton && (
        <Skeleton
          className="absolute inset-0 z-[1] rounded-none"
          aria-hidden
        />
      )}
      <Image
        {...props}
        src={src}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-200",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
      />
    </span>
  );
}
