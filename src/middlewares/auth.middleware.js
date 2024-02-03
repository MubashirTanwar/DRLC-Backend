import { Student } from "../models/students.models.js";
import { Admin } from "../models/admin.models.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "unauthorized request");
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const student = await Student.findById(decoded?._id).select(
            "-password -refreshToken"
        );

        if (!student) {
            throw new ApiError(401, "Invalid Access Token");
        }
        req.student = student;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid Access Token --catch");
    }
});

const adminJWT = asyncHandler(async (req, _, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const admin = await Admin.findById(decoded?._id).select(
            "-password -refreshToken"
        );
        if (!admin) {
            throw new ApiError(401, "Invalid Access Token");
        }
        req.admin = admin;
        next();
    } catch (error) {
        throw new ApiError(401, "Invalid Access Token --catch");
    }
});

export { verifyJWT, adminJWT };
