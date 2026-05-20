import { CategoryPageSkeleton } from '../components/CategoryPageSkeleton';

export default function CategoryLoading() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-8 mt-24">
      <CategoryPageSkeleton />
    </div>
  );
}
