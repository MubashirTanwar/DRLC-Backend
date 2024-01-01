import Router from "express";
import { loginAdmin, logoutAdmin, registerAdmin, getRequests } from "../controllers/admin.controllers.js";
import { adminJWT } from "../middlewares/auth.middleware.js";

const adminRouter = Router()

adminRouter.route("/register").post(registerAdmin)
adminRouter.route("/login").post(loginAdmin)

// R O U T E S
adminRouter.route("/logout").post(adminJWT, logoutAdmin)
adminRouter.route("/allRequest").get(adminJWT, getRequests)

export { adminRouter }