import { getCollection } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { AppSettingsDocument, toAppSettings, getDefaultSettings } from './model/app-settings.model';
import { CreateHeroBannerInput, UpdateHeroBannerInput, CreateCustomCardInput, UpdateCustomCardInput, CustomCard } from './app-settings.schema';
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

// Custom Cards Service Methods
const VALID_CARD_KEYS = ['card1', 'card2', 'card3', 'card4', 'card5', 'card6'] as const;
type CardKey = typeof VALID_CARD_KEYS[number];

function isValidCardKey(key: string): key is CardKey {
    return VALID_CARD_KEYS.includes(key as CardKey);
}

export async function createCustomCard(cardKey: string, input: CreateCustomCardInput) {
    if (!isValidCardKey(cardKey)) {
        throw new AppError(400, 'INVALID_CARD_KEY', {
            message: `Invalid card key. Must be one of: ${VALID_CARD_KEYS.join(', ')}`,
        });
    }

    const collection = await getCollection<AppSettingsDocument>(COLLECTION);
    const now = new Date();

    // Check if card already exists (not null)
    const existing = await collection.findOne({});
    if (existing?.customCards?.[cardKey]) {
        throw new AppError(400, 'CARD_ALREADY_EXISTS', {
            message: `Card ${cardKey} already exists. Use update instead.`,
        });
    }

    // Create or update with the new card
    const result = await collection.findOneAndUpdate(
        {},
        {
            $set: {
                [`customCards.${cardKey}`]: input,
                updatedAt: now,
            },
            $setOnInsert: {
                createdAt: now,
                homeHeroBanners: [],
            },
        },
        {
            upsert: true,
            returnDocument: 'after',
        }
    );

    if (!result) {
        throw new AppError(500, 'FAILED_TO_CREATE_CARD');
    }

    return toAppSettings(result);
}

export async function updateCustomCard(cardKey: string, input: UpdateCustomCardInput) {
    if (!isValidCardKey(cardKey)) {
        throw new AppError(400, 'INVALID_CARD_KEY', {
            message: `Invalid card key. Must be one of: ${VALID_CARD_KEYS.join(', ')}`,
        });
    }

    const collection = await getCollection<AppSettingsDocument>(COLLECTION);
    const now = new Date();

    // Check if card exists (not null)
    const existing = await collection.findOne({});
    if (!existing?.customCards?.[cardKey]) {
        throw new AppError(404, 'CARD_NOT_FOUND', {
            message: `Card ${cardKey} not found`,
        });
    }

    const result = await collection.findOneAndUpdate(
        {},
        {
            $set: {
                [`customCards.${cardKey}`]: input,
                updatedAt: now,
            },
        },
        {
            returnDocument: 'after',
        }
    );

    if (!result) {
        throw new AppError(404, 'CARD_NOT_FOUND', {
            message: `Card ${cardKey} not found`,
        });
    }

    return toAppSettings(result);
}

export async function deleteCustomCard(cardKey: string) {
    if (!isValidCardKey(cardKey)) {
        throw new AppError(400, 'INVALID_CARD_KEY', {
            message: `Invalid card key. Must be one of: ${VALID_CARD_KEYS.join(', ')}`,
        });
    }

    const collection = await getCollection<AppSettingsDocument>(COLLECTION);
    const now = new Date();

    // Set card to null (idempotent operation)
    const result = await collection.findOneAndUpdate(
        {},
        {
            $set: {
                [`customCards.${cardKey}`]: null,
                updatedAt: now,
            },
        },
        {
            returnDocument: 'after',
        }
    );

    if (!result) {
        // If document doesn't exist, the card is effectively deleted (null)
        return getAppSettings();
    }

    return toAppSettings(result);
}

export async function getCustomCard(cardKey: string): Promise<CustomCard | null> {
    if (!isValidCardKey(cardKey)) {
        throw new AppError(400, 'INVALID_CARD_KEY', {
            message: `Invalid card key. Must be one of: ${VALID_CARD_KEYS.join(', ')}`,
        });
    }

    const settings = await getAppSettings();
    return settings.customCards[cardKey];
}

export async function getCustomCards() {
    const settings = await getAppSettings();
    return settings.customCards;
}
