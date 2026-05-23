import { cacheLife, cacheTag, revalidateTag } from 'next/cache';
import { getCachedCollection } from '@/lib/db/mongo-client';
import { CountryPricing, StaticPageSeoSettings } from './app-settings.schema';
import { AppSettingsDocument, getDefaultSettings, toAppSettings } from './model/app-settings.model';

const COLLECTION = 'appSettings';
export const COUNTRY_PRICINGS_CACHE_TAG = 'country-pricings';
export const STATIC_PAGE_SEO_CACHE_TAG = 'static-page-seo';

export async function getCachedActiveCountryPricings(): Promise<CountryPricing[]> {
    'use cache';
    cacheLife('days');
    cacheTag(COUNTRY_PRICINGS_CACHE_TAG);

    const collection = await getCachedCollection<AppSettingsDocument>(COLLECTION);
    const doc = await collection.findOne({});

    const settings = doc
        ? toAppSettings(doc)
        : {
            id: 'app-settings-singleton',
            ...getDefaultSettings(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

    return settings.countryPricings.filter(country => country.isActive);
}

export function revalidateCountryPricingsCache() {
    revalidateTag(COUNTRY_PRICINGS_CACHE_TAG, { expire: 0 });
}

export async function getCachedStaticPageSeoSettings(): Promise<StaticPageSeoSettings> {
    'use cache';
    cacheLife('days');
    cacheTag(STATIC_PAGE_SEO_CACHE_TAG);

    const collection = await getCachedCollection<AppSettingsDocument>(COLLECTION);
    const doc = await collection.findOne({});

    const settings = doc
        ? toAppSettings(doc)
        : {
            id: 'app-settings-singleton',
            ...getDefaultSettings(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

    return settings.staticPageSeo;
}

export function revalidateStaticPageSeoCache() {
    revalidateTag(STATIC_PAGE_SEO_CACHE_TAG, { expire: 0 });
}
