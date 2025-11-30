// app/(admin)/categories/[id]/edit/page.tsx
import { Card } from '@/components/ui/Card';
import { notFound } from 'next/navigation';
import { getCategoryById } from '@/lib/queries/category.queries';
import { CategoryForm } from '../../components/CategoryForm';

export default async function EditCategoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const category = await getCategoryById(id);

    if (!category) {
        notFound();
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Edit Category</h1>
                <p className="text-[var(--muted-foreground)] mt-1">
                    Update category details and subcategories
                </p>
            </div>

            <Card>
                <CategoryForm initialData={category} />
            </Card>
        </div>
    );
}
