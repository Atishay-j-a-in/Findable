<<<<<<< HEAD
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {toOcr} from "../controllers/ocr.controller.js"
const router = Router()


router.route("/ocr").post(upload.single("file"),toOcr)



=======
import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {toOcr} from "../controllers/ocr.controller.js"
const router = Router()


router.route("/ocr").post(upload.single("file"),toOcr)



>>>>>>> 79bfc919c7813b3c0f68aeb5fb5a5b53fca2cbb7
export default router