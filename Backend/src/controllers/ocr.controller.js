import { asyncHandler } from "../utils/asyncHandler.js";
import { PDFDocument } from 'pdf-lib';
import { pdfToOcr } from "../utils/pdfToOcr.js";
import { imgToOcr } from "../utils/imgToOcr.js";
import { getScheduler } from "../utils/workerPool.js";
import { createJob, updateJob, getJob, publicJob } from "../utils/jobStore.js";
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Saved results live here (also served statically via express.static('public')).
const RESULT_DIR = path.join(__dirname, '..', '..', 'public', 'temp');

const ALLOWED_MIME = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/tiff',
    'image/bmp',
]);

// Runs after the 202 response — drives the job record the frontend polls.
async function processJob(jobId, file) {
    const inputPath = file.path;
    const mimeType = file.mimetype;
    const tag = file.originalname;
    const started = Date.now();
    const onProgress = (p) => updateJob(jobId, { status: 'processing', ...p });

    try {
        updateJob(jobId, { status: 'processing', stage: 'rendering', done: 0, total: null });
        // Reused across requests (built once, prewarmed at boot).
        const scheduler = await getScheduler();
        console.log(`[ocr][${tag}] starting (${mimeType}, ${(file.size / 1024 / 1024).toFixed(2)} MB)`);

        const finalPdf = await PDFDocument.create();
        if (mimeType === 'application/pdf') {
            await pdfToOcr(inputPath, finalPdf, scheduler, tag, onProgress);
        } else {
            await imgToOcr(inputPath, finalPdf, scheduler, tag, onProgress);
        }

        updateJob(jobId, { stage: 'saving' });
        // useObjectStreams compresses the cross-ref table/object graph —
        // meaningful once page images are already JPEG-compressed.
        const pdfBytes = await finalPdf.save({ useObjectStreams: true });
        const pages = finalPdf.getPageCount();
        console.log(`[ocr][${tag}] final PDF: ${pages} pages, ${pdfBytes.length} bytes in ${((Date.now() - started) / 1000).toFixed(1)}s`);

        if (pages === 0 || pdfBytes.length === 0) {
            throw new Error('OCR produced an empty PDF (0 pages/bytes).');
        }

        // Persist a copy in public/temp as <originalname>_ocr.pdf.
        const safeBase = file.originalname.replace(/\.[^.]+$/, '').replace(/[^\w.\-]+/g, '_') || 'document';
        const outName = `${safeBase}_ocr.pdf`;
        const outPath = path.join(RESULT_DIR, outName);
        await fs.mkdir(RESULT_DIR, { recursive: true });
        await fs.writeFile(outPath, pdfBytes);
        console.log(`[ocr][${tag}] saved result to ${outPath}`);

        updateJob(jobId, {
            status: 'done', stage: 'done', done: pages, total: pages,
            resultPath: outPath, resultName: outName,
        });
    } catch (err) {
        console.error(`[ocr][${tag}] job failed:`, err.message);
        updateJob(jobId, { status: 'error', stage: 'error', error: err.message || 'OCR failed' });
    } finally {
        // Workers stay alive for the next request — only the upload is temp.
        await fs.unlink(inputPath).catch(() => {});
    }
}

// POST /upload/ocr — validates, creates a job, returns 202 immediately.
const startOcr = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded (field name: "file").' });
    }
    if (!ALLOWED_MIME.has(req.file.mimetype)) {
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(415).json({ success: false, message: `Unsupported file type: ${req.file.mimetype}` });
    }

    const job = createJob({ originalName: req.file.originalname, mimeType: req.file.mimetype });
    // Fire-and-forget: progress lands in the job record, errors too.
    processJob(job.id, req.file).catch((err) => {
        updateJob(job.id, { status: 'error', stage: 'error', error: err.message || 'OCR failed' });
    });
    return res.status(202).json({ success: true, jobId: job.id, message: 'OCR started' });
});

// GET /upload/ocr/:jobId — polled by the frontend for live progress.
const getOcrStatus = asyncHandler(async (req, res) => {
    const job = getJob(req.params.jobId);
    if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found (server may have restarted).' });
    }
    return res.json({ success: true, job: publicJob(job) });
});

// GET /upload/ocr/:jobId/download — the finished searchable PDF.
const downloadOcr = asyncHandler(async (req, res) => {
    const job = getJob(req.params.jobId);
    if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found (server may have restarted).' });
    }
    if (job.status !== 'done') {
        return res.status(409).json({ success: false, message: `Result not ready (status: ${job.status}).` });
    }
    return res.download(job.resultPath, job.resultName);
});

export { startOcr, getOcrStatus, downloadOcr };
