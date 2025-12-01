// scripts/migrate-category-slugs.ts
import { getCollection } from '@/lib/db/mongo-client';
import {
    CategoryDocument,
    CategorySubCategory,
    CategorySubSubCategory,
} from '@/lib/category/model/category.model';
import {
    getCategorySlug,
    getSubCategorySlug,
    getSubSubCategorySlug,
} from '@/lib/category/slug';

type LegacySubSubCategory = Omit<CategorySubSubCategory, 'slug'> & { slug?: string };
type LegacySubCategory = Omit<CategorySubCategory, 'slug' | 'subSubCategories'> & {
    slug?: string;
    subSubCategories?: LegacySubSubCategory[];
};
type LegacyCategoryDocument = Omit<CategoryDocument, 'slug' | 'subCategories'> & {
    slug?: string;
    subCategories?: LegacySubCategory[];
};

function mapSubSubCategories(
    categoryName: string,
    subCategoryName: string,
    subSubCategories: LegacySubSubCategory[] = []
): CategorySubSubCategory[] {
    return subSubCategories.map(subSub => ({
        ...subSub,
        slug: getSubSubCategorySlug(categoryName, subCategoryName, subSub.name),
    }));
}

function mapSubCategories(
    categoryName: string,
    subCategories: LegacySubCategory[] = []
): CategorySubCategory[] {
    return subCategories.map(subCategory => ({
        ...subCategory,
        slug: getSubCategorySlug(categoryName, subCategory.name),
        subSubCategories: mapSubSubCategories(
            categoryName,
            subCategory.name,
            subCategory.subSubCategories ?? []
        ),
    }));
}

export async function migrateCategorySlugs() {
    const collection = await getCollection<LegacyCategoryDocument>('categories');
    const categories = await collection.find({}).toArray();
    console.log(`Found ${categories.length} categories to migrate.`);

    let updatedCount = 0;

    for (const category of categories) {
        const slug = getCategorySlug(category.name);
        const subCategories = mapSubCategories(category.name, category.subCategories ?? []);

        await collection.updateOne(
            { _id: category._id },
            {
                $set: {
                    slug,
                    subCategories,
                    updatedAt: new Date(),
                },
            }
        );

        updatedCount += 1;
    }

    console.log(`Updated ${updatedCount} categories with slug data.`);
}

if (require.main === module) {
    migrateCategorySlugs()
        .then(() => {
            console.log('Category slug migration completed.');
            process.exit(0);
        })
        .catch(error => {
            console.error('Failed to migrate category slugs:', error);
            process.exit(1);
        });
}
