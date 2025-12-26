'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Product, filterImagesByVariants } from '@/lib/product/model/product.model';

interface ProductImageGalleryProps {
  product: Product;
  selectedVariantItemIds: string[];
}

export function ProductImageGallery({ product, selectedVariantItemIds }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Organize images: variant-specific first, then general images
  const allImages = product.images || [];

  const organizedImages = filterImagesByVariants(allImages, selectedVariantItemIds);

  // Reset selected index when variants change to show the variant-specific image
  useEffect(() => {
    setSelectedIndex(0);
  }, [selectedVariantItemIds]);

  const primaryImage = organizedImages[selectedIndex] || organizedImages[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="space-y-4">
      {/* Wrapper for Image and Zoom Panel - Relative for positioning content outside */}
      <div
        className="relative group"
        style={{ zIndex: isHovering ? 50 : 20 }} // Boost z-index when hovering to ensure zoom panel stays on top
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Primary Image Container - Overflow Hidden for rounded corners */}
        <div
          ref={containerRef}
          className="relative aspect-square overflow-hidden rounded-lg bg-[var(--storefront-bg-subtle)] border border-[var(--storefront-border)]"
          onMouseMove={handleMouseMove}
        >
          {primaryImage ? (
            <>
              <Image
                src={primaryImage.url}
                alt={product.name}
                fill
                unoptimized
                sizes="(max-width: 824px) 80vw, 50vw"
                className="object-cover"
                priority
              />

              {/* Inner Zoom Overlay - Visible on hover */}
              <div
                className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  backgroundImage: `url('${primaryImage.url}')`,
                  backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
                  backgroundSize: '150%', // Increased zoom (approx 30% more than previous 250%)
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[var(--storefront-text-muted)]">
              <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h18M3 19h18M5 5v14M19 5v14" />
              </svg>
              <p className="text-sm tracking-wide">No image available</p>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Grid */}
      {organizedImages && organizedImages.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {organizedImages.slice(0, 4).map((image, index) => (
            <div
              key={image.id || index}
              onClick={() => setSelectedIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-md bg-[var(--storefront-bg-subtle)] border transition cursor-pointer ${selectedIndex === index
                ? 'border-[var(--storefront-text-primary)] ring-1 ring-[var(--storefront-text-primary)]'
                : 'border-[var(--storefront-border)] hover:border-[var(--storefront-text-secondary)]'
                }`}
            >
              <Image
                src={image.url}
                alt={`${product.name} - Image ${index + 1}`}
                fill
                unoptimized
                sizes="(max-width: 1024px) 25vw, 12.5vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}


    </div>
  );
}

