import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors/app-error';
import {
    AddItemInput,
    CreateVariantTypeInput,
    UpdateVariantTypeInput,
    VariantItemDTO,
    VariantItemInput,
} from '@/lib/validations/variant-type.schema';

function ensureValidId(id: string) {
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
        throw new AppError(400, 'INVALID_ID');
    }
}

function normalizeItems(items: VariantItemInput[] = []): VariantItemDTO[] {
    return items.map(item => ({
        id: item.id && item.id.trim().length > 0 ? item.id : nanoid(),
        name: item.name,
        metadata: item.metadata,
    }));
}

export async function createVariantType(input: CreateVariantTypeInput) {
    const existing = await prisma.variantType.findFirst({ where: { name: input.name } });
    if (existing) {
        throw new AppError(409, 'VARIANT_TYPE_EXISTS', { name: input.name });
    }

    const created = await prisma.variantType.create({
        data: {
            name: input.name,
            items: normalizeItems(input.items),
        },
    });

    return created;
}

export async function getVariantType(id: string) {
    ensureValidId(id);
    const variantType = await prisma.variantType.findUnique({ where: { id } });

    if (!variantType) {
        throw new AppError(404, 'VARIANT_TYPE_NOT_FOUND');
    }

    return variantType;
}

export async function getAllVariantTypes() {
    return prisma.variantType.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function updateVariantType(id: string, input: UpdateVariantTypeInput) {
    ensureValidId(id);
    const existing = await prisma.variantType.findUnique({ where: { id } });

    if (!existing) {
        throw new AppError(404, 'VARIANT_TYPE_NOT_FOUND');
    }

    if (input.name && input.name !== existing.name) {
        const duplicate = await prisma.variantType.findFirst({
            where: { name: input.name, NOT: { id } },
        });

        if (duplicate) {
            throw new AppError(409, 'VARIANT_TYPE_EXISTS', { name: input.name });
        }
    }

    const items = input.items ? normalizeItems(input.items) : undefined;

    const updated = await prisma.variantType.update({
        where: { id },
        data: {
            name: input.name ?? existing.name,
            items: items ?? existing.items,
        },
    });

    return updated;
}

export async function deleteVariantType(id: string) {
    ensureValidId(id);
    const existing = await prisma.variantType.findUnique({ where: { id } });

    if (!existing) {
        throw new AppError(404, 'VARIANT_TYPE_NOT_FOUND');
    }

    const productUsingVariant = await prisma.product.findFirst({
        where: {
            variants: {
                some: { variantTypeId: id },
            },
        },
    });

    if (productUsingVariant) {
        throw new AppError(400, 'VARIANT_TYPE_IN_USE', {
            message: 'Cannot delete variant type that is used by products',
        });
    }

    await prisma.variantType.delete({ where: { id } });

    return { success: true } as const;
}

export async function addItemToVariantType(id: string, item: AddItemInput) {
    ensureValidId(id);
    const existing = await prisma.variantType.findUnique({ where: { id } });

    if (!existing) {
        throw new AppError(404, 'VARIANT_TYPE_NOT_FOUND');
    }

    const newItem: VariantItemDTO = {
        id: nanoid(),
        name: item.name,
        metadata: item.metadata,
    };

    const updated = await prisma.variantType.update({
        where: { id },
        data: {
            items: [...existing.items, newItem],
        },
    });

    return updated;
}

export async function removeItemFromVariantType(id: string, itemId: string) {
    ensureValidId(id);
    const existing = await prisma.variantType.findUnique({ where: { id } });

    if (!existing) {
        throw new AppError(404, 'VARIANT_TYPE_NOT_FOUND');
    }

    const items = existing.items ?? [];
    const itemExists = items.some(item => item.id === itemId);

    if (!itemExists) {
        throw new AppError(404, 'VARIANT_ITEM_NOT_FOUND');
    }

    const updated = await prisma.variantType.update({
        where: { id },
        data: {
            items: items.filter(item => item.id !== itemId),
        },
    });

    return updated;
}
