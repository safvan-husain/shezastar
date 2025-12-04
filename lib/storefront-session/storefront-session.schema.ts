import { z } from 'zod';

export const StorefrontSessionMetadataSchema = z
    .object({
        userAgent: z.string().min(1).max(512).optional(),
        ipHash: z.string().length(64).optional(),
    })
    .partial();

export const StorefrontSessionSchema = z.object({
    sessionId: z.string().min(1),
    status: z.enum(['active', 'revoked']),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
    expiresAt: z.string().min(1),
    lastActiveAt: z.string().min(1),
    cartId: z.string().optional(),
    wishlistId: z.string().optional(),
    metadata: StorefrontSessionMetadataSchema.optional(),
});

export const StorefrontSessionRequestMetadataSchema = z
    .object({
        userAgent: z.string().min(1).max(512).optional(),
        ipAddress: z.string().min(1).max(256).optional(),
    })
    .partial();

export const EnsureStorefrontSessionSchema = z
    .object({
        metadata: StorefrontSessionRequestMetadataSchema.optional(),
    })
    .partial();

export type StorefrontSessionMetadataInput = z.infer<typeof StorefrontSessionRequestMetadataSchema>;
export type StorefrontSessionResponse = z.infer<typeof StorefrontSessionSchema>;
export type EnsureStorefrontSessionInput = z.infer<typeof EnsureStorefrontSessionSchema>;
