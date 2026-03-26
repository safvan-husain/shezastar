import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import type { AdminDocument } from '@/lib/auth/admin-auth-core';
import type { OrderDocument } from '@/lib/order/model/order.model';
import type { ProductDocument } from '@/lib/product/model/product.model';
import { enforceServerOnly } from '@/lib/utils/server-only';
import {
    type ActivityActionType,
    type ActivityActor,
    type ActivityActorDocument,
    type ActivityDiffEntry,
    type ActivityDiffEntryDocument,
    type ActivityEntity,
    type ActivityEntityDocument,
    type ActivityLog,
    type ActivityLogDocument,
    type DashboardAnalytics,
    toActivityLog,
} from './model/activity.model';

enforceServerOnly('activity.service');

const COLLECTION = 'activity_logs';
const SALES_LOOKBACK_DAYS = 90;
const RECENT_ACTIVITY_LIMIT = 8;

const NON_SALES_ORDER_STATUSES = new Set([
    'pending',
    'cancelled',
    'failed',
    'refund_failed',
    'cancellation_requested',
    'cancellation_approved',
]);

let indexesEnsured = false;

export interface ActivityLogInput {
    actionType: ActivityActionType;
    actor: ActivityActor;
    primaryEntity: ActivityEntity;
    relatedEntities?: ActivityEntity[];
    summary: string;
    details?: Record<string, unknown>;
    diff?: ActivityDiffEntry[];
}

export interface ActivityListFilters {
    entityKind?: ActivityEntity['kind'];
    entityId?: string;
    limit?: number;
}

function normalizeUnknown(value: unknown): unknown {
    if (value === undefined || value === null) {
        return value;
    }

    if (value instanceof Date) {
        return value.toISOString();
    }

    if (Array.isArray(value)) {
        return value.map(normalizeUnknown);
    }

    if (typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => [key, normalizeUnknown(nestedValue)])
        );
    }

    return value;
}

function toActivityActorDocument(actor: ActivityActor): ActivityActorDocument {
    return {
        type: actor.type,
        adminId: actor.adminId && ObjectId.isValid(actor.adminId) ? new ObjectId(actor.adminId) : undefined,
        userId: actor.userId && ObjectId.isValid(actor.userId) ? new ObjectId(actor.userId) : undefined,
        sessionId: actor.sessionId,
        displayName: actor.displayName,
    };
}

function toActivityEntityDocument(entity: ActivityEntity): ActivityEntityDocument {
    return {
        kind: entity.kind,
        id: entity.id,
        label: entity.label,
    };
}

function toActivityDiffDocument(diff: ActivityDiffEntry): ActivityDiffEntryDocument {
    return {
        field: diff.field,
        before: normalizeUnknown(diff.before),
        after: normalizeUnknown(diff.after),
    };
}

async function getActivityCollection() {
    const collection = await getCollection<ActivityLogDocument>(COLLECTION);
    if (!indexesEnsured) {
        await Promise.all([
            collection.createIndex({ createdAt: -1 }),
            collection.createIndex({ actionType: 1, createdAt: -1 }),
            collection.createIndex({ 'primaryEntity.kind': 1, 'primaryEntity.id': 1, createdAt: -1 }),
            collection.createIndex({ 'relatedEntities.kind': 1, 'relatedEntities.id': 1, createdAt: -1 }),
        ]);
        indexesEnsured = true;
    }
    return collection;
}

export function buildAdminActivityActor(admin: Pick<AdminDocument, '_id' | 'displayName'>): ActivityActor {
    return {
        type: 'admin',
        adminId: admin._id.toString(),
        displayName: admin.displayName?.trim() || 'Admin',
    };
}

export function buildCustomerActivityActor(input: {
    sessionId: string;
    userId?: string;
    displayName?: string;
}): ActivityActor {
    return {
        type: 'customer',
        sessionId: input.sessionId,
        userId: input.userId,
        displayName: input.displayName?.trim() || 'Customer',
    };
}

export function buildSystemActivityActor(displayName = 'System'): ActivityActor {
    return {
        type: 'system',
        displayName,
    };
}

export async function createActivityLog(input: ActivityLogInput): Promise<ActivityLog> {
    const collection = await getActivityCollection();
    const doc: ActivityLogDocument = {
        _id: new ObjectId(),
        actionType: input.actionType,
        actor: toActivityActorDocument(input.actor),
        primaryEntity: toActivityEntityDocument(input.primaryEntity),
        relatedEntities: (input.relatedEntities ?? []).map(toActivityEntityDocument),
        summary: input.summary,
        details: input.details ? normalizeUnknown(input.details) as Record<string, unknown> : undefined,
        diff: input.diff?.map(toActivityDiffDocument),
        createdAt: new Date(),
    };

    await collection.insertOne(doc);
    return toActivityLog(doc);
}

