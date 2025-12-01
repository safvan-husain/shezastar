// app/(admin)/categories/[id]/edit/page.tsx
import { Card } from '@/components/ui/Card';
import { CategoryForm } from '../../components/CategoryForm';
import { Suspense } from 'react';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';

type CategoryFormData = NonNullable<Parameters<typeof CategoryForm>[0]['initialData']>;

async function getCategoryData(id: string): Promise<{ category: CategoryFormData | null; error: ToastErrorPayload | null }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/categories/${id}`;

    try {
        const res = await fetch(url, {
            cache: 'no-store',
        });

        if (!res.ok) {
            let body: any = {};
            try {
                body = await res.json();
            } catch {
                body = { error: 'Failed to parse response body' };
            }

            return {
                category: null,
                error: {
                    message: body.message || body.error || 'Failed to load category',
                    status: res.status,
                    body,
                    url: res.url,
                    method: 'GET',
                },
            };
        }

        return { category: (await res.json()) as CategoryFormData, error: null };
    } catch (error) {
        return {
            category: null,
            error: {
                message: error instanceof Error ? error.message : 'Failed to load category',
                body: error instanceof Error ? { stack: error.stack } : { error },
                url,
                method: 'GET',
            },
        };
    }
}

async function CategoryEditContent({ id }: { id: string }) {
    const { category, error } = await getCategoryData(id);

    return (
        <>
            {error && <ErrorToastHandler error={error} />}
            {category ? (
                <CategoryForm initialData={category} />
            ) : (
                <div className="rounded-xl border-2 border-[var(--border-subtle)] p-4 text-[var(--muted-foreground)]">
                    Unable to load this category. Use the toast details to report the failure.
                </div>
            )}
        </>
    );
}

export default async function EditCategoryPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="max-w-2xl mx-auto space-y-6 my-12">
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
