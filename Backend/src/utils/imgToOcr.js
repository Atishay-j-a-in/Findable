
import { PDFDocument } from 'pdf-lib';

import fs from 'fs/promises';

import { ocrImageToPdfPage } from './imgToPdf.js'



const imgToOcr = async function (inputPath, finalPdf, worker) {

    try {
        const imageBuffer = await fs.readFile(inputPath);
         
            
            // Wait for OCR process to return the byte buffer
            const pagePdfBytes = await ocrImageToPdfPage(imageBuffer, worker);
            
            // Wait for pdf-lib to fully load that buffer
            const tempDoc = await PDFDocument.load(pagePdfBytes);
            console.log(`Temp PDF loaded. Page count: ${tempDoc.getPageCount()}`);
            
            // Copy the processed page into the final document container
            const [copiedPage] = await finalPdf.copyPages(tempDoc, [0]);
            finalPdf.addPage(copiedPage);
    } catch (error) {
        throw new Error(error.message)
    }

}

export { imgToOcr }