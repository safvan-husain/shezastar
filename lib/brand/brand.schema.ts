// lib/brand/brand.schema.ts
import { z } from 'zod';

export const CreateBrandSchema = z.object({
    name: z.string().min(1, 'Brand name is required'),
    imageUrl: z.string().min(1, 'Brand image is required'),
});

export const UpdateBrandSchema = z.object({
    name: z.string().min(1).optional(),
    imageUrl: z.string().min(1).optional(),
});

export type CreateBrandInput = z.infer<typeof CreateBrandSchema>;
export type UpdateBrandInput = z.infer<typeof UpdateBrandSchema>;
