import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-[var(--text-primary)] mb-4">
          ShezaStar E-Commerce
        </h1>
        <p className="text-xl text-[var(--text-secondary)] mb-8">
          Vehicle Electronic Gadgets Store
        </p>
        <div className="space-y-4">
          <a
            href="/products"
            className="inline-block px-8 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold rounded-lg hover:bg-[var(--text-primary)] transition-colors"
          >
            Go to Admin Panel
          </a>
          <p className="text-sm text-[var(--text-muted)]">
            Manage products, variants, and images
          </p>
        </div>
      </div>
    </div>
  );
}
