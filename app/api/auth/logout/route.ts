import { NextRequest, NextResponse } from 'next/server';
import { catchError } from '@/lib/errors/app-error';
import { getStorefrontSessionId, unbindSession } from '@/lib/storefront-session';

export async function POST(req: NextRequest) {
    try {
        const sessionId = await getStorefrontSessionId();
        if (sessionId) {
            await unbindSession(sessionId);
        }
        // Should we revoke the entire session/cookie?
        // Requirement: "Data lifetime is tied to the user account, not the 30-day session TTL"
        // If we just unbind, the user becomes anonymous guest again. 
        // They keep the SAME session ID? 
        // If they keep the same session ID, and they have a cart...
        // The cart is now linked to User (userId set). 
        // Guest lookup by sessionId will NOT find the user cart (because getCart priorities userId, but query by sessionId might find it?).
        // getCart logic: if session.userId... else findOne({sessionId}).
        // If unbind, session.userId is null.
        // findOne({sessionId}) finds the cart? 
        // Wait, mergeCarts -> "Guest cart becomes user cart" -> it HAS sessionId.
        // So if I logout (unbind), `getCart` falls back to `sessionId`. 
        // It finds the cart which has `sessionId` AND `userId`.
        // Does `toCart` strip userId? No. 
        // So the anonymous user will see the cart that belongs to the user?
        // SECURITY RISK: If I logout, I shouldn't see the user's cart anymore.

        // To prevent this: 
        // 1. The user cart should NOT have sessionId? 
        //    mergeCarts logic: "Guest cart becomes user cart" -> update { userId: ... }. It didn't unset sessionId.
        //    We should UNSET sessionId on the user cart during merge/bind?
        //    If we unset sessionId, then anonymous session (with that ID) won't find it.
        //    This is safer.

        //    Let's verify mergeCarts logic in cart.service.ts
        //    `await collection.updateOne({ _id: guestCart._id }, { $set: { userId: ... } })`
        //    It keeps sessionId.

        // FIX: We should regenerate the session ID on logout? Or just revoke it.
        // Standard practice: destroy session on logout.
        // So we should call `revokeStorefrontSession(sessionId)`.

        // Let's call revokeStorefrontSession. This clears cookie and marks session revoked.
        // Next request will get a fresh session.

        // But the code in `unbindSession` just removes `userId`. 
        // I should probably skip `unbindSession` and just use `revokeStorefrontSession`?
        // Or updated `unbindSession` to also rotate the session ID?

        // Let's use `revokeStorefrontSession` from `app/api/auth/logout`.
        // I will import it.

        const { revokeStorefrontSession } = await import('@/lib/storefront-session');
        await revokeStorefrontSession(sessionId || undefined);

        return NextResponse.json({ status: 'success' });
    } catch (err) {
        const { status, body } = catchError(err);
        return NextResponse.json(body, { status });
    }
}
