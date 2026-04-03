import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ErrorToastHandler } from '@/components/ErrorToastHandler';
import { PendingActionsContent } from '../components/PendingActionsContent';
import { getPendingActions } from '../order-page-data';

export default async function PendingActionsPage() {
    const { data, error } = await getPendingActions();

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {error && <ErrorToastHandler error={error} />}
            <div className="container mx-auto max-w-7xl px-4 py-8">
                <div className="mb-10">
                    <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="mb-2 text-4xl font-bold text-[var(--foreground)]">
                                Pending Actions
                            </h1>
                            <p className="text-lg text-[var(--muted-foreground)]">
                                Review shipment, cancellation, and return queues
                            </p>
                        </div>
                        <Link href="/manage/orders">
                            <Button variant="ghost">Back to orders</Button>
                        </Link>
                    </div>
                    <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--ring)]" />
                </div>

                <PendingActionsContent pendingActions={data} />
            </div>
        </div>
    );
}
