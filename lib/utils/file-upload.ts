// lib/utils/file-upload.ts
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
export async function ensureUploadDir() {
    if (!existsSync(UPLOAD_DIR)) {
        await mkdir(UPLOAD_DIR, { recursive: true });
    }
}

export async function saveImage(file: File): Promise<string> {
    await ensureUploadDir();

    // Validate file type
    if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileId = nanoid();
    const ext = path.extname(file.name) || '.jpg';
    const filename = `${fileId}${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    try {
        // Save original image without processing
        await writeFile(filepath, buffer);
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
        console.error('Error deleting image:', error);
    }
}

export async function deleteImages(urls: string[]): Promise<void> {
    await Promise.all(urls.map(deleteImage));
}
