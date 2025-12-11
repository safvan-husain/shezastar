import { z } from 'zod';

export const OrderItemSchema = z.object({
    productId: z.string().min(1),
    productName: z.string(),
    productImage: z.string().optional(),
    variantName: z.string().optional(),
    selectedVariantItemIds: z.array(z.string().min(1)).default([]),
    quantity: z.number().int().min(1),
    unitPrice: z.number(),
});

export const OrderSchema = z.object({
    id: z.string().min(1),
    sessionId: z.string().min(1),
    stripeSessionId: z.string().min(1).optional(),
    items: z.array(OrderItemSchema),
    totalAmount: z.number(),
    currency: z.string(),
    status: z.enum(['pending', 'paid', 'cancelled', 'failed', 'completed']),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
});

export const UpdateOrderStatusSchema = z.object({
    status: z.enum(['pending', 'paid', 'cancelled', 'failed', 'completed']),
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
export type AdminOrderListResponse = z.infer<typeof AdminOrderListResponseSchema>;
