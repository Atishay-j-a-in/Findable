import { createScheduler, createWorker, OEM } from 'tesseract.js';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backend/eng.traineddata lives here — pointing tesseract at it avoids
// a CDN fetch on every worker start (which used to hang for seconds).
export const LANG_PATH = path.join(__dirname, '..', '..');

// One worker = 1 page at a time. Each worker + sharp @1600px is memory-heavy,
// so cap at CPU count with an absolute max of 4. Override with OCR_CONCURRENCY.
export const CONCURRENCY = Math.max(
    1,
    Math.min(Number(process.env.OCR_CONCURRENCY) || 4, os.cpus()?.length || 4)
);

// 'recognizing text' ticks many times per second per worker — log it throttled
// (every 25% per job) instead of dropping it entirely, so backend shows live
// progress without flooding the console. Keyed by jobId, shared across workers.
const progressBuckets = new Map();

function progressLogger(workerNum) {
    return (m) => {
        if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 100);
            const bucket = Math.floor(pct / 25);
            const key = m.jobId || `worker-${workerNum}`;
            if (progressBuckets.get(key) !== bucket) {
                progressBuckets.set(key, bucket);
                const job = m.jobId ? ` job ${String(m.jobId).slice(-6)}` : '';
                console.log(`[ocr] worker ${workerNum}:${pct}%${job}`);
            }
            if (pct >= 100) progressBuckets.delete(key);
            return;
        }
        console.log(`[ocr worker ${workerNum}] ${m.status}`);
    };
}

let scheduler = null;
let initPromise = null;

async function initPool() {
    const s = createScheduler();
    console.log(`[ocr] init pool: ${CONCURRENCY} workers, langPath=${LANG_PATH}`);

    const inits = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        inits.push((async () => {
            const w = await createWorker('eng', OEM.LSTM_ONLY, {
                langPath: LANG_PATH,
                cachePath: LANG_PATH,
                logger: progressLogger(i + 1),
            });
            // Safe, zero-speed-cost quality hints:
            // - keep inter-word spaces so the searchable layer is readable
            // - tell layout analysis the true render DPI (see pdfToOcr scale)
            await w.setParameters({
                preserve_interword_spaces: '1',
                user_defined_dpi: '300',
            });
            s.addWorker(w);
            console.log(`[ocr] worker ${i + 1}/${CONCURRENCY} ready`);
        })());
    }
    await Promise.all(inits);
    console.log(`[ocr] pool ready (${CONCURRENCY} workers)`);
    return s;
}

// Singleton: first request (or boot prewarm) builds the pool, every later
// request reuses it. Saves ~5-15s of worker startup per request.
// The scheduler queues jobs across workers AND across concurrent HTTP
// requests, so sharing is safe.
export async function getScheduler() {
    if (scheduler) return scheduler;
    if (!initPromise) initPromise = initPool().then((s) => (scheduler = s));
    return initPromise;
}

export async function closePool() {
    if (scheduler) {
        await scheduler.terminate().catch(() => {});
        scheduler = null;
        initPromise = null;
    }
}
