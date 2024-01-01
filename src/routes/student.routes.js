import { Router } from "express";
import { loginUser, logoutUser, newRefreshToken, registerUser, updateProfile, viewProfile } from "../controllers/student.controller.js";
import { newRequest } from "../controllers/request.controllers.js";
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
router.route("/refresh-token").post(newRefreshToken)
router.route("/update-profile").patch(verifyJWT, updateProfile)
router.route("/profile").get(verifyJWT, viewProfile)

router.route("/new-request").post(
    verifyJWT, 
    upload.fields([
        {
            name: "parents_Dec",
            maxCount: 1
        },
        {
            name: "students_Dec",
            maxCount: 1
        },
        {
            name: "faculty_Rec",
            maxCount: 1
        },
        {
            name: "pdc",
            maxCount: 1
        }
    ]),
    newRequest
    )


export { router }

