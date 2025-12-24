'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Product, filterImagesByVariants } from '@/lib/product/model/product.model';
import { Modal } from '@/components/ui/Modal';

interface ProductImageGalleryProps {
  product: Product;
  selectedVariantItemIds: string[];
}

export function ProductImageGallery({ product, selectedVariantItemIds }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Organize images: variant-specific first, then general images
  const allImages = product.images || [];

  const organizedImages = (() => {
    if (selectedVariantItemIds.length === 0) {
      // No variants selected, show all images in original order
      return [...allImages].sort((a, b) => a.order - b.order);
    }

    // Get variant-specific images (matching selected variants)
    const variantImages = filterImagesByVariants(allImages, selectedVariantItemIds);

    // Get general images (no variant mapping)
    const generalImages = allImages.filter(image =>
      !image.mappedVariants || image.mappedVariants.length === 0
    );

    // Get other variant images (mapped to different variants)
    const otherVariantImages = allImages.filter(image =>
      image.mappedVariants &&
      image.mappedVariants.length > 0 &&
      !variantImages.some(vi => vi.id === image.id)
    );

    // Combine: variant-specific first, then general, then other variants
    return [
      ...variantImages.sort((a, b) => a.order - b.order),
      ...generalImages.sort((a, b) => a.order - b.order),
      ...otherVariantImages.sort((a, b) => a.order - b.order)
    ];
  })();

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
          className="relative aspect-square overflow-hidden rounded-lg bg-[var(--storefront-bg-subtle)] cursor-crosshair border border-[var(--storefront-border)]"
          onMouseMove={handleMouseMove}
          onClick={() => setIsModalOpen(true)}
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

              {/* Zoom Lens - Tracks mouse position */}
              {isHovering && (
                <div
                  className="absolute border border-white/60 bg-white/10 pointer-events-none z-20 shadow-sm backdrop-blur-[1px]"
                  style={{
                    left: `${mousePos.x}%`,
                    top: `${mousePos.y}%`,
                    width: '40%',
                    height: '40%',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 0 1px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.1)'
                  }}
                />
              )}

              {/* Hover Indicator */}
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase text-white/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 z-20 shadow-lg border border-white/10">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                Click to Expand
              </div>
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

        {/* Side Zoom Modal (Floating Panel) - Outside overflow-hidden container */}
        {isHovering && primaryImage && (
          <div
            className="absolute left-[102%] top-0 w-[120%] h-full z-[100] rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] bg-white border border-gray-200 overflow-hidden hidden lg:block animate-in fade-in zoom-in-95 duration-150"
            style={{
              // Zoom Ratio = Panel Width (120%) / Lens Width (40%) = 3x magnitude
              // backgroundSize = 100% / LensWidth% = 100 / 0.4 = 250%
              backgroundImage: `url('${primaryImage.url}')`,
              backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
              backgroundSize: '250%',
              backgroundRepeat: 'no-repeat'
            }}
          />
        )}
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

      {/* Full Resolution Lightbox Zoom */}
      {isModalOpen && primaryImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsModalOpen(false)}
        >
          {/* Close Button */}
          <button
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[110] p-2 hover:bg-white/10 rounded-full"
            onClick={() => setIsModalOpen(false)}
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Navigation Controls (if multiple images) */}
          {organizedImages.length > 1 && (
            <>
              <button
                className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-[110] p-3 hover:bg-white/10 rounded-full flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev === 0 ? organizedImages.length - 1 : prev - 1));
                }}
                aria-label="Previous"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-[110] p-3 hover:bg-white/10 rounded-full flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedIndex((prev) => (prev === organizedImages.length - 1 ? 0 : prev + 1));
                }}
                aria-label="Next"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Main Image */}
          <div
            className="relative w-full h-full max-w-6xl max-h-[85vh] m-4 animate-in zoom-in-95 duration-300 pointer-events-none"
          >
            <Image
              src={primaryImage.url}
              alt={product.name}
              fill
              unoptimized
              className="object-contain"
              priority
            />
          </div>

          {/* Indicators / Thumbnail Strip */}
          <div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {organizedImages.map((image, idx) => (
              <button
                key={image.id || idx}
                onClick={() => setSelectedIndex(idx)}
                className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedIndex === idx
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
              >
                <Image
                  src={image.url}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </button>
            ))}
          </div>

          {/* Product Info Overlay */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <h2 className="text-white text-lg font-medium tracking-wide drop-shadow-md">{product.name}</h2>
            {organizedImages.length > 1 && (
              <p className="text-white/60 text-sm mt-1">{selectedIndex + 1} / {organizedImages.length}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

