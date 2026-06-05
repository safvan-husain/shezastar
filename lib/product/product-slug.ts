const OBJECT_ID_HEX_PATTERN = /^[a-f0-9]{24}$/i;

export function normalizeProductSlug(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function isReservedProductSlug(slug: string) {
    return OBJECT_ID_HEX_PATTERN.test(slug);
}

export function buildDefaultProductSlug(name: string) {
    return normalizeProductSlug(name) || 'product';
}
