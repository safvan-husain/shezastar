
import Link from 'next/link';

export default function CancelPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center mt-24">
            <h1 className="text-4xl font-bold mb-4">Order Cancelled</h1>
            <p className="text-lg text-gray-600 mb-8">
                You have cancelled the checkout process.
            </p>
            <Link
                href="/cart"
                className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
                Return to Cart
            </Link>
        </div>
    );
}
