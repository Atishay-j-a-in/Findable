
import { PDFDocument } from 'pdf-lib';

import { pdf } from 'pdf-to-img';

import {ocrImageToPdfPage} from './imgToPdf.js'




const pdfToOcr = async function(inputPath, finalPdf, workers, batchSize){
     // Back-compat: allow a single worker to be passed
     if (!Array.isArray(workers)) workers = [workers];
     batchSize = Math.max(1, Math.min(batchSize || workers.length, workers.length));

     try {
         console.log(`Rendering PDF to images (scale=3)...`);
         const renderStart = Date.now();
         const document = await pdf(inputPath, { scale: 3 }); // Render at 300 DPI

            // 1. Collect page images first (rendering is fast, OCR is slow)
            const pageBuffers = [];
            for await (const pageBuffer of document) {
                pageBuffers.push(pageBuffer);
                console.log(`Rendered page ${pageBuffers.length}...`);
            }
            const total = pageBuffers.length;
            console.log(`Collected ${total} pages in ${((Date.now() - renderStart) / 1000).toFixed(1)}s. OCR in batches of ${batchSize}...`);

            // 2. OCR in batches, preserving page order
            const pagePdfBytesList = new Array(total);
            const ocrStart = Date.now();
            let done = 0;
            for (let i = 0; i < total; i += batchSize) {
                const batch = pageBuffers.slice(i, i + batchSize);
                const batchEnd = i + batch.length;
                console.log(`[OCR ${done}/${total}] Batch start: pages ${i + 1}-${batchEnd}...`);
                const results = await Promise.all(
                    batch.map((buf, j) => {
                        const pageNum = i + j + 1;
                        return ocrImageToPdfPage(buf, workers[j % workers.length]).then((bytes) => {
                            done++;
                            const remaining = total - done;
                            const elapsed = ((Date.now() - ocrStart) / 1000).toFixed(1);
                            console.log(`[OCR ${done}/${total}] Page ${pageNum} done | remaining: ${remaining} | elapsed: ${elapsed}s`);
                            return bytes;
                        });
                    })
                );
                results.forEach((bytes, j) => {
                    pagePdfBytesList[i + j] = bytes;
                });
                console.log(`[OCR ${done}/${total}] Batch done: pages ${i + 1}-${batchEnd}`);
            }
            console.log(`OCR complete: ${done}/${total} pages in ${((Date.now() - ocrStart) / 1000).toFixed(1)}s. Assembling PDF...`);

            // 3. Assemble sequentially (pdf-lib is not safe for concurrent addPage)
            for (let pageIndex = 0; pageIndex < pagePdfBytesList.length; pageIndex++) {
                const tempDoc = await PDFDocument.load(pagePdfBytesList[pageIndex]);
                const [copiedPage] = await finalPdf.copyPages(tempDoc, [0]);
                finalPdf.addPage(copiedPage);
            }
            console.log(`Assembled ${total} pages into final PDF.`);
     } catch (error) {
        console.log(error)
         throw new Error(error.message)
     }
    
}

export {pdfToOcr}