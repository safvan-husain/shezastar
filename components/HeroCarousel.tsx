'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import type { HeroBannerWithId } from '@/lib/app-settings/app-settings.schema';
import { PyramidText } from './PyramidText';

interface HeroCarouselProps {
  banners: HeroBannerWithId[];
}

function formatPrice(value: number) {
  return `AED ${value.toFixed(2)}`;
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
  const hasMultipleSlides = banners.length > 1;
  const priceDetails = (
    <>
      <span className="text-lg mt-1 text-gray-300 line-through sm:text-xl">
        {formatPrice(currentBanner.price)}
      </span>
      <span className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
        {formatPrice(currentBanner.offerPrice)}
      </span>
    </>
  );

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
            className="mx-auto max-w-6xl mb-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-7xl"
          />

          {/* Description */}
          <p className="mx-auto mb-8 max-w-2xl text-base text-[#f3f4f6b7] md:text-lg lg:text-xl">
            {currentBanner.description}
          </p>

          {/* Pricing */}
          <div className="mb-8 flex flex-col items-center gap-4">
            <div className="hidden sm:flex justify-center items-center gap-4">
              {priceDetails}
            </div>
            <div className="flex flex-col items-center gap-4 sm:hidden">
              {hasMultipleSlides ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={prevSlide}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30"
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
                  <div className="flex flex-col items-center gap-2">
                    {priceDetails}
                  </div>
                  <button
                    type="button"
                    onClick={nextSlide}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30"
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
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">{priceDetails}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {hasMultipleSlides && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            className="hidden sm:flex absolute left-4 top-1/2 z-20 h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30"
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
            type="button"
            onClick={nextSlide}
            className="hidden sm:flex absolute right-4 top-1/2 z-20 h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition hover:bg-white/30"
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
      {hasMultipleSlides && (
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
