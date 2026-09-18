import { PDFDocument } from 'pdf-lib';
import { pdf } from 'pdf-to-img';
import { ocrImageToPdfPage } from './imgToPdf.js';

// Rendered at scale 2 (~144-192 DPI source) then normalized/capped to 1600px
// in imgToPdf.js. Old code used scale 3 (9x pixels vs scale 1) — that cost
// ~2x render + OCR time for no measurable accuracy gain at this pipeline.
// Matches the user_defined_dpi=300 hint set on workers closely enough for
// layout analysis; sharp's resize does the final normalization.
const RENDER_SCALE = Number(process.env.OCR_RENDER_SCALE) || 2;

const pdfToOcr = async function (inputPath, finalPdf, scheduler, tag = 'pdf', onProgress = null) {
    const prefix = `[ocr][${tag}]`;
    try {
        console.log(`${prefix} rendering PDF to images (scale=${RENDER_SCALE})...`);
        onProgress?.({ stage: 'rendering', done: 0, total: null });
        const renderStart = Date.now();
        const ocrStart = Date.now();
        const document = await pdf(inputPath, { scale: RENDER_SCALE });

        // Pipeline: fire OCR for page N as soon as it finishes rendering,
        // instead of render-all-then-OCR. Render of page N+1 overlaps OCR of
        // page N. The scheduler runs CONCURRENCY jobs at once and queues the
        // rest — including jobs from concurrent HTTP requests.
        const pending = [];
        let total = 0;
        let done = 0;
        const elapsed = () => ((Date.now() - ocrStart) / 1000).toFixed(1);
        for await (const pageBuffer of document) {
            const pageNum = ++total;
            console.log(`${prefix} rendered page ${pageNum}, queueing OCR...`);
            pending.push(
                ocrImageToPdfPage(pageBuffer, scheduler).then((bytes) => {
                    done++;
                    // `total` may still be growing while rendering overlaps OCR,
                    // so show finished vs queued-so-far.
                    console.log(`${prefix} page ${pageNum} done (${done}/${pending.length} finished, ${elapsed()}s elapsed)`);
                    onProgress?.({ stage: 'ocr', done, total: pending.length });
                    return { pageNum, bytes };
                })
            );
        }
        console.log(`${prefix} collected ${total} pages in ${((Date.now() - renderStart) / 1000).toFixed(1)}s, waiting for OCR...`);

        const results = await Promise.all(pending);
        console.log(`${prefix} OCR complete: ${done}/${total} pages in ${elapsed()}s. Assembling PDF...`);
        onProgress?.({ stage: 'assembling', done, total });

        // Assemble in page order (pdf-lib mutates finalPdf — sequential only).
        results.sort((a, b) => a.pageNum - b.pageNum);
        for (const { bytes } of results) {
            const tempDoc = await PDFDocument.load(bytes);
            const [copiedPage] = await finalPdf.copyPages(tempDoc, [0]);
            finalPdf.addPage(copiedPage);
        }
        console.log(`${prefix} assembled ${total} pages into final PDF.`);
    } catch (error) {
        console.log(error);
        throw new Error(error.message);
    }
};

export { pdfToOcr };
