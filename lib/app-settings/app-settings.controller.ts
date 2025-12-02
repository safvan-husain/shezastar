import { catchError } from '@/lib/errors/app-error';
import { CreateHeroBannerSchema, UpdateHeroBannerSchema } from './app-settings.schema';
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
