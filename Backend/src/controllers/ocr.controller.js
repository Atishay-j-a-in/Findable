import { asyncHandler } from "../utils/asyncHandler.js";
import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import { pdfToOcr } from "../utils/pdfToOcr.js"
import { imgToOcr } from "../utils/imgToOcr.js"
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Backend/eng.traineddata exists locally — point tesseract at it
// so workers don't hang trying to fetch from CDN.
const LANG_PATH = path.join(__dirname, "..", "..");
console.log(`Tesseract langPath: ${LANG_PATH}`);

// One tesseract worker = 1 page at a time. True batching needs a pool.
// Default: min(CPU count, 4) — each worker + sharp @2000px is memory-heavy.
const CONCURRENCY = Math.max(
    1,
    Math.min(Number(process.env.OCR_CONCURRENCY) || 4, os.cpus()?.length || 4)
);

const toOcr = asyncHandler(async (req, res) => {

     const inputPath = req.file.path

     const mimeType = req.file.mimetype;

     const finalPdf = await PDFDocument.create();
     console.log(`Starting OCR for: ${req.file.originalname} (${req.file.mimetype}) with concurrency=${CONCURRENCY}`);

     console.log(`Creating ${CONCURRENCY} workers...`);
     const workers = [];
     for (let i = 0; i < CONCURRENCY; i++) {
         console.log(`Init worker ${i + 1}/${CONCURRENCY}...`);
         const w = await createWorker('eng', undefined, {
             langPath: LANG_PATH,
             cachePath: LANG_PATH,
             logger: (m) => {
                 if (m.status === 'recognizing text') return; // too noisy per page
                 console.log(`[worker ${i + 1}] ${m.status} ${Math.round((m.progress || 0) * 100)}%`);
             },
         });
         console.log(`Worker ${i + 1}/${CONCURRENCY} ready`);
         workers.push(w);
     }
     console.log(`All ${workers.length} workers ready`);

     try {
         if (mimeType === "application/pdf") {
             await pdfToOcr(inputPath, finalPdf, workers, CONCURRENCY)
         }
         else {
             await imgToOcr(inputPath, finalPdf, workers[0])
         }
         const pdfBytes = await finalPdf.save()
         console.log(`Final PDF saved. Total pages: ${finalPdf.getPageCount()}. Total size: ${pdfBytes.length} bytes`);

         if (finalPdf.getPageCount() === 0 || pdfBytes.length === 0) {
             throw new Error("OCR produced an empty PDF (0 pages/bytes).");
         }

         res.set('Content-Type', 'application/pdf');
         res.set('Content-Disposition', `attachment; filename="ocr_${req.file.originalname}.pdf"`);
         return res.send(Buffer.from(pdfBytes));
     } finally {
         await Promise.allSettled(workers.map((w) => w.terminate()));
         await fs.unlink(inputPath).catch(() => {});
     }

})


export { toOcr }