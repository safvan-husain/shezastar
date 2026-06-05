import { describe, expect, it } from 'vitest';
import type { Product } from '@/lib/product/model/product.model';
import { buildProductStructuredData } from '@/lib/seo/product-structured-data';

function createProduct(overrides: Partial<Product> = {}): Product {
    return {
        id: 'prod-1',
        slug: 'dash-cam-pro',
        name: 'Dash Cam Pro',
        subtitle: null,
        description: 'High quality dash cam',
        metaTitle: null,
        metaDescription: null,
        basePrice: 1000,
        offerPercentage: 0,
        images: [{ id: 'img-1', url: 'https://cdn.example.com/p.jpg', alt: 'Product', order: 0, mappedVariants: [] }],
        variants: [],
        subCategoryIds: [],
        variantStock: [{ variantCombinationKey: 'default', stockCount: 5, price: 1000 }],
        specifications: [],
        brandId: 'brand-1',
        brand: {
            name: 'NextBase',
            imageUrl: 'https://cdn.example.com/brand.png',
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        ...overrides,
    };
}

describe('buildProductStructuredData', () => {
    it('uses discounted offer price when offerPercentage is set', () => {
        const structuredData = buildProductStructuredData(
            createProduct({ offerPercentage: 20 }),
        );

        expect(structuredData.offers.price).toBe('800.00');
        expect(structuredData.offers.priceSpecification).toEqual({
            '@type': 'UnitPriceSpecification',
            price: '1000.00',
            priceCurrency: 'AED',
            priceType: 'https://schema.org/ListPrice',
        });
    });

    it('includes brand, sku, return policy, and shipping details', () => {
        const structuredData = buildProductStructuredData(createProduct());

        expect(structuredData.sku).toBe('prod-1');
        expect(structuredData.brand).toEqual({
            '@type': 'Brand',
            name: 'NextBase',
        });
        expect(structuredData.offers.hasMerchantReturnPolicy).toMatchObject({
            '@type': 'MerchantReturnPolicy',
            merchantReturnDays: 7,
            returnPolicyUrl: 'https://shezastar.com/return-refund-policy',
        });
        expect(structuredData.offers.url).toBe('https://shezastar.com/product/dash-cam-pro');
        expect(structuredData.offers.shippingDetails).toMatchObject({
            '@type': 'OfferShippingDetails',
            shippingRate: {
                '@type': 'MonetaryAmount',
                value: '0.00',
                currency: 'AED',
            },
            shippingDestination: {
                '@type': 'DefinedRegion',
                addressCountry: 'AE',
            },
        });
    });

    it('omits brand when product has no populated brand', () => {
        const structuredData = buildProductStructuredData(
            createProduct({ brand: undefined, brandId: undefined }),
        );

        expect(structuredData.brand).toBeUndefined();
    });
});
