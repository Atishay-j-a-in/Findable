import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { startOcr, getOcrStatus, downloadOcr } from "../controllers/ocr.controller.js"
const router = Router()


router.route("/ocr").post(upload.single("file"), startOcr)
router.route("/ocr/:jobId").get(getOcrStatus)
router.route("/ocr/:jobId/download").get(downloadOcr)



export default router
