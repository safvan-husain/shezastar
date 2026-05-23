import type { Metadata } from 'next';
import { getCachedStaticPageSeoSettings } from '@/lib/app-settings/app-settings-cache';
import type { StaticPageSeoEntry, StaticPageSeoKey } from '@/lib/app-settings/app-settings.schema';
import { getDefaultStaticPageSeoSettings } from '@/lib/app-settings/model/app-settings.model';
import { buildStaticPagePath } from '@/lib/seo/canonical';
import { buildSocialMetadata } from '@/lib/seo/metadata';

function toMetadata(entry: StaticPageSeoEntry, key: StaticPageSeoKey): Metadata {
    return {
        title: entry.title,
        description: entry.metaDescription,
        ...buildSocialMetadata({
            title: entry.title,
            description: entry.metaDescription,
            canonicalPath: buildStaticPagePath(key),
            imageUrl: entry.ogImage,
        }),
    };
}

export async function getStaticPageMetadata(key: StaticPageSeoKey): Promise<Metadata> {
    const defaults = getDefaultStaticPageSeoSettings();

    try {
        const settings = await getCachedStaticPageSeoSettings();
        const entry = settings[key] || defaults[key];
        return toMetadata(entry, key);
    } catch {
        return toMetadata(defaults[key], key);
    }
}
