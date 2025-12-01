'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/lib/category/model/category.model';

interface FooterProps {
  categories: Category[];
}

export function Footer({ categories }: FooterProps) {
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <Image 
              alt='shazstar logo' 
              width={120} 
              height={120} 
              src="/brand-icon.png" 
            />
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">✉</span>
                <span>info@shazastar.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">📞</span>
                <span>+971 502122464</span>
              </div>
            </div>
          </div>

          {/* Popular Categories */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
              Popular Categories
            </h3>
            <ul className="space-y-2">
              {categories.slice(0, 7).map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/category/${category.slug ?? category.id}`}
                    className="text-gray-400 hover:text-yellow-400 text-sm transition-colors flex items-center gap-1"
                  >
                    <span>›</span>
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-gray-400 hover:text-yellow-400 text-sm transition-colors flex items-center gap-1"
                >
                  <span>›</span>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-gray-400 hover:text-yellow-400 text-sm transition-colors flex items-center gap-1"
                >
                  <span>›</span>
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wide mb-4">
              Follow Us
            </h3>
            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center hover:bg-yellow-500 transition-colors"
                aria-label="Instagram"
              >
                <span className="text-black font-bold">📷</span>
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center hover:bg-yellow-500 transition-colors"
                aria-label="Facebook"
              >
                <span className="text-black font-bold">f</span>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center hover:bg-yellow-500 transition-colors"
                aria-label="YouTube"
              >
                <span className="text-black font-bold">▶</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              Copyright © 2024 Shaza Star | Developed by{' '}
              <a
                href="https://bilzmedia.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-400 hover:text-yellow-500 transition-colors"
              >
                BILZ MEDIA LLC
              </a>
            </p>
            <div className="flex gap-2">
              <div className="px-3 py-1 bg-white rounded text-xs font-semibold text-gray-800">VISA</div>
              <div className="px-3 py-1 bg-white rounded text-xs font-semibold text-gray-800">Mastercard</div>
              <div className="px-3 py-1 bg-white rounded text-xs font-semibold text-gray-800">PayPal</div>
              <div className="px-3 py-1 bg-white rounded text-xs font-semibold text-gray-800">Skrill</div>
              <div className="px-3 py-1 bg-white rounded text-xs font-semibold text-gray-800">Maestro</div>
              <div className="px-3 py-1 bg-white rounded text-xs font-semibold text-gray-800 whitespace-nowrap">Net Banking</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
