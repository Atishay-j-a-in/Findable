
import { PDFDocument } from 'pdf-lib';

import { pdf } from 'pdf-to-img';

import {ocrImageToPdfPage} from './imgToPdf.js'




const pdfToOcr = async function(inputPath, finalPdf,worker){
     
     try {
        const document = await pdf(inputPath, { scale: 3 }); // Render at 300 DPI
              let pageIndex = 0;
   
               
            for await (const pageBuffer of document) {
                console.log(`Processing page ${pageIndex + 1}...`);
                const pagePdfBytes = await ocrImageToPdfPage(pageBuffer, worker);
                
                const tempDoc = await PDFDocument.load(pagePdfBytes);
                const [copiedPage] = await finalPdf.copyPages(tempDoc, [0]);
                finalPdf.addPage(copiedPage);
                pageIndex++;
            }
     } catch (error) {
        console.log(error)
         throw new Error(error.message)
     }
    
}

export {pdfToOcr}