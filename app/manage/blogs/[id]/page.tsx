import { notFound } from 'next/navigation';
import { getBlog } from '@/lib/blog/blog.service';
import { BlogForm } from '../components/BlogForm';

interface EditBlogPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
    const { id } = await params;
    const blog = await getBlog(id).catch(() => null);

    if (!blog) {
        notFound();
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">Edit Blog</h1>
                <p className="text-[var(--text-secondary)]">Update blog details and publishing status.</p>
            </div>
            <BlogForm initialData={blog} />
        </div>
    );
}
