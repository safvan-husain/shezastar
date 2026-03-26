import { z } from 'zod';

export const ActivityActionTypeSchema = z.enum([
    'product.created',
    'product.updated',
    'product.deleted',
    'product.bulk_price_updated',
    'order.created',
    'order.status_updated',
    'order.shipment_created',
    'order.cancellation_reviewed',
]);

export const ActivityActorTypeSchema = z.enum(['admin', 'system', 'customer']);
export const ActivityEntityKindSchema = z.enum(['product', 'order']);

export const ActivityActorSchema = z.object({
    type: ActivityActorTypeSchema,
    adminId: z.string().optional(),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    displayName: z.string().optional(),
});

export const ActivityEntitySchema = z.object({
    kind: ActivityEntityKindSchema,
    id: z.string().min(1),
    label: z.string().min(1),
});

export const ActivityDiffEntrySchema = z.object({
    field: z.string().min(1),
    before: z.unknown().optional(),
    after: z.unknown().optional(),
});

export const ActivityLogSchema = z.object({
    id: z.string().min(1),
    actionType: ActivityActionTypeSchema,
    actor: ActivityActorSchema,
    primaryEntity: ActivityEntitySchema,
    relatedEntities: z.array(ActivityEntitySchema),
    summary: z.string().min(1),
    details: z.record(z.string(), z.unknown()).optional(),
    diff: z.array(ActivityDiffEntrySchema).optional(),
    createdAt: z.string().min(1),
});

export const ActivityListQuerySchema = z.object({
    entityKind: ActivityEntityKindSchema.optional(),
    entityId: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const ActivityListResponseSchema = z.object({
    activities: z.array(ActivityLogSchema),
});

export const DashboardOrderStatusCountSchema = z.object({
    status: z.string().min(1),
    count: z.number().int().min(0),
});

export const DashboardSalesPointSchema = z.object({
    date: z.string().min(1),
    totalAmount: z.number().min(0),
    orderCount: z.number().int().min(0),
});

export const DashboardAnalyticsSchema = z.object({
    ordersByStatus: z.array(DashboardOrderStatusCountSchema),
    salesTrend: z.array(DashboardSalesPointSchema),
    recentActivity: z.array(ActivityLogSchema),
});

export type ActivityLogDto = z.infer<typeof ActivityLogSchema>;
export type ActivityListQuery = z.infer<typeof ActivityListQuerySchema>;
export type DashboardAnalyticsDto = z.infer<typeof DashboardAnalyticsSchema>;
