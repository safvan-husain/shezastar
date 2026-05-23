import type { MetadataRoute } from 'next';
import { getCachedProductIds } from '@/lib/product/product-cache';
import { getCachedAllCategories } from '@/lib/category/category-cache';
import { Category } from '@/lib/category/model/category.model';
import {
    STATIC_SITEMAP_PATHS,
    buildCanonicalUrl,
    buildCategoryPath,
    buildProductPath,
} from '@/lib/seo/canonical';

function collectCategoryPaths(categories: Category[]) {
    const categoryPaths = new Set<string>();

    for (const category of categories) {
        if (category.slug) {
            categoryPaths.add(buildCategoryPath(category.slug));
        }

        for (const subCategory of category.subCategories) {
            if (subCategory.slug) {
                categoryPaths.add(buildCategoryPath(subCategory.slug));
            }

            for (const subSubCategory of subCategory.subSubCategories) {
                if (subSubCategory.slug) {
                    categoryPaths.add(buildCategoryPath(subSubCategory.slug));
                }
            }
        }
    }

    return [...categoryPaths];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [productIds, categories] = await Promise.all([
        getCachedProductIds(),
        getCachedAllCategories(),
    ]);

    const productPaths = productIds.map(buildProductPath);
    const categoryPaths = collectCategoryPaths(categories);
    const lastModified = new Date();

    return [...STATIC_SITEMAP_PATHS, ...productPaths, ...categoryPaths].map(path => ({
        url: buildCanonicalUrl(path),
        lastModified,
    }));
}
