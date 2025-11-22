// app/(admin)/products/new/page.tsx
import { ProductForm } from '../components/ProductForm';

export default function NewProductPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Create Product</h1>
            <ProductForm />
        </div>
    );
}
