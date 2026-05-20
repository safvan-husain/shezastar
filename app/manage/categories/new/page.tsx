// app/(admin)/categories/new/page.tsx
import { Card } from '@/components/ui/Card';
import { CategoryForm } from '../components/CategoryForm';

export default function NewCategoryPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6 my-12">
            <div>
                <h1 className="text-3xl font-bold">New Category</h1>
                <p className="text-[var(--muted-foreground)] mt-1">
                    Create a new product category with subcategories
                </p>
            </div>

            <Card>
                <CategoryForm />
            </Card>
        </div>
    );
}
