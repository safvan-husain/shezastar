import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { logger } from '@/lib/logging/logger';
import { withRequestLogging } from '@/lib/logging/request-logger';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const SAFE_IMAGE_FILENAME = /^[A-Za-z0-9_-]+\.(?:avif|gif|jpe?g|png|webp)$/i;
const CONTENT_TYPES: Record<string, string> = {
    '.avif': 'image/avif',
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
};

async function GETHandler(
    _request: Request,
    { params }: { params: Promise<{ filename: string }> },
) {
    const { filename } = await params;

    if (!SAFE_IMAGE_FILENAME.test(filename)) {
        return new Response('Invalid image filename', { status: 400 });
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    try {
        const file = await readFile(filePath);
        const extension = path.extname(filename).toLowerCase();

        return new Response(new Uint8Array(file), {
            headers: {
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Content-Type': CONTENT_TYPES[extension] ?? 'application/octet-stream',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;

        if (code === 'ENOENT') {
            await logger.error('Uploaded image file not found', {
                pathname: `/uploads/${filename}`,
                details: { filename },
            });
            return new Response('Image not found', { status: 404 });
        }

        throw error;
    }
}

export const GET = withRequestLogging(GETHandler);
