import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import {toOcr} from "../controllers/ocr.controller.js"
const router = Router()


router.route("/ocr").post(upload.single("file"),toOcr)



export default router