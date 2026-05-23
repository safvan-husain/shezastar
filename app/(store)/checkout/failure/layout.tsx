import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata({
    title: 'Checkout Failed | Sheza Star',
});

export default function CheckoutFailureLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
