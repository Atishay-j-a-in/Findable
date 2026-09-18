import sharp from 'sharp';

// OCR one image buffer -> one searchable-PDF page (as bytes).
// `scheduler` is the shared tesseract scheduler from workerPool.js — it
// queues the job onto a free worker, so this is safe under concurrency.
//
// Size story: tesseract embeds the image you hand it into the PDF it returns.
// The old pipeline handed it a 2000px PNG (~1-2 MB/page). We now hand it a
// <=1600px mozjpeg (~100-250 KB/page) — same readable text, ~5-10x smaller
// output, and fewer pixels also means faster recognition.
const ocrImageToPdfPage = async function (imageBuffer, scheduler) {
    try {
        const cleanedImage = await sharp(imageBuffer)
            // Cap width instead of always upscaling: small receipts stay sharp,
            // big scans stop wasting OCR time on excess pixels. ~200 DPI @ A4.
            .resize({ width: 1600, withoutEnlargement: true })
            .grayscale()
            // Adaptive contrast (was: fixed linear(1.5, -0.2) which clipped
            // faint handwriting). Same cost, kinder to varied inputs.
            .normalize()
            .sharpen({ sigma: 1 })
            .jpeg({ quality: 72, mozjpeg: true })
            .toBuffer();

        // Third arg { pdf: true } makes tesseract return a full PDF page
        // (image + invisible text layer) in data.pdf.
        const { data } = await scheduler.addJob('recognize', cleanedImage, {}, { pdf: true });

        if (!data.pdf || data.pdf.length === 0) {
            throw new Error('Tesseract failed to generate PDF data.');
        }

        return Buffer.from(data.pdf);
    } catch (error) {
        throw new Error(error.message);
    }
};

export { ocrImageToPdfPage };
