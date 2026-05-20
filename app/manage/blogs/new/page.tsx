import { BlogForm } from '../components/BlogForm';

export default function NewBlogPage() {
    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">New Blog</h1>
                <p className="text-[var(--text-secondary)]">Write a new storefront blog card.</p>
            </div>
            <BlogForm />
        </div>
    );
}
