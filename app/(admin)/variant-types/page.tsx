// app/(admin)/variant-types/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

async function getVariantTypes() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/variant-types`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        return [];
    }

    return res.json();
}

export default async function VariantTypesPage() {
    const variantTypes = await getVariantTypes();

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Variant Types</h1>
                <Link href="/variant-types/new">
                    <Button>Create Variant Type</Button>
                </Link>
            </div>

            {variantTypes.length === 0 ? (
                <Card>
                    <p className="text-gray-500 text-center py-8">
                        No variant types yet. Create your first variant type to get started.
                    </p>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {variantTypes.map((type: any) => (
                        <Card key={type.id}>
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-semibold">{type.name}</h2>
                                <Link href={`/variant-types/${type.id}/edit`}>
                                    <Button size="sm" variant="secondary">Edit</Button>
                                </Link>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600">
                                    {type.items.length} {type.items.length === 1 ? 'item' : 'items'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {type.items.slice(0, 5).map((item: any) => (
                                        <span
                                            key={item.id}
                                            className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded"
                                        >
                                            {item.name}
                                        </span>
                                    ))}
                                    {type.items.length > 5 && (
                                        <span className="px-2 py-1 text-gray-500 text-sm">
                                            +{type.items.length - 5} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
