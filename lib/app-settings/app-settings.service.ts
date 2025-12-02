import { getCollection } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { AppSettingsDocument, toAppSettings, getDefaultSettings } from './model/app-settings.model';
import { UpdateHeroBannerInput } from './app-settings.schema';

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

export async function updateHeroBanner(input: UpdateHeroBannerInput) {
    // Validate offer price
    if (input.offerPrice >= input.price) {
        throw new AppError(400, 'INVALID_OFFER_PRICE', {
            message: 'Offer price must be less than price',
        });
    }

    const collection = await getCollection<AppSettingsDocument>(COLLECTION);
    const now = new Date();

    // Upsert: update if exists, create if not
    const result = await collection.findOneAndUpdate(
        {},
        {
            $set: {
                homeHeroBanner: input,
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
        throw new AppError(500, 'FAILED_TO_UPDATE_SETTINGS');
    }

    return toAppSettings(result);
}
