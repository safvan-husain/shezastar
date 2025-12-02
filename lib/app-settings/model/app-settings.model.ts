import { ObjectId } from 'mongodb';
import { HeroBannerWithId } from '../app-settings.schema';

export interface AppSettingsDocument {
    _id: ObjectId;
    homeHeroBanners: HeroBannerWithId[];
    createdAt: Date;
    updatedAt: Date;
}

export interface AppSettings {
    id: string;
    homeHeroBanners: HeroBannerWithId[];
    createdAt: string;
    updatedAt: string;
}

export function toAppSettings(doc: AppSettingsDocument): AppSettings {
    return {
        id: doc._id.toString(),
        homeHeroBanners: doc.homeHeroBanners || [],
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export function getDefaultSettings(): Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        homeHeroBanners: [],
    };
}
