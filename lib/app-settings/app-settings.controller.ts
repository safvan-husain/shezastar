import { catchError } from '@/lib/errors/app-error';
import { UpdateHeroBannerSchema } from './app-settings.schema';
import * as appSettingsService from './app-settings.service';

export async function handleGetAppSettings() {
    try {
        const result = await appSettingsService.getAppSettings();
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleUpdateHeroBanner(input: unknown) {
    try {
        const parsed = UpdateHeroBannerSchema.parse(input);
        const result = await appSettingsService.updateHeroBanner(parsed);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}
