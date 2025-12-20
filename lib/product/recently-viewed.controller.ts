import { ensureStorefrontSession } from '@/lib/storefront-session/storefront-session.service';
import { trackProductView, getRecentlyViewedProducts } from './recently-viewed.service';

export async function handleTrackProductView(payload: any) {
    try {
        const { productId } = payload;
        if (!productId) {
            return { status: 400, body: { error: 'PRODUCT_ID_REQUIRED' } };
        }

        const session = await ensureStorefrontSession();
        await trackProductView(session.sessionId, productId, session.userId);

        return { status: 200, body: { success: true } };
    } catch (error: any) {
        console.error('Track Product View Error:', error);
        return { status: 500, body: { error: 'INTERNAL_SERVER_ERROR' } };
    }
}

export async function handleGetRecentlyViewed() {
    try {
        const session = await ensureStorefrontSession();
        const products = await getRecentlyViewedProducts(session.sessionId, session.userId);
        return { status: 200, body: { products } };
    } catch (error: any) {
        console.error('Get Recently Viewed Error:', error);
        return { status: 500, body: { error: 'INTERNAL_SERVER_ERROR' } };
    }
}
