import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata({
    title: 'Order Confirmed | Sheza Star',
});

export default function CheckoutSuccessLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
