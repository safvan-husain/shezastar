// app/manage/brands/page.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { handleGetAllBrands } from '@/lib/brand/brand.controller';
import Image from 'next/image';

export default async function BrandsPage() {
    const { body } = await handleGetAllBrands();
    const brands = Array.isArray(body) ? body : [];

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">Brands</h1>
                    <p className="text-[var(--muted-foreground)]">Manage product brands and their logos</p>
                </div>
                <Link href="/manage/brands/new">
                    <Button>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Brand
                    </Button>
                </Link>
            </div>

            {brands.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-[var(--bg-subtle)] flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-[var(--muted-foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold">No brands found</h2>
                    <p className="text-[var(--muted-foreground)] max-w-sm mx-auto mt-2">
                        Get started by creating your first brand. You can then assign brands to your products.
                    </p>
                    <Link href="/manage/brands/new" className="mt-6">
                        <Button variant="outline">Create your first brand</Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {brands.map((brand: any) => (
                        <Link key={brand.id} href={`/manage/brands/${brand.id}`}>
                            <Card className="hover:border-[var(--primary)] transition-all cursor-pointer group h-full">
                                <div className="space-y-4">
                                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-[var(--bg-subtle)] flex items-center justify-center p-4">
                                        <Image
                                            src={brand.imageUrl}
                                            alt={brand.name}
                                            fill
                                            className="object-contain p-4 group-hover:scale-110 transition-transform"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-lg">{brand.name}</h3>
                                        <svg className="w-5 h-5 text-[var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
