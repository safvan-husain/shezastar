import { z } from 'zod';
import { BillingDetailsSchema } from '@/lib/billing-details/billing-details.schema';

export const CartItemSchema = z.object({
    productId: z.string().min(1),
    selectedVariantItemIds: z.array(z.string().min(1)).default([]),
    quantity: z.number().int().min(1),
    unitPrice: z.number(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
});

export const CartSchema = z.object({
    id: z.string().min(1),
    sessionId: z.string().min(1),
    userId: z.string().optional(),
    items: z.array(CartItemSchema),
    billingDetails: BillingDetailsSchema.optional(),
    subtotal: z.number(),
    totalItems: z.number().int().min(0),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
});

export const AddToCartSchema = z.object({
    productId: z.string().min(1),
    selectedVariantItemIds: z.array(z.string().min(1)).default([]),
    quantity: z.number().int().min(1),
});

export const UpdateCartItemSchema = z.object({
    productId: z.string().min(1),
    selectedVariantItemIds: z.array(z.string().min(1)).default([]),
    quantity: z.number().int(),
});

export const RemoveFromCartSchema = z.object({
    productId: z.string().min(1),
    selectedVariantItemIds: z.array(z.string().min(1)).default([]),
});

export const ClearCartSchema = z.object({});

export type CartItemDto = z.infer<typeof CartItemSchema>;
export type CartDto = z.infer<typeof CartSchema>;
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type RemoveFromCartInput = z.infer<typeof RemoveFromCartSchema>;
