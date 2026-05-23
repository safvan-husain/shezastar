import type { Product } from '@/lib/product/model/product.model';

export function applyOfferPercentage(price: number, offerPercentage?: number) {
    if (!offerPercentage || offerPercentage <= 0) {
        return price;
    }

    return price * (1 - offerPercentage / 100);
}

export function getProductDefaultListPrice(product: Pick<Product, 'basePrice' | 'variantStock'>) {
    const defaultVariant = product.variantStock.find((entry) => entry.variantCombinationKey === 'default');
    return defaultVariant?.price ?? product.basePrice;
}

export function getProductDefaultOfferPrice(product: Pick<Product, 'basePrice' | 'variantStock' | 'offerPercentage'>) {
    return applyOfferPercentage(getProductDefaultListPrice(product), product.offerPercentage);
}

export function formatStructuredDataPrice(price: number) {
    return price.toFixed(2);
}
