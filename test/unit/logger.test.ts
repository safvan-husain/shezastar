import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

import { createFileLogger } from '@/lib/logging/logger';

const tempDirs: string[] = [];

async function createTempLogDir() {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'shezastar-logs-'));
    tempDirs.push(dir);
    return dir;
}

afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('file logger', () => {
    it('writes log, debug, and error entries to the expected files', async () => {
        const logDir = await createTempLogDir();
        const fileLogger = createFileLogger({ logDir });

        await fileLogger.log('General event', {
            method: 'GET',
            pathname: '/api/test',
            details: { keep: true, omit: undefined },
        });
        await fileLogger.debug('Debug event', {
            requestId: 'debug-1',
        });
        await fileLogger.error('Error event', {
            errorMessage: 'boom',
            details: new Error('boom'),
        });

        const appLog = await readFile(path.join(logDir, 'app.log'), 'utf8');
        const errorLog = await readFile(path.join(logDir, 'error.log'), 'utf8');

        const appEntries = appLog.trim().split('\n').map((line) => JSON.parse(line));
        const errorEntries = errorLog.trim().split('\n').map((line) => JSON.parse(line));

        expect(appEntries).toHaveLength(3);
        expect(appEntries[0]).toMatchObject({
            level: 'log',
            message: 'General event',
            method: 'GET',
            pathname: '/api/test',
            details: { keep: true },
        });
        expect(appEntries[1]).toMatchObject({
            level: 'debug',
            message: 'Debug event',
            requestId: 'debug-1',
        });
        expect(appEntries[2]).toMatchObject({
            level: 'error',
            message: 'Error event',
            errorMessage: 'boom',
            details: {
                name: 'Error',
                message: 'boom',
            },
        });
        expect(errorEntries).toHaveLength(1);
        expect(errorEntries[0]).toMatchObject({
            level: 'error',
            message: 'Error event',
        });
    });
});
