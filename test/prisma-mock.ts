import { randomBytes } from 'node:crypto';

type ProductRecord = {
    id: string;
    name: string;
    description?: string | null;
    basePrice: number;
    offerPrice?: number | null;
    images: any[];
    variants: any[];
    subCategoryIds: string[];
    installationService?: any;
    createdAt: Date;
    updatedAt: Date;
};

type VariantTypeRecord = {
    id: string;
    name: string;
    items: any[];
    createdAt: Date;
    updatedAt: Date;
};

type SubCategoryRecord = {
    id: string;
    name: string;
};

type CategoryRecord = {
    id: string;
    name: string;
    subCategories: SubCategoryRecord[];
    createdAt: Date;
    updatedAt: Date;
};

function objectId() {
    return randomBytes(12).toString('hex');
}

function clone<T>(value: T): T {
    return structuredClone(value);
}

function now() {
    return new Date();
}

function matchesVariantType(record: VariantTypeRecord, where: any = {}) {
    if (where.id && record.id !== where.id) return false;
    if (where.name && record.name !== where.name) return false;
    if (where.NOT?.id && record.id === where.NOT.id) return false;
    return true;
}

function matchesProduct(record: ProductRecord, where: any = {}) {
    if (where.id && record.id !== where.id) return false;
    if (where.variants?.some?.variantTypeId) {
        const targetId = where.variants.some.variantTypeId;
        const hasMatch = (record.variants || []).some((variant: any) => variant.variantTypeId === targetId);
        if (!hasMatch) return false;
    }
    return true;
}

function matchesCategory(record: CategoryRecord, where: any = {}) {
    if (where.id && record.id !== where.id) return false;
    if (where.name && record.name !== where.name) return false;
    if (where.NOT) {
        const notClause = Array.isArray(where.NOT) ? where.NOT : [where.NOT];
        for (const clause of notClause) {
            if (clause.id && record.id === clause.id) {
                return false;
            }
        }
    }
    return true;
}

class VariantTypeModel {
    private data: VariantTypeRecord[] = [];

    async create({ data }: { data: Partial<VariantTypeRecord> & { name: string; items: any[] } }) {
        const record: VariantTypeRecord = {
            id: data.id ?? objectId(),
            name: data.name,
            items: data.items || [],
            createdAt: now(),
            updatedAt: now(),
        };
        this.data.push(record);
        return clone(record);
    }

    async findFirst({ where }: { where?: any }) {
        const found = this.data.find(record => matchesVariantType(record, where));
        return found ? clone(found) : null;
    }

    async findUnique({ where }: { where: any }) {
        return this.findFirst({ where });
    }

    async findMany({ orderBy }: { orderBy?: any } = {}) {
        let items = [...this.data];
        if (orderBy?.createdAt === 'desc') {
            items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return items.map(clone);
    }

    async update({ where, data }: { where: any; data: any }) {
        const index = this.data.findIndex(record => record.id === where.id);
        if (index === -1) {
            throw new Error('Record not found');
        }
        const updated: VariantTypeRecord = {
            ...this.data[index],
            ...data,
            updatedAt: now(),
        };
        this.data[index] = updated;
        return clone(updated);
    }

    async delete({ where }: { where: any }) {
        const index = this.data.findIndex(record => record.id === where.id);
        if (index === -1) {
            throw new Error('Record not found');
        }
        const [removed] = this.data.splice(index, 1);
        return clone(removed);
    }

    reset() {
        this.data = [];
    }
}

class ProductModel {
    private data: ProductRecord[] = [];

    async create({ data }: { data: Partial<ProductRecord> & { name: string; basePrice: number } }) {
        const record: ProductRecord = {
            id: data.id ?? objectId(),
            name: data.name,
            description: data.description ?? null,
            basePrice: data.basePrice,
            offerPrice: data.offerPrice ?? null,
            images: data.images ?? [],
            variants: data.variants ?? [],
            subCategoryIds: data.subCategoryIds ?? [],
            installationService: data.installationService,
            createdAt: now(),
            updatedAt: now(),
        };
        this.data.push(record);
        return clone(record);
    }

    async findUnique({ where }: { where: any }) {
        const found = this.data.find(record => record.id === where.id);
        return found ? clone(found) : null;
    }

    async findFirst({ where }: { where?: any }) {
        const found = this.data.find(record => matchesProduct(record, where));
        return found ? clone(found) : null;
    }

    async findMany({ orderBy, skip = 0, take }: { orderBy?: any; skip?: number; take?: number } = {}) {
        let items = [...this.data];
        if (orderBy?.createdAt === 'desc') {
            items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        const end = typeof take === 'number' ? skip + take : undefined;
        return items.slice(skip, end).map(clone);
    }

    async update({ where, data }: { where: any; data: any }) {
        const index = this.data.findIndex(record => record.id === where.id);
        if (index === -1) {
            throw new Error('Record not found');
        }
        const updated: ProductRecord = {
            ...this.data[index],
            ...data,
            updatedAt: now(),
        };
        this.data[index] = updated;
        return clone(updated);
    }

    async delete({ where }: { where: any }) {
        const index = this.data.findIndex(record => record.id === where.id);
        if (index === -1) {
            throw new Error('Record not found');
        }
        const [removed] = this.data.splice(index, 1);
        return clone(removed);
    }

    async count() {
        return this.data.length;
    }

    reset() {
        this.data = [];
    }
}

class CategoryModel {
    private data: CategoryRecord[] = [];

    async create({ data }: { data: Partial<CategoryRecord> & { name: string; subCategories: SubCategoryRecord[] } }) {
        const record: CategoryRecord = {
            id: data.id ?? objectId(),
            name: data.name,
            subCategories: data.subCategories ?? [],
            createdAt: now(),
            updatedAt: now(),
        };
        this.data.push(record);
        return clone(record);
    }

    async findFirst({ where }: { where?: any }) {
        const found = this.data.find(record => matchesCategory(record, where));
        return found ? clone(found) : null;
    }

    async findUnique({ where }: { where: any }) {
        return this.findFirst({ where });
    }

    async findMany({ orderBy }: { orderBy?: any } = {}) {
        let items = [...this.data];
        if (orderBy?.name === 'asc') {
            items.sort((a, b) => a.name.localeCompare(b.name));
        }
        return items.map(clone);
    }

    async update({ where, data }: { where: any; data: any }) {
        const index = this.data.findIndex(record => record.id === where.id);
        if (index === -1) {
            throw new Error('Record not found');
        }
        const updated: CategoryRecord = {
            ...this.data[index],
            ...data,
            updatedAt: now(),
        };
        this.data[index] = updated;
        return clone(updated);
    }

    async delete({ where }: { where: any }) {
        const index = this.data.findIndex(record => record.id === where.id);
        if (index === -1) {
            throw new Error('Record not found');
        }
        const [removed] = this.data.splice(index, 1);
        return clone(removed);
    }

    reset() {
        this.data = [];
    }
}

const productModel = new ProductModel();
const variantTypeModel = new VariantTypeModel();
const categoryModel = new CategoryModel();

export const prisma = {
    product: productModel,
    variantType: variantTypeModel,
    category: categoryModel,
    async $disconnect() {
        return;
    },
};

export function resetMockDb() {
    productModel.reset();
    variantTypeModel.reset();
    categoryModel.reset();
}
