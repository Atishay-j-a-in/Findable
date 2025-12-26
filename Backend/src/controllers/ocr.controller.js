import { asyncHandler } from "../utils/asyncHandler.js";
import { createWorker } from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import { pdfToOcr } from "../utils/pdfToOcr.js"
import { imgToOcr } from "../utils/imgToOcr.js"
import fs from 'fs/promises';
const toOcr = asyncHandler(async (req, res) => {
     
     const inputPath = req.file.path

     const mimeType = req.file.mimetype;

     const finalPdf = await PDFDocument.create();
     const worker = await createWorker('eng');
     if (mimeType === "application/pdf") {
         await pdfToOcr(inputPath, finalPdf, worker)
     }
     else {
         await imgToOcr(inputPath, finalPdf, worker)
     }
      console.log(`Starting OCR for: ${req.file.originalname} (${req.file.mimetype})`);
     const pdfBytes = await finalPdf.save()
     console.log(`Final PDF saved. Total pages: ${finalPdf.getPageCount()}. Total size: ${pdfBytes.length} bytes`);
        
     await fs.unlink(inputPath);
     return res.setHeader('Content-Type', 'application/pdf')
          .setHeader('Content-Disposition', `attachment; filename="ocr_${req.file.originalname}.pdf"`)
          .send(Buffer.from(pdfBytes));

})


export { toOcr }