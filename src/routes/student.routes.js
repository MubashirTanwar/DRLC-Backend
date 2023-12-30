import { Router } from "express";
import { loginUser, logoutUser, newRefreshToken, registerUser } from "../controllers/student.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.single("idCard"),
    registerUser
    )

router.route("/login").post(loginUser)    

// ALL ROUTES
router.route("/logout").post( verifyJWT, logoutUser )
router.route("refresh-token").post(newRefreshToken)

export { router }

