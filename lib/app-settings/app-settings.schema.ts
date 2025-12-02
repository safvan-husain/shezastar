import { z } from 'zod';

export const HeroBannerSchema = z.object({
    imagePath: z.string().min(1, 'Image path is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.number().min(0, 'Price must be positive'),
    offerPrice: z.number().min(0, 'Offer price must be positive'),
    offerLabel: z.string().min(1, 'Offer label is required'),
});

export const HeroBannerWithIdSchema = HeroBannerSchema.extend({
    id: z.string().min(1, 'ID is required'),
});

export const CreateHeroBannerSchema = HeroBannerSchema;

export const UpdateHeroBannerSchema = HeroBannerSchema;

export type HeroBanner = z.infer<typeof HeroBannerSchema>;
export type HeroBannerWithId = z.infer<typeof HeroBannerWithIdSchema>;
export type CreateHeroBannerInput = z.infer<typeof CreateHeroBannerSchema>;
export type UpdateHeroBannerInput = z.infer<typeof UpdateHeroBannerSchema>;
