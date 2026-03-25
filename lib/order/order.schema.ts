import { z } from 'zod';
import { BillingDetailsSchema } from '@/lib/billing-details/billing-details.schema';
import { InstallationOptionSchema } from '@/lib/cart/cart.schema';

export const OrderStatusSchema = z.enum([
    'pending',
    'paid',
    'shipped',
    'cancellation_requested',
    'cancellation_approved',
    'cancelled',
    'refund_failed',
    'failed',
    'completed',
]);

export const OrderCancellationSchema = z.object({
    requestedAt: z.string().min(1).optional(),
    approvedAt: z.string().min(1).optional(),
    completedAt: z.string().min(1).optional(),
    rejectedAt: z.string().min(1).optional(),
    requestReason: z.string().optional(),
    adminDecision: z.enum(['pending', 'approved', 'rejected']).optional(),
    adminNote: z.string().optional(),
    requestedBySessionId: z.string().optional(),
    requestedByUserId: z.string().optional(),
});

export const OrderRefundSchema = z.object({
    status: z.enum(['not_requested', 'pending', 'partial', 'succeeded', 'failed']),
    provider: z.enum(['stripe', 'tabby']).optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
    requestedAt: z.string().min(1).optional(),
    processedAt: z.string().min(1).optional(),
    externalRefundId: z.string().optional(),
    failureCode: z.string().optional(),
    failureMessage: z.string().optional(),
});

export const OrderItemSchema = z.object({
    productId: z.string().min(1),
    productName: z.string(),
    productImage: z.string().optional(),
    variantName: z.string().optional(),
    selectedVariantItemIds: z.array(z.string().min(1)).default([]),
    quantity: z.number().int().min(1),
    unitPrice: z.number(),
    installationOption: InstallationOptionSchema.default('none'),
    installationLocationId: z.string().optional(),
    installationLocationName: z.string().optional(),
    installationLocationDelta: z.number().min(0).default(0),
    installationAddOnPrice: z.number().min(0).default(0),
});

export const OrderShippingSchema = z.object({
    provider: z.literal('smsa'),
    awb: z.string().min(1),
    createdAt: z.string().min(1),
    labelPdf: z.string().optional(),
    status: z.string().optional(),
    lastTrackedAt: z.string().optional(),
});

export const OrderSchema = z.object({
    id: z.string().min(1),
    sessionId: z.string().min(1),
    stripeSessionId: z.string().min(1).optional(),
    items: z.array(OrderItemSchema),
    subtotalAmount: z.number().optional(),
    shippingAmount: z.number().optional(),
    vatAmount: z.number().optional(),
    vatRatePercent: z.number().optional(),
    vatIncludedInPrice: z.boolean().optional(),
    countryCode: z.string().optional(),
    totalAmount: z.number(),
    currency: z.string(),
    status: OrderStatusSchema,
    shipping: OrderShippingSchema.optional(),
    cancellation: OrderCancellationSchema.optional(),
    refund: OrderRefundSchema.optional(),
    billingDetails: BillingDetailsSchema.optional(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
});

export const UpdateOrderStatusSchema = z.object({
    status: z.literal('completed'),
});

export const RequestOrderCancellationSchema = z.object({
    reason: z.string().trim().min(1).max(1000),
});

export const ReviewOrderCancellationSchema = z.object({
    decision: z.enum(['approve', 'reject']),
    note: z.string().trim().min(1).max(1000).optional(),
});

export const AdminOrderListResponseSchema = z.object({
    orders: z.array(OrderSchema),
    pagination: z.object({
        page: z.number().int().min(1),
        limit: z.number().int().min(1),
        total: z.number().int().min(0),
        totalPages: z.number().int().min(0),
    }),
});

export type OrderItemDto = z.infer<typeof OrderItemSchema>;
export type OrderDto = z.infer<typeof OrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;
export type RequestOrderCancellationInput = z.infer<typeof RequestOrderCancellationSchema>;
export type ReviewOrderCancellationInput = z.infer<typeof ReviewOrderCancellationSchema>;
export type AdminOrderListResponse = z.infer<typeof AdminOrderListResponseSchema>;
