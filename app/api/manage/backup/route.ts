import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { getMongoUri } from '@/lib/db/mongo-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // Check for admin authentication
    try {
        await requireAdminAuth();
    } catch (e: any) {
        // Next.js redirect() throws a special error that should be allowed to bubble up
        // so that Next.js handles the redirect. However, for a GET request that is intended
        // as a download, a 401 might be cleaner if it's not a direct navigation.
        // But if we just link to this URL, redirect is fine.
        if (e.digest?.startsWith('NEXT_REDIRECT')) {
            throw e;
        }
        return new Response('Unauthorized', { status: 401 });
    }

    const mongoUri = getMongoUri();
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `mongodb-backup-${ts}.archive.gz`;

    const args = ['--uri', mongoUri, '--archive', '--gzip'];

    // Create the child process
    const child = spawn('mongodump', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    // Stream the output to the response
    let isClosed = false;
    const stream = new ReadableStream({
        start(controller) {
            child.stdout.on('data', (chunk) => {
                if (isClosed) return;
                controller.enqueue(new Uint8Array(chunk));
            });

            child.stdout.on('end', () => {
                if (isClosed) return;
                isClosed = true;
                controller.close();
            });

            child.stdout.on('error', (err) => {
                console.error('mongodump stdout error:', err);
                if (isClosed) return;
                isClosed = true;
                controller.error(err);
            });

            child.stderr.on('data', (d) => {
                const msg = d.toString();
                // Filter out non-error progress messages if needed
                if (msg.includes('error')) {
                    console.error('mongodump stderr:', msg);
                }
            });

            child.on('error', (err) => {
                console.error('Failed to start mongodump:', err);
                if (isClosed) return;
                isClosed = true;
                controller.error(err);
            });

            child.on('close', (code) => {
                if (code !== 0) {
                    console.error(`mongodump exited with code ${code}`);
                }
                if (!isClosed) {
                    isClosed = true;
                    try {
                        controller.close();
                    } catch (e) {
                        // Ignore if already closed
                    }
                }
            });
        },
        cancel() {
            child.kill();
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'application/gzip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
        },
    });
}
