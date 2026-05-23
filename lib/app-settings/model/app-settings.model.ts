import { ObjectId } from 'mongodb';
import {
    HeroBannerWithId,
    CustomCards,
    InstallationLocation,
    CountryPricing,
    StaticPageSeoSettings,
} from '../app-settings.schema';

export function getDefaultStaticPageSeoSettings(): StaticPageSeoSettings {
    return {
        home: {
            title: 'Sheza Star | Car Accessories & Services',
            metaDescription: 'Shop premium car accessories, multimedia systems, and installation services at Sheza Star.',
        },
        about: {
            title: 'Our Story | Sheza Star',
            metaDescription: 'Learn about SHEZA STAR CAR ACCESSORIES SPS LLC and our journey.',
        },
        contact: {
            title: 'Contact Us | Sheza Star',
            metaDescription: 'Get in touch with Sheza Star support, headquarters, and branch contact details.',
        },
        privacy: {
            title: 'Privacy Policy | Sheza Star',
            metaDescription: 'Learn how Sheza Star collects, uses, and protects your data.',
        },
        terms: {
            title: 'Terms & Conditions | Sheza Star',
            metaDescription: 'Review the terms and conditions for using the Sheza Star website and services.',
        },
        'return-refund': {
            title: 'Return & Refund Policy | Sheza Star',
            metaDescription: 'Review return, refund, and exchange policies for Sheza Star.',
        },
        products: {
            title: 'All Products | Sheza Star',
            metaDescription: 'Browse our complete collection of quality car accessories and services.',
        },
        blogs: {
            title: 'Blogs | Sheza Star',
            metaDescription: 'Read the latest Sheza Star car accessory blogs and buying guides.',
        },
        'category-landing': {
            title: 'Browse by Category | Sheza Star',
            metaDescription: 'Pick a subcategory and explore matching products from Sheza Star.',
        },
    };
}

export interface AppSettingsDocument {
    _id: ObjectId;
    homeHeroBanners: HeroBannerWithId[];
    customCards: CustomCards;
    featuredProductIds: string[];
    installationLocations?: InstallationLocation[];
    countryPricings?: CountryPricing[];
    staticPageSeo?: StaticPageSeoSettings;
    createdAt: Date;
    updatedAt: Date;
}

export interface AppSettings {
    id: string;
    homeHeroBanners: HeroBannerWithId[];
    customCards: CustomCards;
    featuredProductIds: string[];
    installationLocations: InstallationLocation[];
    countryPricings: CountryPricing[];
    staticPageSeo: StaticPageSeoSettings;
    createdAt: string;
    updatedAt: string;
}

export function toAppSettings(doc: AppSettingsDocument): AppSettings {
    const defaultCards = {
        card1: null,
        card2: null,
        card3: null,
        card4: null,
        card5: null,
        card6: null,
    };

    const mergedCards = { ...defaultCards, ...(doc.customCards || {}) };

    const defaultStaticSeo = getDefaultStaticPageSeoSettings();
    const mergedStaticSeo = {
        ...defaultStaticSeo,
        ...(doc.staticPageSeo || {}),
    };

    return {
        id: doc._id.toString(),
        homeHeroBanners: doc.homeHeroBanners || [],
        customCards: mergedCards,
        featuredProductIds: doc.featuredProductIds || [],
        installationLocations: doc.installationLocations || [],
        countryPricings: doc.countryPricings || [],
        staticPageSeo: {
            home: { ...defaultStaticSeo.home, ...(mergedStaticSeo.home || {}) },
            about: { ...defaultStaticSeo.about, ...(mergedStaticSeo.about || {}) },
            contact: { ...defaultStaticSeo.contact, ...(mergedStaticSeo.contact || {}) },
            privacy: { ...defaultStaticSeo.privacy, ...(mergedStaticSeo.privacy || {}) },
            terms: { ...defaultStaticSeo.terms, ...(mergedStaticSeo.terms || {}) },
            'return-refund': {
                ...defaultStaticSeo['return-refund'],
                ...(mergedStaticSeo['return-refund'] || {}),
            },
            products: { ...defaultStaticSeo.products, ...(mergedStaticSeo.products || {}) },
            blogs: { ...defaultStaticSeo.blogs, ...(mergedStaticSeo.blogs || {}) },
            'category-landing': {
                ...defaultStaticSeo['category-landing'],
                ...(mergedStaticSeo['category-landing'] || {}),
            },
        },
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export function getDefaultSettings(): Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        homeHeroBanners: [],
        customCards: {
            card1: null,
            card2: null,
            card3: null,
            card4: null,
            card5: null,
            card6: null,
        },
        featuredProductIds: [],
        installationLocations: [],
        countryPricings: [],
        staticPageSeo: getDefaultStaticPageSeoSettings(),
    };
}
