import type { MetadataRoute } from 'next';
import { getCachedPublishedBlogSitemapEntries } from '@/lib/blog/blog-cache';
import { getCachedProductSlugs } from '@/lib/product/product-cache';
import { getCachedAllCategories } from '@/lib/category/category-cache';
import { Category } from '@/lib/category/model/category.model';
import {
    STATIC_SITEMAP_PATHS,
    buildCanonicalUrl,
    buildBlogPath,
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
    const [productSlugs, categories, blogEntries] = await Promise.all([
        getCachedProductSlugs(),
        getCachedAllCategories(),
        getCachedPublishedBlogSitemapEntries(),
    ]);

    const productEntries = productSlugs.map((slug) => ({
        url: buildCanonicalUrl(buildProductPath(slug)),
        lastModified: new Date(),
    }));
    const categoryEntries = collectCategoryPaths(categories).map((path) => ({
        url: buildCanonicalUrl(path),
        lastModified: new Date(),
    }));
    const staticEntries = STATIC_SITEMAP_PATHS.map((path) => ({
        url: buildCanonicalUrl(path),
        lastModified: new Date(),
    }));
    const blogSitemapEntries = blogEntries.map((entry) => ({
        url: buildCanonicalUrl(buildBlogPath(entry.slug)),
        lastModified: new Date(entry.updatedAt),
    }));

    return [...staticEntries, ...productEntries, ...categoryEntries, ...blogSitemapEntries];
}
