// app/(admin)/categories/page.tsx
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { CategoryList } from './components/CategoryList';

export default function CategoriesPage() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto my-12">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Categories</h1>
                    <p className="text-[var(--muted-foreground)] mt-1">
                        Manage product categories and subcategories
                    </p>
                </div>
                <Link href="/manage/categories/new">
                    <Button size="lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Category
                    </Button>
                </Link>
            </div>

            <Card>
                <CategoryList />
            </Card>
        </div>
    );
}
