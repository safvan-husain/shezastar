import { catchError } from '@/lib/errors/app-error';
import { CreateHeroBannerSchema, UpdateHeroBannerSchema, CreateCustomCardSchema, UpdateCustomCardSchema } from './app-settings.schema';
import * as appSettingsService from './app-settings.service';

export async function handleGetAppSettings() {
    try {
        const result = await appSettingsService.getAppSettings();
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetHeroBanners() {
    try {
        const result = await appSettingsService.getHeroBanners();
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleCreateHeroBanner(input: unknown) {
    try {
        const parsed = CreateHeroBannerSchema.parse(input);
        const result = await appSettingsService.createHeroBanner(parsed);
        return { status: 201, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleUpdateHeroBanner(id: string, input: unknown) {
    try {
        const parsed = UpdateHeroBannerSchema.parse(input);
        const result = await appSettingsService.updateHeroBanner(id, parsed);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleDeleteHeroBanner(id: string) {
    try {
        const result = await appSettingsService.deleteHeroBanner(id);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

// Custom Cards Controller Methods

export async function handleCreateCustomCard(cardKey: string, input: unknown) {
    try {
        const parsed = CreateCustomCardSchema.parse(input);
        const result = await appSettingsService.createCustomCard(cardKey, parsed);
        return { status: 201, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleUpdateCustomCard(cardKey: string, input: unknown) {
    try {
        const parsed = UpdateCustomCardSchema.parse(input);
        const result = await appSettingsService.updateCustomCard(cardKey, parsed);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleDeleteCustomCard(cardKey: string) {
    try {
        const result = await appSettingsService.deleteCustomCard(cardKey);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetCustomCard(cardKey: string) {
    try {
        const result = await appSettingsService.getCustomCard(cardKey);
        if (!result) {
            // If card is null, we still return 200 with null body, or maybe 404?
            // The service returns null if the slot is empty.
            // Let's return 200 with null as per plan.
            return { status: 200, body: null };
        }
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetCustomCards() {
    try {
        const result = await appSettingsService.getCustomCards();
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}
