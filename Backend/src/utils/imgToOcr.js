import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import { ocrImageToPdfPage } from './imgToPdf.js';

const imgToOcr = async function (inputPath, finalPdf, scheduler, tag = 'image', onProgress = null) {
    const prefix = `[ocr][${tag}]`;
    try {
        const imageBuffer = await fs.readFile(inputPath);
        console.log(`${prefix} read ${(imageBuffer.length / 1024).toFixed(0)} KB, cleaning + OCR...`);
        onProgress?.({ stage: 'ocr', done: 0, total: 1 });

        // Wait for OCR process to return the byte buffer
        const pagePdfBytes = await ocrImageToPdfPage(imageBuffer, scheduler);
        console.log(`${prefix} OCR done, ${(pagePdfBytes.length / 1024).toFixed(0)} KB page PDF`);
        onProgress?.({ stage: 'assembling', done: 1, total: 1 });

        // Wait for pdf-lib to fully load that buffer
        const tempDoc = await PDFDocument.load(pagePdfBytes);

        // Copy the processed page into the final document container
        const [copiedPage] = await finalPdf.copyPages(tempDoc, [0]);
        finalPdf.addPage(copiedPage);
    } catch (error) {
        throw new Error(error.message);
    }
};

export { imgToOcr };
