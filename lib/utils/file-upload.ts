// lib/utils/file-upload.ts
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { logger } from '@/lib/logging/logger';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
const IMAGE_EXTENSION_BY_TYPE: Record<string, string> = {
    'image/avif': '.avif',
    'image/gif': '.gif',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
};

export async function ensureUploadDir() {
    if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
    }
}

export async function saveImage(file: File): Promise<string> {
    await ensureUploadDir();

    const ext = IMAGE_EXTENSION_BY_TYPE[file.type.toLowerCase()];
    if (!ext) {
        throw new Error('Image must be JPEG, PNG, WebP, GIF, or AVIF');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = nanoid();
    const filename = `${fileId}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    try {
        // Save original image without processing
        await writeFile(filepath, buffer);
        await logger.log('Uploaded image saved', {
            details: {
                filename,
                contentType: file.type,
                bytes: buffer.byteLength,
            },
        });
    } catch (error) {
        throw new Error(`Failed to save image: ${error instanceof Error ? error.message : String(error)}`);
    }

    return `/uploads/${filename}`;
}

export async function saveImages(files: File[]): Promise<string[]> {
    return Promise.all(files.map(saveImage));
}

export async function deleteImage(url: string): Promise<void> {
    try {
        const filename = path.basename(url);
        const filepath = path.join(UPLOAD_DIR, filename);

        if (existsSync(filepath)) {
            await unlink(filepath);
        }
    } catch (error) {
        await logger.error('Uploaded image deletion failed', {
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            details: { filename: path.basename(url) },
        });
    }
}

export async function deleteImages(urls: string[]): Promise<void> {
    await Promise.all(urls.map(deleteImage));
}
