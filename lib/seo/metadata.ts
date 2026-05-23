import type { Metadata } from 'next';
import { buildCanonicalUrl } from '@/lib/seo/canonical';

type SocialMetadataOptions = {
    title: string;
    description: string;
    canonicalPath: string;
    imageUrl?: string | null;
    type?: 'website' | 'article';
    publishedTime?: string;
    modifiedTime?: string;
};

export function resolveMetadataImageUrl(imageUrl?: string | null) {
    if (!imageUrl?.trim()) {
        return undefined;
    }

    const trimmed = imageUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }

    return buildCanonicalUrl(trimmed);
}

export function buildSocialMetadata({
    title,
    description,
    canonicalPath,
    imageUrl,
    type = 'website',
    publishedTime,
    modifiedTime,
}: SocialMetadataOptions): Pick<Metadata, 'alternates' | 'openGraph' | 'twitter'> {
    const image = resolveMetadataImageUrl(imageUrl);
    const canonicalUrl = buildCanonicalUrl(canonicalPath);

    return {
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title,
            description,
            type,
            url: canonicalUrl,
            siteName: 'Sheza Star',
            images: image
                ? [
                      {
                          url: image,
                          secureUrl: image,
                          alt: title,
                      },
                  ]
                : undefined,
            ...(publishedTime ? { publishedTime } : {}),
            ...(modifiedTime ? { modifiedTime } : {}),
        },
        twitter: {
            card: image ? 'summary_large_image' : 'summary',
            title,
            description,
            images: image ? [image] : undefined,
        },
    };
}

type NoIndexMetadataOptions = {
    title: string;
    description?: string;
    follow?: boolean;
};

export function buildNoIndexMetadata({
    title,
    description,
    follow = false,
}: NoIndexMetadataOptions): Metadata {
    return {
        title,
        ...(description ? { description } : {}),
        robots: {
            index: false,
            follow,
        },
    };
}

export function serializeJsonLd(value: unknown) {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}
