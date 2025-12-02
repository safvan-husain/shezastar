'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { HeroBannerWithId } from '@/lib/app-settings/app-settings.schema';
import { PyramidText } from './PyramidText';

interface HeroCarouselProps {
  banners: HeroBannerWithId[];
}

const configuredCurrency = process.env.NEXT_PUBLIC_CURRENCY?.toUpperCase() || 'USD';

let priceFormatter: Intl.NumberFormat;
try {
  priceFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: configuredCurrency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
} catch {
  priceFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPrice(value: number) {
  return priceFormatter.format(value);
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(nextSlide, 5000); // Change slide every 5 seconds
    return () => clearInterval(interval);
  }, [banners.length, nextSlide]);

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[var(--storefront-bg-subtle)]">
      {/* Banner Image */}
      <div className="absolute inset-0 top-0">
        <Image
          src={currentBanner.imagePath}
          alt={currentBanner.title}
          fill
          priority
          unoptimized
          className="object-cover"
        />
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          {/* Offer Label */}
          <div className='flex items-center justify-center'>
            <p className="mt-4 py-1 px-3 rounded-full text-xs font-bold text-yellow-400 bg-neutral-800/70">
              {currentBanner.offerLabel}
            </p>
          </div>

          {/* Title */}
          <PyramidText 
            text={currentBanner.title}
            className="mx-auto max-w-6xl mb-6 text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl lg:text-8xl"
          />

          {/* Description */}
          <p className="mx-auto mb-8 max-w-2xl text-base text-[ #f3f4f6b7] sm:text-lg md:text-xl">
            {currentBanner.description}
          </p>

          {/* Pricing */}
          <div className="mb-8 flex justify-center items-center gap-4">
            <span className="text-lg mt-1 text-gray-300 line-through sm:text-xl">
              {formatPrice(currentBanner.price)}
            </span>
            <span className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
              {formatPrice(currentBanner.offerPrice)}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30"
            aria-label="Previous slide"
          >
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30"
            aria-label="Next slide"
          >
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all ${index === currentIndex
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/70'
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 animate-bounce">
        <svg
          className="h-6 w-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
