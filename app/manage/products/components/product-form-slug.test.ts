import { describe, expect, it } from 'vitest';
import { buildSuggestedProductSlug, shouldPromptForSlugDecision } from './product-form-slug';

describe('product form slug helpers', () => {
    it('prompts only when an existing product name changed without manual slug edits', () => {
        expect(shouldPromptForSlugDecision({
            currentName: 'New Name',
            initialName: 'Old Name',
            slugTouched: false,
            hasInitialProduct: true,
        })).toBe(true);

        expect(shouldPromptForSlugDecision({
            currentName: 'New Name',
            initialName: 'Old Name',
            slugTouched: true,
            hasInitialProduct: true,
        })).toBe(false);
    });

    it('builds the same normalized slug shown in the rename prompt', () => {
        expect(buildSuggestedProductSlug('Mirror Dash Cam 4K')).toBe('mirror-dash-cam-4k');
    });
});
