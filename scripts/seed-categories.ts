import path from 'path';
import { readFile } from 'fs/promises';
import { nanoid } from 'nanoid';
import { getCollection } from '@/lib/db/mongo-client';
import { createCategory } from '@/lib/category/category.service';
import { CategoryDocument } from '@/lib/category/model/category.model';
import {
    CreateCategoryInput,
    SubCategory,
    SubSubCategory,
} from '@/lib/category/category.schema';

interface RawCategoryNode {
    name?: string;
    children?: RawCategoryNode[];
}

interface RawCategoryFile {
    categories: RawCategoryNode[];
}

const CATEGORY_DATA_PATH = path.resolve(process.cwd(), 'category-data.json');

function hasAlphaNumeric(value: string) {
    return /[0-9a-z]/i.test(value);
}

function ensureName(rawName: string | undefined, fallback: string) {
    const trimmed = (rawName ?? '').trim();
    if (!trimmed || !hasAlphaNumeric(trimmed)) {
        return fallback;
    }
    return trimmed;
}

function mapSubSubCategories(
    categoryName: string,
    subCategoryName: string,
    nodes: RawCategoryNode[] = []
): SubSubCategory[] {
    return nodes.map((subSub, index) => {
        const name = ensureName(
            subSub.name,
            `${subCategoryName} sub-subcategory ${index + 1}`
        );
        return {
            id: nanoid(),
            name,
        };
    });
}

function mapSubCategories(
    categoryName: string,
    nodes: RawCategoryNode[] = []
): SubCategory[] {
    return nodes.map((subCategory, index) => {
        const name = ensureName(
            subCategory.name,
            `${categoryName} subcategory ${index + 1}`
        );

        return {
            id: nanoid(),
            name,
            subSubCategories: mapSubSubCategories(
                categoryName,
                name,
                subCategory.children ?? []
            ),
        };
    });
}

function transformCategories(rawCategories: RawCategoryNode[]): CreateCategoryInput[] {
    return rawCategories.map((category, index) => {
        const name = ensureName(category.name, `Category ${index + 1}`);
        return {
            name,
            subCategories: mapSubCategories(name, category.children ?? []),
        };
    });
}

async function loadCategoryData(): Promise<RawCategoryNode[]> {
    const fileContents = await readFile(CATEGORY_DATA_PATH, 'utf8');
    const parsed = JSON.parse(fileContents) as RawCategoryFile;

    if (!parsed.categories || !Array.isArray(parsed.categories)) {
        throw new Error('category-data.json must contain a "categories" array');
    }

    return parsed.categories;
}

export async function seedCategories() {
    const rawCategories = await loadCategoryData();
    const categories = transformCategories(rawCategories);

    if (categories.length === 0) {
        console.log('No categories found in category-data.json. Nothing to seed.');
        return;
    }

    const collection = await getCollection<CategoryDocument>('categories');
    const { deletedCount = 0 } = await collection.deleteMany({});
    console.log(`Removed ${deletedCount} existing categories.`);

    for (const category of categories) {
        await createCategory(category);
        console.log(`Created category: ${category.name}`);
    }

    console.log(`Seeded ${categories.length} categories from category-data.json.`);
}

if (require.main === module) {
    seedCategories()
        .then(() => {
            console.log('Category seeding complete.');
            process.exit(0);
        })
        .catch(error => {
            console.error('Failed to seed categories:', error);
            process.exit(1);
        });
}
