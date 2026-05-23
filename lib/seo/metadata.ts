import type { Metadata } from 'next';

type SocialMetadataOptions = {
    title: string;
    description: string;
    canonicalPath: string;
    imageUrl?: string | null;
    type?: 'website' | 'article';
    publishedTime?: string;
    modifiedTime?: string;
};

export function buildSocialMetadata({
    title,
    description,
    canonicalPath,
    imageUrl,
    type = 'website',
    publishedTime,
    modifiedTime,
}: SocialMetadataOptions): Pick<Metadata, 'alternates' | 'openGraph' | 'twitter'> {
    const image = imageUrl?.trim() || undefined;

    return {
        alternates: {
            canonical: canonicalPath,
        },
        openGraph: {
            title,
            description,
            type,
            url: canonicalPath,
            images: image ? [{ url: image, alt: title }] : undefined,
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
