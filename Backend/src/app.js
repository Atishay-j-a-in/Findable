import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
dotenv.config({path:'./.env'});
const app = express();

app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,//only frontend url will be allowed to use backend not any other url
        credentials: true // allow session cookie from browser to pass through
    }
));

app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use(express.static('public'));

import ocrenable from "./routes/ocrenable.routes.js"
app.use("/upload", ocrenable)

// Multer (fileFilter / limits) and OCR errors -> JSON instead of HTML stack.
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_FILE_SIZE'
            ? 'File too large (max 25 MB).'
            : err.message;
        return res.status(400).json({ success: false, message });
    }
    if (err) {
        return res.status(400).json({ success: false, message: err.message || 'Upload failed' });
    }
    next();
});

export {app}