export async function listActivityLogs(filters: ActivityListFilters = {}): Promise<ActivityLog[]> {
    const collection = await getActivityCollection();
    const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);

    const query: Record<string, unknown> = {};
    if (filters.entityKind && filters.entityId) {
        query.$or = [
            { 'primaryEntity.kind': filters.entityKind, 'primaryEntity.id': filters.entityId },
            { relatedEntities: { $elemMatch: { kind: filters.entityKind, id: filters.entityId } } },
        ];
    } else if (filters.entityKind) {
        query['primaryEntity.kind'] = filters.entityKind;
    }

    const docs = await collection.find(query).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs.map(toActivityLog);
}

export async function getActivityLogById(id: string): Promise<ActivityLog> {
    if (!ObjectId.isValid(id)) {
        throw new AppError(400, 'INVALID_ACTIVITY_ID', { id });
    }

    const collection = await getActivityCollection();
    const doc = await collection.findOne({ _id: new ObjectId(id) });
    if (!doc) {
        throw new AppError(404, 'ACTIVITY_NOT_FOUND', { id });
    }

    return toActivityLog(doc);
}

function startOfUtcDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
    const ordersCollection = await getCollection<OrderDocument>('orders');
    const [ordersByStatusDocs, recentActivity] = await Promise.all([
        ordersCollection
            .aggregate<{ _id: string; count: number }>([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1, _id: 1 } },
            ])
            .toArray(),
        listActivityLogs({ limit: RECENT_ACTIVITY_LIMIT }),
    ]);

    const startDate = startOfUtcDay(new Date());
    startDate.setUTCDate(startDate.getUTCDate() - (SALES_LOOKBACK_DAYS - 1));

    const salesDocs = await ordersCollection
        .aggregate<{ _id: string; totalAmount: number; orderCount: number }>([
            {
                $match: {
                    createdAt: { $gte: startDate },
                    status: { $nin: Array.from(NON_SALES_ORDER_STATUSES) },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt',
                            timezone: 'UTC',
                        },
                    },
                    totalAmount: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ])
        .toArray();

    const salesByDate = new Map(salesDocs.map((doc) => [doc._id, doc]));
    const salesTrend = Array.from({ length: SALES_LOOKBACK_DAYS }, (_, index) => {
        const bucket = new Date(startDate);
        bucket.setUTCDate(startDate.getUTCDate() + index);
        const key = bucket.toISOString().slice(0, 10);
        const existing = salesByDate.get(key);
        return {
            date: key,
            totalAmount: existing?.totalAmount ?? 0,
            orderCount: existing?.orderCount ?? 0,
        };
    });

    return {
        ordersByStatus: ordersByStatusDocs.map((item) => ({
            status: item._id,
            count: item.count,
        })),
        salesTrend,
        recentActivity,
    };
}

function summarizeProductField(field: keyof ProductDocument, value: unknown): unknown {
    if (value == null) {
        return value;
    }

    switch (field) {
        case 'images': {
            const images = Array.isArray(value) ? value as ProductDocument['images'] : [];
            return {
                count: images.length,
                mappedCount: images.filter((image) => (image.mappedVariants ?? []).length > 0).length,
            };
        }
        case 'variants': {
            const variants = Array.isArray(value) ? value as ProductDocument['variants'] : [];
            return variants.map((variant) => ({
                variantTypeName: variant.variantTypeName,
                selectedItems: variant.selectedItems.map((item) => item.name),
            }));
        }
        case 'variantStock': {
            const stock = Array.isArray(value) ? value as ProductDocument['variantStock'] : [];
            return stock.map((entry) => ({
                variantCombinationKey: entry.variantCombinationKey,
                stockCount: entry.stockCount,
                price: entry.price,
            }));
        }
        case 'specifications': {
            const specs = (Array.isArray(value) ? value : []) as NonNullable<ProductDocument['specifications']>;
            return specs.map((spec) => ({
                title: spec.title,
                items: spec.items,
            }));
        }
        default:
            return normalizeUnknown(value);
    }
}

export function buildProductActivityDiff(
    previous: ProductDocument,
    next: ProductDocument,
    fields?: Array<keyof ProductDocument>,
): ActivityDiffEntry[] {
    const candidateFields = fields ?? [
        'name',
        'subtitle',
        'description',
        'basePrice',
        'offerPercentage',
        'images',
        'variants',
        'subCategoryIds',
        'installationService',
        'variantStock',
        'weight',
        'specifications',
        'brandId',
    ];

    const diff: ActivityDiffEntry[] = [];
    for (const field of candidateFields) {
        const before = summarizeProductField(field, previous[field]);
        const after = summarizeProductField(field, next[field]);
        if (JSON.stringify(before) !== JSON.stringify(after)) {
            diff.push({
                field,
                before,
                after,
            });
        }
    }
    return diff;
}
