// app/(admin)/categories/[id]/edit/page.tsx
import { Card } from '@/components/ui/Card';
import { CategoryForm } from '../../components/CategoryForm';
import { Suspense } from 'react';

async function getCategoryData(id: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/categories/${id}`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        return null;
    }

    return res.json();
}

async function CategoryEditContent({ id }: { id: string }) {
    const category = await getCategoryData(id);

    if (!category) {
        return <div>Category not found</div>;
    }

    return <CategoryForm initialData={category} />;
}

export default async function EditCategoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Edit Category</h1>
                <p className="text-[var(--muted-foreground)] mt-1">
                    Update category details and subcategories
                </p>
            </div>

            <Card>
                <Suspense fallback={<div>Loading...</div>}>
                    <CategoryEditContent id={id} />
                </Suspense>
            </Card>
        </div>
    );
}
