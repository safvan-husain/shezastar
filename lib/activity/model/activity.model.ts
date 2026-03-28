import { ObjectId } from '@/lib/db/mongo-client';

export type ActivityActionType =
    | 'product.created'
    | 'product.updated'
    | 'product.deleted'
    | 'product.bulk_price_updated'
    | 'order.created'
    | 'order.status_updated'
    | 'order.shipment_created'
    | 'order.cancellation_reviewed'
    | 'order.return_requested'
    | 'order.return_reviewed'
    | 'order.refund_initiated';

export type ActivityActorType = 'admin' | 'system' | 'customer';
export type ActivityEntityKind = 'product' | 'order';

export interface ActivityActorDocument {
    type: ActivityActorType;
    adminId?: ObjectId;
    userId?: ObjectId;
    sessionId?: string;
    displayName?: string;
}

export interface ActivityEntityDocument {
    kind: ActivityEntityKind;
    id: string;
    label: string;
}

export interface ActivityDiffEntryDocument {
    field: string;
    before?: unknown;
    after?: unknown;
}

export interface ActivityLogDocument {
    _id: ObjectId;
    actionType: ActivityActionType;
    actor: ActivityActorDocument;
    primaryEntity: ActivityEntityDocument;
    relatedEntities: ActivityEntityDocument[];
    summary: string;
    details?: Record<string, unknown>;
    diff?: ActivityDiffEntryDocument[];
    createdAt: Date;
}

export interface ActivityActor {
    type: ActivityActorType;
    adminId?: string;
    userId?: string;
    sessionId?: string;
    displayName?: string;
}

export interface ActivityEntity {
    kind: ActivityEntityKind;
    id: string;
    label: string;
}

export interface ActivityDiffEntry {
    field: string;
    before?: unknown;
    after?: unknown;
}

export interface ActivityLog {
    id: string;
    actionType: ActivityActionType;
    actor: ActivityActor;
    primaryEntity: ActivityEntity;
    relatedEntities: ActivityEntity[];
    summary: string;
    details?: Record<string, unknown>;
    diff?: ActivityDiffEntry[];
    createdAt: string;
}

export interface ActivityListResult {
    activities: ActivityLog[];
}

export interface DashboardOrderStatusCount {
    status: string;
    count: number;
}

export interface DashboardSalesPoint {
    date: string;
    totalAmount: number;
    orderCount: number;
}

export interface DashboardAnalytics {
    ordersByStatus: DashboardOrderStatusCount[];
    salesTrend: DashboardSalesPoint[];
    recentActivity: ActivityLog[];
}

export function toActivityActor(doc: ActivityActorDocument): ActivityActor {
    return {
        type: doc.type,
        adminId: doc.adminId?.toHexString(),
        userId: doc.userId?.toHexString(),
        sessionId: doc.sessionId,
        displayName: doc.displayName,
    };
}

export function toActivityEntity(doc: ActivityEntityDocument): ActivityEntity {
    return {
        kind: doc.kind,
        id: doc.id,
        label: doc.label,
    };
}

export function toActivityLog(doc: ActivityLogDocument): ActivityLog {
    return {
        id: doc._id.toHexString(),
        actionType: doc.actionType,
        actor: toActivityActor(doc.actor),
        primaryEntity: toActivityEntity(doc.primaryEntity),
        relatedEntities: doc.relatedEntities.map(toActivityEntity),
        summary: doc.summary,
        details: doc.details,
        diff: doc.diff,
        createdAt: doc.createdAt.toISOString(),
    };
}
