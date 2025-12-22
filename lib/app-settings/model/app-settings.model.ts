import { ObjectId } from 'mongodb';
import { HeroBannerWithId, CustomCards, InstallationLocation } from '../app-settings.schema';

export interface AppSettingsDocument {
    _id: ObjectId;
    homeHeroBanners: HeroBannerWithId[];
    customCards: CustomCards;
    featuredProductIds: string[];
    installationLocations?: InstallationLocation[];
    createdAt: Date;
    updatedAt: Date;
}

export interface AppSettings {
    id: string;
    homeHeroBanners: HeroBannerWithId[];
    customCards: CustomCards;
    featuredProductIds: string[];
    installationLocations: InstallationLocation[];
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

    return {
        id: doc._id.toString(),
        homeHeroBanners: doc.homeHeroBanners || [],
        customCards: mergedCards,
        featuredProductIds: doc.featuredProductIds || [],
        installationLocations: doc.installationLocations || [],
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
    };
}
