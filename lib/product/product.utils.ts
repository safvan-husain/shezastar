// lib/product/product.utils.ts
/**
 * Utility functions for variant stock management
 */

/**
 * Generate a unique key for a variant combination
 * @param selectedVariantItemIds Array of variant item IDs (e.g., ["color-red", "size-large"])
 * @returns Combination key (e.g., "color-red+size-large" or "default" for empty array)
 */
export function getVariantCombinationKey(selectedVariantItemIds: string[]): string {
    if (!selectedVariantItemIds || selectedVariantItemIds.length === 0) {
        return 'default';
    }

    // Sort alphabetically to ensure consistent keys regardless of order
    return selectedVariantItemIds.slice().sort().join('+');
}

/**
 * Generate all possible variant combinations from product variants
 * @param variants Array of product variants
 * @returns Array of combination keys
 */
export function generateAllVariantCombinations(variants: Array<{
    variantTypeId: string;
    variantTypeName: string;
    selectedItems: Array<{ id: string; name: string }>;
}>): Array<{ key: string; label: string; itemIds: string[] }> {
    if (!variants || variants.length === 0) {
        return [{ key: 'default', label: 'Default', itemIds: [] }];
    }

    // Generate all combinations using cartesian product
    const combinations: Array<{ key: string; label: string; itemIds: string[] }> = [];

    function generateCombos(
        index: number,
        currentIds: string[],
        currentLabels: string[]
    ) {
        if (index === variants.length) {
            const key = getVariantCombinationKey(currentIds);
            const label = currentLabels.join(', ');
            combinations.push({ key, label, itemIds: currentIds });
            return;
        }

        const variant = variants[index];
        for (const item of variant.selectedItems) {
            generateCombos(
                index + 1,
                [...currentIds, item.id],
                [...currentLabels, `${variant.variantTypeName}: ${item.name}`]
            );
        }
    }

    generateCombos(0, [], []);
    return combinations;
}

/**
 * Get stock information for a product
 */
export type StockStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'PARTIAL_STOCK_OUT';

export function getProductStockInfo(product: {
    variantStock: Array<{ stockCount: number }>;
}): { totalStock: number; status: StockStatus } {
    if (!product.variantStock || product.variantStock.length === 0) {
        return { totalStock: 0, status: 'IN_STOCK' }; // Assuming infinite or untracked as In Stock
    }

    const totalStock = product.variantStock.reduce((acc, curr) => acc + curr.stockCount, 0);

    if (totalStock === 0) {
        return { totalStock, status: 'OUT_OF_STOCK' };
    }

    const hasOutOfStockVariant = product.variantStock.some(s => s.stockCount === 0);

    if (hasOutOfStockVariant) {
        return { totalStock, status: 'PARTIAL_STOCK_OUT' };
    }

    return { totalStock, status: 'IN_STOCK' };
}
