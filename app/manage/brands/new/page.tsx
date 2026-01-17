// app/manage/brands/new/page.tsx
import { BrandForm } from '../components/BrandForm';

export default function NewBrandPage() {
    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">New Brand</h1>
                <p className="text-[var(--muted-foreground)]">Create a new brand for your products</p>
            </div>
            <BrandForm />
        </div>
    );
}
