'use client';

import type { Product } from '@/lib/product/model/product.model';
import { useToast } from '@/components/ui/Toast';

interface BuyNowButtonProps {
  product: Product;
  quantity: number;
  addOnPrice: number;
  selectedVariantItemIds: string[];
  disabled?: boolean;
}

export function BuyNowButton({ product, quantity, addOnPrice, selectedVariantItemIds, disabled }: BuyNowButtonProps) {
  const { showToast } = useToast();

  const handleBuyNow = async () => {
    if (disabled) return;

    const url = '/api/checkout_sessions';
    const method = 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              productId: product.id,
              quantity,
              unitPrice: (product.offerPrice ?? product.basePrice) + addOnPrice,
              selectedVariantItemIds,
            },
          ],
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body?.url) {
        showToast('Failed to start checkout', 'error', {
          status: response.status,
          body,
          url,
          method,
        });
        // eslint-disable-next-line no-console
        console.error('Failed to start checkout:', body);
        return;
      }

      window.location.href = body.url as string;
    } catch (error: any) {
      const details =
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : { message: 'Unknown error', original: error };

      showToast('Error during buy now', 'error', {
        body: details,
        url,
        method,
      });
      // eslint-disable-next-line no-console
      console.error('Error during buy now:', error);
    }
  };

  return (
    <button
      type="button"
      className="w-full py-3 px-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
      disabled={disabled}
      onClick={handleBuyNow}
      aria-label={`Buy ${product.name} now`}
    >
      Buy Now
    </button>
  );
}
