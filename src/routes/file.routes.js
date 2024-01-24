import { Router } from "express";
import {
    getFacultyRecommendationFromBucket,
    getIdCardFromBucket,
    getParentsDeclerationFromBucket,
    getPostDatedChequeFromBucket,
    getStudentsDeclerationFromBucket,
} from "../controllers/file.controller.js";

const fileRouter = Router();

fileRouter.get("/idCard/:key", getIdCardFromBucket);
fileRouter.get("/pdc/:key", getPostDatedChequeFromBucket);
fileRouter.get("/pd/:key", getParentsDeclerationFromBucket);
fileRouter.get("/sd/:key", getStudentsDeclerationFromBucket);
fileRouter.get("/fr/:id", getFacultyRecommendationFromBucket);

export { fileRouter };
