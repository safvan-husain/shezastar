import { getOrCreateStorefrontSession } from '@/app/actions/session';
import { getOrdersBySessionId } from '@/lib/order/order.service';
import Link from 'next/link';
import Image from 'next/image';
import { OrderCancellationRequestButton } from './components/OrderCancellationRequestButton';
import { OrderShipmentTracking } from './components/OrderShipmentTracking';

function formatStatus(status: string) {
    if (/^[A-Z]{2,3}$/.test(status)) {
        return status;
    }

    return status
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getReadableOrderStatus(order: { status: string; shipping?: { status?: string } }) {
    const normalized = formatStatus(order.status);
    if (/^[A-Z]{2,3}$/.test(order.status) && order.shipping?.status) {
        return `${normalized} - ${order.shipping.status}`;
    }

    return normalized;
}

export default async function OrdersPage() {
    const session = await getOrCreateStorefrontSession();
    const orders = await getOrdersBySessionId(session.sessionId);

    return (
        <div className="bg-white pt-20 pb-12 mt-22">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">My Orders</h1>

                {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                        </svg>
                        <h3 className="mt-2 text-sm font-semibold text-gray-900">No orders</h3>
                        <p className="mt-1 text-sm text-gray-500">You haven't placed any orders yet.</p>
                        <div className="mt-6">
                            <Link
                                href="/"
                                className="inline-flex items-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                            >
                                Start Shopping
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {orders.map((order) => {
                            const hasCancellationRequest = Boolean(
                                order.cancellation?.requestedAt,
                            );
                            
                            return (
                                <div
                                    key={order.id}
                                    className="bg-white border text-neutral-600 border-gray-200 rounded-lg overflow-hidden"
                                >
                                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                            Order #{order.id.slice(-6).toUpperCase()}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize
                        ${order.status === 'paid' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'AF' ? 'bg-indigo-100 text-indigo-800' :
                                order.status === 'OD' ? 'bg-sky-100 text-sky-800' :
                                order.status === 'DL' ? 'bg-emerald-100 text-emerald-800' :
                                order.status === 'requested_shipment' ? 'bg-violet-100 text-violet-800' :
                                order.status === 'cancellation_requested' ? 'bg-amber-100 text-amber-800' :
                                order.status === 'cancellation_approved' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'refund_failed' ? 'bg-red-100 text-red-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'}`}
                                        >
                                            {getReadableOrderStatus(order)}
                                        </span>
                                        <p className="text-sm font-medium text-gray-900">
                                            {order.totalAmount.toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: order.currency.toUpperCase(),
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="px-6 py-4">
                                    <div className="flow-root">
                                        <ul role="list" className="-my-4 divide-y divide-gray-200">
                                            {order.items.map((item) => (
                                                <li key={`${item.productId}-${item.selectedVariantItemIds.join('-')}`} className="flex items-center py-4 space-x-4">
                                                    {item.productImage && (
                                                        <div className="flex-shrink-0 h-16 w-16 border border-gray-200 rounded-md overflow-hidden relative">
                                                            <Image
                                                                src={item.productImage}
                                                                alt={item.productName}
                                                                fill
                                                                unoptimized
                                                                className="object-cover object-center"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {item.productName}
                                                        </p>
                                                        {/* Display variant info if available */}
                                                        {item.variantName && (
                                                            <p className="text-sm text-gray-500 truncate">
                                                                {item.variantName}
                                                            </p>
                                                        )}
                                                        {!item.productName && (
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                Product ID: {item.productId}
                                                            </p>
                                                        )}
                                                        <p className="text-sm text-gray-500">
                                                            Quantity: {item.quantity}
                                                        </p>
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {item.unitPrice.toLocaleString('en-US', {
                                                            style: 'currency',
                                                            currency: order.currency.toUpperCase(),
                                                        })}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="mt-4 border-t border-gray-200 pt-4">
                                        {order.shipping?.awb && (
                                            <OrderShipmentTracking
                                                orderId={order.id}
                                                awb={order.shipping.awb}
                                                initialStatus={order.shipping.status}
                                            />
                                        )}

                                        {order.status === 'paid' && !order.shipping?.awb && !hasCancellationRequest && (
                                            <OrderCancellationRequestButton orderId={order.id} />
                                        )}

                                        {order.status === 'cancellation_requested' && (
                                            <p className="text-xs text-amber-700">
                                                Cancellation requested. Waiting for admin review.
                                            </p>
                                        )}

                                        {order.status === 'cancellation_approved' && (
                                            <p className="text-xs text-blue-700">
                                                Cancellation approved. Final completion will be updated
                                                automatically after refund confirmation.
                                            </p>
                                        )}

                                        {order.status === 'refund_failed' && (
                                            <p className="text-xs text-red-700">
                                                Refund failed at the payment provider. Please contact
                                                support for assistance.
                                            </p>
                                        )}

                                        {order.cancellation?.adminDecision === 'rejected' && (
                                            <p className="text-xs text-red-700">
                                                Your cancellation request was rejected.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
