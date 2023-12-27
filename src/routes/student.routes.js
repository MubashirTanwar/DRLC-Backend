import { Router } from "express";
import { registerUser } from "../controllers/student.controller.js";

const router = Router()

router.route("/register").post(registerUser)


export { router }

