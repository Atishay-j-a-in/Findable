
import sharp from 'sharp';



const ocrImageToPdfPage= async function(imageBuffer,worker){

    try {
         // 1. Pre-process for handwriting/photos
        // We increase contrast and sharpen to help Tesseract "see" the ink
        const cleanedImage = await sharp(imageBuffer)
            .resize({ width: 2000 }) // Upscale to ensure 300+ DPI equivalent
            .greyscale()
            .linear(1.5, -0.2) // Boost contrast (1.5x) and darken blacks (-0.2)
            .sharpen()
            .toBuffer();
    
        // 2. Perform OCR
    // Important: Ensure { pdf: true } is the third argument
    const { data } = await worker.recognize(cleanedImage, {}, { pdf: true });
    
    if (!data.pdf || data.pdf.length === 0) {
        throw new Error("Tesseract failed to generate PDF data.");
    }

    console.log(`OCR successful. Generated PDF layer size: ${data.pdf.length} bytes`);
    return Buffer.from(data.pdf);

    } catch (error) {
         throw new Error(error.message)
    }
}

export {ocrImageToPdfPage}