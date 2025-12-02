import { ObjectId } from 'mongodb';
import { HeroBanner } from '../app-settings.schema';

export interface AppSettingsDocument {
    _id: ObjectId;
    homeHeroBanner?: HeroBanner;
    createdAt: Date;
    updatedAt: Date;
}

export interface AppSettings {
    id: string;
    homeHeroBanner?: HeroBanner;
    createdAt: string;
    updatedAt: string;
}

export function toAppSettings(doc: AppSettingsDocument): AppSettings {
    return {
        id: doc._id.toString(),
        homeHeroBanner: doc.homeHeroBanner,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

export function getDefaultSettings(): Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        homeHeroBanner: undefined,
    };
}
