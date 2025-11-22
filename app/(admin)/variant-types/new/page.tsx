// app/(admin)/variant-types/new/page.tsx
import { VariantTypeForm } from '../components/VariantTypeForm';

export default function NewVariantTypePage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Create Variant Type</h1>
            <VariantTypeForm />
        </div>
    );
}
