import { Router } from "express";
import { registerUser } from "../controllers/student.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
const router = Router()

router.route("/register").post(
    upload.single("idCard"),
    registerUser
    )


export { router }

