import Router from "express";
import { loginAdmin, logoutAdmin, registerAdmin, getRequests, getOneRequest, getApproved } from "../controllers/admin.controllers.js";
import { adminJWT } from "../middlewares/auth.middleware.js";
import { newIssue } from "../controllers/issue.controllers.js";

const adminRouter = Router()

adminRouter.route("/register").post(registerAdmin)
adminRouter.route("/login").post(loginAdmin)

// R O U T E S
adminRouter.route("/logout").post(adminJWT, logoutAdmin)
adminRouter.route("/allRequest").get(adminJWT, getRequests)
adminRouter.route("/c:request").get(adminJWT, getOneRequest)


// M A I N T A I N A N C E
adminRouter.route("/newIssue").get(adminJWT, newIssue)

export { adminRouter }