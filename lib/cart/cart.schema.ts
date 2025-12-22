import { z } from 'zod';
import { BillingDetailsSchema } from '@/lib/billing-details/billing-details.schema';

export const InstallationOptionSchema = z.enum(['none', 'store', 'home']);
export type InstallationOption = z.infer<typeof InstallationOptionSchema>;

export const CartItemSchema = z.object({
    productId: z.string().min(1),
    selectedVariantItemIds: z.array(z.string().min(1)).default([]),
    quantity: z.number().int().min(1),
    unitPrice: z.number(),
    installationOption: InstallationOptionSchema.default('none'),
    installationLocationId: z.string().optional(),
    installationLocationDelta: z.number().min(0).default(0),
    installationAddOnPrice: z.number().min(0).default(0),
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
    installationOption: InstallationOptionSchema.default('none'),
    installationLocationId: z.string().optional(),
});

export const UpdateCartItemSchema = z.object({
    productId: z.string().min(1),
    selectedVariantItemIds: z.array(z.string().min(1)).default([]),
    quantity: z.number().int(),
    installationOption: InstallationOptionSchema.default('none'),
    installationLocationId: z.string().optional(),
});

export const RemoveFromCartSchema = z.object({
    productId: z.string().min(1),
    selectedVariantItemIds: z.array(z.string().min(1)).default([]),
    installationOption: InstallationOptionSchema.default('none'),
    installationLocationId: z.string().optional(),
});

export const ClearCartSchema = z.object({});

export type CartItemDto = z.infer<typeof CartItemSchema>;
export type CartDto = z.infer<typeof CartSchema>;
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type RemoveFromCartInput = z.infer<typeof RemoveFromCartSchema>;
