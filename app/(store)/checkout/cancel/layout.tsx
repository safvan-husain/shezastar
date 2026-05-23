import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata({
    title: 'Checkout Cancelled | Sheza Star',
});

export default function CheckoutCancelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
