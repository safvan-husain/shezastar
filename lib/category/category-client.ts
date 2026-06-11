/**
 * Normalizes category API payloads for client components.
 * Guards against legacy documents missing nested arrays.
 */
export interface ClientSubSubCategory {
    id: string;
    name: string;
}

export interface ClientSubCategory {
    id: string;
    name: string;
    subSubCategories: ClientSubSubCategory[];
}

export interface ClientCategory {
    id: string;
    name: string;
    subCategories: ClientSubCategory[];
}

export function parseCategoriesResponse(data: unknown): ClientCategory[] {
    if (!Array.isArray(data)) {
        throw new Error('Categories API returned an invalid response (expected an array of categories)');
    }

    return data.map((category, index) => {
        if (!category || typeof category !== 'object') {
            throw new Error(`Categories API returned an invalid category at index ${index}`);
        }

        const record = category as Record<string, unknown>;
        const id = record.id;
        const name = record.name;

        if (typeof id !== 'string' || typeof name !== 'string') {
            throw new Error(`Categories API returned an invalid category at index ${index} (missing id or name)`);
        }

        const rawSubCategories = Array.isArray(record.subCategories) ? record.subCategories : [];

        const subCategories: ClientSubCategory[] = rawSubCategories.map((sub, subIndex) => {
            if (!sub || typeof sub !== 'object') {
                throw new Error(
                    `Categories API returned an invalid subcategory at category index ${index}, subcategory index ${subIndex}`
                );
            }

            const subRecord = sub as Record<string, unknown>;
            const subId = subRecord.id;
            const subName = subRecord.name;

            if (typeof subId !== 'string' || typeof subName !== 'string') {
                throw new Error(
                    `Categories API returned an invalid subcategory at category index ${index}, subcategory index ${subIndex} (missing id or name)`
                );
            }

            const rawSubSubCategories = Array.isArray(subRecord.subSubCategories)
                ? subRecord.subSubCategories
                : [];

            const subSubCategories: ClientSubSubCategory[] = rawSubSubCategories.map((subSub, subSubIndex) => {
                if (!subSub || typeof subSub !== 'object') {
                    throw new Error(
                        `Categories API returned an invalid sub-subcategory at category index ${index}, subcategory index ${subIndex}, item index ${subSubIndex}`
                    );
                }

                const subSubRecord = subSub as Record<string, unknown>;
                const subSubId = subSubRecord.id;
                const subSubName = subSubRecord.name;

                if (typeof subSubId !== 'string' || typeof subSubName !== 'string') {
                    throw new Error(
                        `Categories API returned an invalid sub-subcategory at category index ${index}, subcategory index ${subIndex}, item index ${subSubIndex} (missing id or name)`
                    );
                }

                return { id: subSubId, name: subSubName };
            });

            return { id: subId, name: subName, subSubCategories };
        });

        return { id, name, subCategories };
    });
}
