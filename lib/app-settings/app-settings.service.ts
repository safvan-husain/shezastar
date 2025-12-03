import { getCollection } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { AppSettingsDocument, toAppSettings, getDefaultSettings } from './model/app-settings.model';
import { CreateHeroBannerInput, UpdateHeroBannerInput, CreateCustomCardInput, UpdateCustomCardInput, CustomCard } from './app-settings.schema';
import { nanoid } from 'nanoid';
import { getProduct } from '@/lib/product/product.service';
import { Product } from '@/lib/product/model/product.model';

const COLLECTION = 'appSettings';
const SETTINGS_ID = 'app-settings-singleton';

function getResultDocument<T>(result: T | { value?: T | null } | null | undefined): T | null {
    if (!result) return null;
    if (typeof result === 'object' && result !== null && 'value' in result) {
        const docResult = result as { value?: T | null };
        return docResult.value ?? null;
    }
    return result as T;
}

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

    const updatedDoc = getResultDocument<AppSettingsDocument>(result);

    if (!updatedDoc) {
        throw new AppError(500, 'FAILED_TO_CREATE_BANNER');
    }

    return toAppSettings(updatedDoc);
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

    const updatedDoc = getResultDocument<AppSettingsDocument>(result);

    if (!updatedDoc) {
        throw new AppError(404, 'BANNER_NOT_FOUND', {
            message: 'Hero banner not found',
        });
    }

    return toAppSettings(updatedDoc);
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

    const updatedDoc = getResultDocument<AppSettingsDocument>(result);

    if (!updatedDoc) {
        throw new AppError(404, 'BANNER_NOT_FOUND', {
            message: 'Hero banner not found',
        });
    }

    return toAppSettings(updatedDoc);
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

    const updatedDoc = getResultDocument<AppSettingsDocument>(result);

    if (!updatedDoc) {
        throw new AppError(500, 'FAILED_TO_CREATE_CARD');
    }

    return toAppSettings(updatedDoc);
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

    const updatedDoc = getResultDocument<AppSettingsDocument>(result);

    if (!updatedDoc) {
        throw new AppError(404, 'CARD_NOT_FOUND', {
            message: `Card ${cardKey} not found`,
        });
    }

    return toAppSettings(updatedDoc);
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

    const updatedDoc = getResultDocument<AppSettingsDocument>(result);

    if (!updatedDoc) {
        // If document doesn't exist, the card is effectively deleted (null)
        return getAppSettings();
    }

    return toAppSettings(updatedDoc);
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

// Featured Products Service Methods

export async function getFeaturedProducts(): Promise<Product[]> {
    const settings = await getAppSettings();
    const productIds = settings.featuredProductIds || [];

    // Fetch all products and filter out invalid ones
    const products = await Promise.all(
        productIds.map(async (id) => {
            try {
                return await getProduct(id);
            } catch (error) {
                // Product not found or invalid ID, filter it out
                return null;
            }
        })
    );

    return products.filter((p): p is Product => p !== null);
}

export async function addFeaturedProduct(productId: string) {
    // Validate product exists
    await getProduct(productId); // Throws if not found

    const collection = await getCollection<AppSettingsDocument>(COLLECTION);
    const now = new Date();

    const existing = await collection.findOne({});

    // Check if already featured
    if (existing?.featuredProductIds?.includes(productId)) {
        throw new AppError(400, 'PRODUCT_ALREADY_FEATURED', {
            message: 'Product is already in featured list',
        });
    }

    // No settings document yet: create one with defaults
    if (!existing) {
        const defaultSettings = getDefaultSettings();
        const docToInsert: Omit<AppSettingsDocument, '_id'> = {
            ...defaultSettings,
            featuredProductIds: [productId],
            createdAt: now,
            updatedAt: now,
        };

        const insertResult = await collection.insertOne(docToInsert as any);
        return toAppSettings({
            ...docToInsert,
            _id: insertResult.insertedId,
        });
    }

    const result = await collection.findOneAndUpdate(
        { _id: existing._id },
        {
            $addToSet: {
                featuredProductIds: productId,
            },
            $set: {
                updatedAt: now,
            },
        },
        {
            returnDocument: 'after',
        }
    );

    const updatedDoc = getResultDocument<AppSettingsDocument>(result);

    if (!updatedDoc) {
        throw new AppError(500, 'FAILED_TO_ADD_FEATURED_PRODUCT');
    }

    return toAppSettings(updatedDoc);
}

export async function removeFeaturedProduct(productId: string) {
    const collection = await getCollection<AppSettingsDocument>(COLLECTION);
    const now = new Date();

    const result = await collection.findOneAndUpdate(
        {},
        {
            $pull: {
                featuredProductIds: productId,
            },
            $set: {
                updatedAt: now,
            },
        },
        {
            returnDocument: 'after',
        }
    );

    const updatedDoc = getResultDocument<AppSettingsDocument>(result);

    if (!updatedDoc) {
        // If document doesn't exist, return default settings
        return getAppSettings();
    }

    return toAppSettings(updatedDoc);
}

