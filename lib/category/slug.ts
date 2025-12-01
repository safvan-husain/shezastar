// lib/category/slug.ts
function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function getCategorySlug(name: string) {
    return slugify(name);
}

export function getSubCategorySlug(categoryName: string, subCategoryName: string) {
    return slugify(`${categoryName} ${subCategoryName}`);
}

export function getSubSubCategorySlug(
    categoryName: string,
    subCategoryName: string,
    subSubCategoryName: string
) {
    return slugify(`${categoryName} ${subCategoryName} ${subSubCategoryName}`);
}

export { slugify };
