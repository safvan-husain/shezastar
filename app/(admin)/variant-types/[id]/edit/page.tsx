// app/(admin)/variant-types/[id]/edit/page.tsx
import { VariantTypeForm } from '../../components/VariantTypeForm';

async function getVariantType(id: string) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/variant-types/${id}`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error('Failed to fetch variant type');
    }

    return res.json();
}

export default async function EditVariantTypePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const variantType = await getVariantType(id);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Edit Variant Type</h1>
            <VariantTypeForm initialData={variantType} />
        </div>
    );
}
