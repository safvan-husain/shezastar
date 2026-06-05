import { buildDefaultProductSlug } from '@/lib/product/product-slug';

interface SlugDecisionOptions {
    currentName: string;
    initialName?: string;
    slugTouched: boolean;
    hasInitialProduct: boolean;
}

export function shouldPromptForSlugDecision({
    currentName,
    initialName,
    slugTouched,
    hasInitialProduct,
}: SlugDecisionOptions) {
    if (!hasInitialProduct || slugTouched) {
        return false;
    }

    return currentName.trim() !== (initialName ?? '').trim();
}

export function buildSuggestedProductSlug(name: string) {
    return buildDefaultProductSlug(name);
}
