import { z } from 'zod';

export const BlogStatusSchema = z.enum(['draft', 'published']);

export const CreateBlogSchema = z.object({
    title: z.string().trim().min(1, 'Blog title is required'),
    excerpt: z.string().trim().min(1, 'Blog excerpt is required').max(500, 'Excerpt must be 500 characters or less'),
    content: z.string().trim().min(1, 'Blog content is required'),
    coverImageUrl: z.string().trim().optional(),
    status: BlogStatusSchema.default('draft'),
});

export const UpdateBlogSchema = CreateBlogSchema.partial().extend({
    status: BlogStatusSchema.optional(),
});

export type CreateBlogInput = z.infer<typeof CreateBlogSchema>;
export type UpdateBlogInput = z.infer<typeof UpdateBlogSchema>;
