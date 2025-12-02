import { getCollection } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { AppSettingsDocument, toAppSettings, getDefaultSettings } from './model/app-settings.model';
import { CreateHeroBannerInput, UpdateHeroBannerInput } from './app-settings.schema';
import { nanoid } from 'nanoid';

const COLLECTION = 'appSettings';
const SETTINGS_ID = 'app-settings-singleton';

export async function getAppSettings() {
    const collection = await getCollection<AppSettingsDocument>(COLLECTION);
    const doc = await collection.findOne({});

    if (!doc) {
        // Return default structure
        return {
            id: SETTINGS_ID,
            ...getDefaultSettings(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    return toAppSettings(doc);
}

export async function getHeroBanners() {
    const settings = await getAppSettings();
    return settings.homeHeroBanners;
}

export async function createHeroBanner(input: CreateHeroBannerInput) {
    // Validate offer price
    if (input.offerPrice >= input.price) {
        throw new AppError(400, 'INVALID_OFFER_PRICE', {
            message: 'Offer price must be less than price',
        });
    }

    const collection = await getCollection<AppSettingsDocument>(COLLECTION);
    const now = new Date();
    const newBanner = {
        ...input,
        id: nanoid(),
    };

    // Upsert: update if exists, create if not
    const result = await collection.findOneAndUpdate(
        {},
        {
            $push: {
                homeHeroBanners: newBanner,
            },
            $set: {
                updatedAt: now,
            },
            $setOnInsert: {
                createdAt: now,
            },
        },
        {
            upsert: true,
            returnDocument: 'after',
        }
    );

    if (!result) {
        throw new AppError(500, 'FAILED_TO_CREATE_BANNER');
    }

    return toAppSettings(result);
}

export async function updateHeroBanner(id: string, input: UpdateHeroBannerInput) {
    // Validate offer price
    if (input.offerPrice >= input.price) {
        throw new AppError(400, 'INVALID_OFFER_PRICE', {
            message: 'Offer price must be less than price',
        });
    }

    const collection = await getCollection<AppSettingsDocument>(COLLECTION);
    const now = new Date();

    // Update the specific banner in the array
    const result = await collection.findOneAndUpdate(
        { 'homeHeroBanners.id': id },
        {
            $set: {
                'homeHeroBanners.$[banner]': {
                    ...input,
                    id,
                },
                updatedAt: now,
            },
        },
        {
            arrayFilters: [{ 'banner.id': id }],
            returnDocument: 'after',
        }
    );

    if (!result) {
        throw new AppError(404, 'BANNER_NOT_FOUND', {
            message: 'Hero banner not found',
        });
    }

    return toAppSettings(result);
}

export async function deleteHeroBanner(id: string) {
    const collection = await getCollection<AppSettingsDocument>(COLLECTION);
    const now = new Date();

    // Remove the banner from the array
    const result = await collection.findOneAndUpdate(
        {},
        {
            $pull: {
                homeHeroBanners: { id },
            },
            $set: {
                updatedAt: now,
            },
        },
        {
            returnDocument: 'after',
        }
    );

    if (!result) {
        throw new AppError(404, 'BANNER_NOT_FOUND', {
            message: 'Hero banner not found',
        });
    }

    return toAppSettings(result);
}
