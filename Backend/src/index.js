import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { app } from './app.js';
import { getScheduler, closePool } from './utils/workerPool.js';

const PORT = process.env.PORT || 5500;

app.listen(PORT, () => {
    console.log('Server is running on port', PORT);
    // Prewarm tesseract workers in the background so the first OCR request
    // doesn't pay ~5-15s of startup. Requests also lazily init via
    // getScheduler(), so a failure here is non-fatal.
    getScheduler().catch((err) => console.error('[ocr] pool prewarm failed:', err.message));
});

// Let in-flight OCR finish, then release worker threads cleanly.
for (const sig of ['SIGINT', 'SIGTERM']) {
    process.on(sig, async () => {
        console.log(`\n${sig} received, closing OCR pool...`);
        await closePool();
        process.exit(0);
    });
}
