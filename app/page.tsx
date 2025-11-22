import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          ShezaStar E-Commerce
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Vehicle Electronic Gadgets Store
        </p>
        <div className="space-y-4">
          <a
            href="/products"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Admin Panel
          </a>
          <p className="text-sm text-gray-500">
            Manage products, variants, and images
          </p>
        </div>
      </div>
    </div>
  );
}
