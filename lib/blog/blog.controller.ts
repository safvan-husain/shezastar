import { catchError } from '@/lib/errors/app-error';
import { CreateBlogSchema, UpdateBlogSchema } from './blog.schema';
import * as blogService from './blog.service';

export async function handleCreateBlog(input: unknown) {
    try {
        const parsed = CreateBlogSchema.parse(input);
        const result = await blogService.createBlog(parsed);
        return { status: 201, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetBlog(id: string) {
    try {
        const result = await blogService.getBlog(id);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetAllBlogs(status: 'draft' | 'published' | 'all' = 'published') {
    try {
        const result = await blogService.getAllBlogs({ status });
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleUpdateBlog(id: string, input: unknown) {
    try {
        const parsed = UpdateBlogSchema.parse(input);
        const result = await blogService.updateBlog(id, parsed);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleDeleteBlog(id: string) {
    try {
        const result = await blogService.deleteBlog(id);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}
