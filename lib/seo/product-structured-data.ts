import type { Product } from '@/lib/product/model/product.model';
import { isProductInStock } from '@/lib/product/model/product.model';
import {
    formatStructuredDataPrice,
    getProductDefaultListPrice,
    getProductDefaultOfferPrice,
} from '@/lib/product/pricing';
import { buildCanonicalUrl, buildProductCanonicalUrl, buildStaticPagePath } from '@/lib/seo/canonical';

const UAE_COUNTRY_CODE = 'AE';

function buildMerchantReturnPolicy() {
    return {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: UAE_COUNTRY_CODE,
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
        returnPolicyUrl: buildCanonicalUrl(buildStaticPagePath('return-refund')),
    };
}

function buildShippingDetails() {
    return {
        '@type': 'OfferShippingDetails',
        shippingRate: {
            '@type': 'MonetaryAmount',
            value: formatStructuredDataPrice(0),
            currency: 'AED',
        },
        shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: UAE_COUNTRY_CODE,
        },
        deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
                '@type': 'QuantitativeValue',
                minValue: 0,
                maxValue: 1,
                unitCode: 'DAY',
            },
            transitTime: {
                '@type': 'QuantitativeValue',
                minValue: 1,
                maxValue: 2,
                unitCode: 'DAY',
            },
        },
    };
}

export function buildProductStructuredData(
    product: Product,
    options?: {
        description?: string;
        primaryImage?: string;
    },
) {
    const description =
        options?.description ??
        product.metaDescription ??
        product.subtitle ??
        `Shop ${product.name} at Sheza Star.`;
    const primaryImage = options?.primaryImage ?? product.images[0]?.url;
    const listPrice = getProductDefaultListPrice(product);
    const offerPrice = getProductDefaultOfferPrice(product);
    const hasDiscount = Boolean(product.offerPercentage && product.offerPercentage > 0);

    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description,
        sku: product.id,
        ...(primaryImage ? { image: [primaryImage] } : {}),
        ...(product.brand
            ? {
                  brand: {
                      '@type': 'Brand',
                      name: product.brand.name,
                  },
              }
            : {}),
        offers: {
            '@type': 'Offer',
            price: formatStructuredDataPrice(offerPrice),
            priceCurrency: 'AED',
            ...(hasDiscount
                ? {
                      priceSpecification: {
                          '@type': 'UnitPriceSpecification',
                          price: formatStructuredDataPrice(listPrice),
                          priceCurrency: 'AED',
                          priceType: 'https://schema.org/ListPrice',
                      },
                  }
                : {}),
            availability: isProductInStock(product)
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: buildProductCanonicalUrl(product.slug ?? product.id),
            hasMerchantReturnPolicy: buildMerchantReturnPolicy(),
            shippingDetails: buildShippingDetails(),
        },
    };
}
