// app/manage/brands/[id]/page.tsx
import { BrandForm } from '../components/BrandForm';
import { handleGetBrand } from '@/lib/brand/brand.controller';
import { notFound } from 'next/navigation';

interface EditBrandPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditBrandPage({ params }: EditBrandPageProps) {
    const { id } = await params;
    const { status, body } = await handleGetBrand(id);

    if (status !== 200 || !body || 'error' in body) {
        notFound();
    }

    const brand = body as { id?: string; name: string; imageUrl: string };

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">Edit Brand</h1>
                <p className="text-[var(--muted-foreground)]">Update brand details</p>
            </div>
            <BrandForm initialData={brand} />
        </div>
    );
}
