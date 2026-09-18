<<<<<<< HEAD
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Anchored to Backend/public/temp no matter where you run `node` from.
// Multer does NOT create the destination folder for you.
// If it doesn't exist you get: ENOENT: no such file or directory, open '...public\temp\book.pdf'
const tempDir = path.join(__dirname, "..", "..", "public", "temp");
fs.mkdirSync(tempDir, { recursive: true });

const storage =multer.diskStorage({
    destination:function(req,file,cb){
        cb(null, tempDir)
    },
    filename:function (req,file,cb) {
        cb(null,file.originalname)
    }
})

export const upload=multer({
    storage
=======
import multer from "multer";

const storage =multer.diskStorage({
    destination:function(req,file,cb){
     
       
        cb(null,"./public/temp")
    },
    filename:function (req,file,cb) {
        cb(null,file.originalname)
    }
})

export const upload=multer({
    storage
>>>>>>> 79bfc919c7813b3c0f68aeb5fb5a5b53fca2cbb7
})