import type { Metadata } from 'next';
import { buildNoIndexMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = buildNoIndexMetadata({
    title: 'Tabby Checkout Failed | Sheza Star',
});

export default function CheckoutTabbyFailureLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
