import type { Metadata } from 'next';
import { getCachedStaticPageSeoSettings } from '@/lib/app-settings/app-settings-cache';
import type { StaticPageSeoEntry, StaticPageSeoKey } from '@/lib/app-settings/app-settings.schema';
import { getDefaultStaticPageSeoSettings } from '@/lib/app-settings/model/app-settings.model';
import { buildStaticPagePath } from '@/lib/seo/canonical';

function toMetadata(entry: StaticPageSeoEntry, key: StaticPageSeoKey): Metadata {
    const imageUrl = entry.ogImage;
    const canonical = buildStaticPagePath(key);

    return {
        title: entry.title,
        description: entry.metaDescription,
        alternates: {
            canonical,
        },
        openGraph: {
            title: entry.title,
            description: entry.metaDescription,
            type: 'website',
            url: canonical,
            images: imageUrl ? [{ url: imageUrl, alt: entry.title }] : undefined,
        },
        twitter: {
            card: imageUrl ? 'summary_large_image' : 'summary',
            title: entry.title,
            description: entry.metaDescription,
            images: imageUrl ? [imageUrl] : undefined,
        },
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
