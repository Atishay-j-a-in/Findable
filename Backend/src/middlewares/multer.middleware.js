import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Anchored to Backend/public/temp no matter where you run `node` from.
// Multer does NOT create the destination folder for you.
const tempDir = path.join(__dirname, "..", "..", "public", "temp");
fs.mkdirSync(tempDir, { recursive: true });

const ALLOWED_MIME = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/tiff",
    "image/bmp",
]);

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        // Unique names: concurrent uploads of "scan.pdf" no longer overwrite
        // each other mid-OCR. Original name is preserved in req.file for the
        // download filename; only the temp file is suffixed.
        const safe = file.originalname.replace(/[^\w.\-]+/g, "_");
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safe}`);
    }
});

function fileFilter(req, file, cb) {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error(`Unsupported file type: ${file.mimetype}. Upload a PDF or image.`));
}

export const upload = multer({
    storage,
    fileFilter,
    // No file-size cap (per user request) — still limited to 1 file per request.
    limits: { files: 1 },
});
