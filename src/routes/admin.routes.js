import Router from "express";
import {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    getRequests,
    getOneRequest,
    getRequestsFromDepartment,
    updateRequest,
    viewProfile,
    getOneApprovedRequest,
} from "../controllers/admin.controllers.js";
import {
    getApproved,
    newIssue,
    allFreeLaptops,
    allIssuedLaptops,
    newReturn,
    allReturn,
} from "../controllers/issue.controllers.js";
import { adminJWT } from "../middlewares/auth.middleware.js";

const adminRouter = Router();

adminRouter.route("/register").post(registerAdmin);
adminRouter.route("/login").post(loginAdmin);

// R O U T E S
adminRouter.route("/logout").post(adminJWT, logoutAdmin);
adminRouter.route("/allRequest").get(adminJWT, getRequests);
adminRouter.route("/deptRequests").get(adminJWT, getRequestsFromDepartment);
adminRouter.route("/request/:request").get(adminJWT, getOneRequest);
adminRouter.route("/profile").get(adminJWT, viewProfile);
adminRouter.route("/update-request/:request").post(adminJWT, updateRequest);

// M A I N T A I N A N C E
adminRouter.route("/all-approved").get(adminJWT, getApproved);
adminRouter
    .route("/approved-request/:request")
    .get(adminJWT, getOneApprovedRequest);
adminRouter.route("/new-issue").post(adminJWT, newIssue);
adminRouter.route("/free-laptop").get(adminJWT, allFreeLaptops);
adminRouter.route("/issued-laptop").get(adminJWT, allIssuedLaptops);
adminRouter.route("/new-return").post(adminJWT, newReturn);
adminRouter.route("/all-return").get(adminJWT, allReturn);

export { adminRouter };
