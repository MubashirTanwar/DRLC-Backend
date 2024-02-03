import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Student } from "../models/students.models.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import {
    generateRefreshTokens,
    generateTokens,
} from "../utils/generateToken.js";
import s3Client from "../utils/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Request } from "../models/request.models.js";
import { Issue } from "../models/issue.models.js";
const registerUser = asyncHandler(async (req, res) => {
    console.log(req.body);
    const {
        fullname,
        domain_id,
        prn,
        password,
        department,
        year,
        sem,
        number,
    } = req.body;

    if (
        [
            fullname,
            domain_id,
            prn,
            password,
            department,
            year,
            sem,
            number,
        ].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // const existingStudent = await Student.findOne({
    //     $or: [{ domain_id }, { prn }],
    // });
    // if (existingStudent) {
    //     throw new ApiError(409, "User with PRN and Domain-ID already exists");
    // }
    const existingStudent = await Student.findOne({ domain_id });
    if (existingStudent) {
        throw new ApiError(409, "User with entered Domain Id already exists");
    }
    const existingStudent2 = await Student.findOne({ prn });
    if (existingStudent2) {
        throw new ApiError(403, "User with entered PRN already exists");
    }

    const idLocalPath = res.locals.idCard;
    if (!idLocalPath) {
        throw new ApiError(401, "Couldn't save your Id Card Information");
    }

    const student = await Student.create({
        fullname,
        domain_id,
        prn,
        password,
        idCard: idLocalPath,
        department,
        year,
        sem,
        number,
    });

    const newID = "ID" + "-" + prn;

    const createdStudent = await Student.findById(student._id).select(
        "-password -refreshtoken"
    );

    if (!createdStudent) {
        throw new ApiError(500, "Error Creating Student");
    }
    const { accessToken, refreshToken } = await generateTokens(
        Student,
        student._id
    );

    return res.status(201).json(
        new ApiResponse(
            200,
            {
                accessToken: accessToken,
                refreshToken: refreshToken,
                ...createdStudent,
                userType: "student",
            },
            "Student Registered"
        )
    );
});

const loginUser = asyncHandler(async (req, res) => {
    const { domain_id, prn, password } = req.body;
    console.log(req.body);
    if ([domain_id, prn, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    const existingStudent = await Student.findOne({ domain_id });
    if (!existingStudent) {
        throw new ApiError(404, "Unregistered Email");
    }
    const existingStudent2 = await Student.findOne({ prn });
    if (!existingStudent2) {
        throw new ApiError(403, "Unregistered PRN");
    }

    // const existingStudent = await Student.findOne({
    //     $or: [{ domain_id }, { prn }]
    // })
    // if (!existingStudent) {
    //     throw new ApiError(404, "Unregistered DomainID or PRN")
    // }

    const isPasswordValid = await existingStudent.passwordCheck(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid Login Credentials");
    }

    const { accessToken, refreshToken } = await generateTokens(
        Student,
        existingStudent._id
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken,
                    userType: "student",
                },
                "Student logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await Student.findByIdAndUpdate(
        req.student._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Student logged Out"));
});

const newRefreshToken = asyncHandler(async (req, res) => {
    // get current
    // decrypt
    // Authenticate with the one in DB
    // generate new
    // swap in DB
    // send res

    const existingRefreshToken =
        req.cookies?.refreshToken || req.body.refreshToken;
    if (!existingRefreshToken) {
        throw new ApiError(401, "No Refresh Token");
    }

    try {
        const token = jwt.verify(
            existingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        console.log(token);

        const student = await Student.findById(token.domain_id);
        console.log(student);

        if (!student) {
            throw new ApiError(404, "Student not found");
        }
        if (token !== student?.refreshToken) {
            throw new ApiError(401, "Refresh Token Not Matching");
        }

        // const { accessToken, newRefreshToken } = await generateTokens(
        //     Student,
        //     student._id
        // );
        const { newRefreshToken } = await generateRefreshTokens(
            Student,
            student._id
        );
        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken: req?.cookies?.accessToken,
                        refreshToken: newRefreshToken,
                        userType: "student",
                    },
                    "Access Token Refreshed in successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error.message);
    }
});

// const updateProfile = asyncHandler(async (req, res) => {
//     const student = req.student;

//     const updateStudent = await Student.findById(student._id);
//     if (!updateStudent) {
//         throw new ApiError(404, "User not found");
//     }

//     const { fullname, domain_id, prn, department, year, sem, number } =
//         req.body;

//     // if (
//     //     [fullname, domain_id, prn, department, year, sem, number].some(
//     //         (field) => field?.trim() === ""
//     //     )
//     // ) {
//     //     throw new ApiError(400, "All fields are required");
//     // }

//     const updatedStudent = await Student.findByIdAndUpdate(
//         student._id,
//         {
//             $set: {
//                 fullname,
//                 domain_id,
//                 prn,
//                 department,
//                 year,
//                 sem,
//                 number,
//             },
//         },
//         {
//             new: true,
//         }
//     ).select("-password -idCard -refreshToken");

//     if (!updatedStudent) {
//         throw new ApiError(500, "Error While Updating Information");
//     }

//     return res
//         .status(200)
//         .json(
//             new ApiResponse(200, updatedStudent, "Profile Changes Successful")
//         );
// });
const updateProfile = asyncHandler(async (req, res) => {
    const student = req.student;
    console.log(student);
    const updateStudent = await Student.findById(student._id);
    if (!updateStudent) {
        return res
            .status(404)
            .json(new ApiResponse(404, {}, "Student Not Found"));
    }

    const { fullname, domain_id, prn, department, year, sem, number } =
        req.body;

    const updateFields = {};

    if (fullname !== undefined) {
        updateFields.fullname = fullname;
    }
    if (domain_id !== undefined) {
        updateFields.domain_id = domain_id;
    }
    if (prn !== undefined) {
        updateFields.prn = prn;
    }
    if (department !== undefined) {
        updateFields.department = department;
    }
    if (year !== undefined) {
        updateFields.year = year;
    }
    if (sem !== undefined) {
        updateFields.sem = sem;
    }
    if (number !== undefined) {
        updateFields.number = number;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
        student._id,
        {
            $set: updateFields,
        },
        {
            new: true,
        }
    ).select("-password -idCard -refreshToken");

    if (!updatedStudent) {
        return res.status(500).json(new ApiResponse(500, {}, "Server Error"));
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedStudent, "Profile Changes Successful")
        );
});

const viewProfile = asyncHandler(async (req, res) => {
    console.log(req.student);
    try {
        var userProfile = req.student;
        // const params = {
        //     Bucket: process.env.AWS_BUCKET_NAME,
        //     Key: `/id-card/${req.student?.idCard}`,
        // };
        // const command = new GetObjectCommand(params);
        // const url = await getSignedUrl(s3Client, command, {
        //     expiresIn: 14400,
        // });
        // if (userProfile) {
        //     userProfile.idCard = url;
        // }
        // console.log(userProfile);
        return res
            .status(200)
            .json(new ApiResponse(200, userProfile, "User Data"));
    } catch (error) {
        throw new ApiError(401, error.message);
    }
});

const getOneRequest = asyncHandler(async (req, res) => {
    const { request } = req.params; // TODO: add new req_no in models
    if (!request?.trim()) {
        return res
            .status(400)
            .json(
                new ApiResponse(
                    400,
                    { message: "No Student Id is given as param" },
                    "No Student Id is given as param"
                )
            );
    }
    const showRequest = await Request.findOne({
        student_id: request,
    })
        .sort({ createdAt: -1 })
        .exec();

    if (!showRequest) {
        return res
            .status(404)
            .json(
                new ApiResponse(
                    404,
                    { message: "No Request found for given student" },
                    "No Request found for given student"
                )
            );
    }
    const showIssue = await Issue.findOne({
        req_id: showRequest._id,
    })
        .sort({ createdAt: -1 })
        .exec();

    if (!showIssue) {
        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    { request: showRequest },
                    "Sent Particular Request"
                )
            );
    }
    const combinedData = {
        request: showRequest,
        issue: showIssue,
    };

    return res
        .status(202)
        .json(
            new ApiResponse(
                202,
                combinedData,
                "Sent Particular Request Along with Issue"
            )
        );
});

const getMyRequestHistory = asyncHandler(async (req, res) => {
    const student = req.student;
    const getMyRequests = await Request.aggregate([
        {
            $match: {
                student_id: student._id,
            },
        },
        {
            $sort: {
                updatedAt: 1,
            },
        },
    ]);
    if (!getMyRequests) {
        throw new ApiError(500, "Error While Fetching Your Request History");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                getMyRequests,
                "Request History Fetched Successfully"
            )
        );
});

const getRequest = asyncHandler(async (req, res) => {
    const student = req.student;
    const { request } = req.params; // TODO: add new req_no in models
    if (!request?.trim()) {
        throw new ApiError(400, "request id is missing");
    }
    // get all the data, images, texts from a given particular request based on params (id or req_no)
    const showRequest = await Request.find({ student_id: request });
    if (!showRequest) {
        throw new ApiError(404, "Request Not Found");
    }

    if (student._id != showRequest.student_id) {
        throw new ApiError(
            500,
            "Bad request || You are unauthorised to view this page"
        );
    }
    return res
        .status(200)
        .json(new ApiResponse(201, showRequest, "Sent Particular Request"));
});

const getRecent = asyncHandler(async (req, res) => {
    // get the most recent request by a student, shall appear on top whenever they log in
    const student = req.student;
    const recent = await Request.aggregate([
        {
            $match: {
                student_id: student._id,
            },
        },
        {
            $sort: {
                updatedAt: 1,
            },
        },
        {
            $limit: 1,
        },
    ]);
    const showIssue = await Issue.findOne({
        req_id: recent._id,
    })
        .sort({ createdAt: -1 })
        .exec();
    const combinedData = {
        request: recent,
        issue: showIssue,
    };

    if (!recent) {
        throw new ApiError(402, "Error while searching recent requests");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(201, combinedData, "Fetched Most Recent Request")
        );
});

const getMyIssueHistory = asyncHandler(async (req, res) => {
    const student = req.student;
    const getMyIssue = await Request.aggregate([
        {
            $match: {
                student_id: student._id,
                status: "Fulfiled",
            },
        },
        {
            $lookup: {
                from: "issues",
                localField: "_id",
                foreignField: "req_id",
                as: "issue",
            },
        },
        {
            $addFields: {
                issue: {
                    $first: "$issue",
                },
            },
        },
        {
            $project: {
                _id: 1,
                "issue.duration": 1,
                "issue.createdAt": 1,
                status: 1,
                "issue.laptop_id": 1,
                "issue.returned": 1,
            },
        },
        {
            $sort: {
                "issue.createdAt": 1,
            },
        },
    ]);

    if (!getMyIssue) {
        throw new ApiError(500, "Error while fetching issue history");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, getMyIssue, "Issue history fetched"));
});

const getIssue = asyncHandler(async (req, res) => {
    const student = req.student;
    const { issue } = req.params; // TODO: add new req_no in models
    if (!issue?.trim()) {
        throw new ApiError(400, "issue id is missing");
    }
    // get all the data, images, texts from a given particular request based on params (id or req_no)
    const showIssue = await Issue.findOne({ _id: issue });
    if (!showIssue) {
        throw new ApiError(404, "Issue Not Found");
    }
    const checkIssue = await Request.aggregate([
        {
            $match: {
                student_id: ObjectId("658d6364c03e2480c405739c"),
                status: "Fulfiled",
            },
        },
        {
            $lookup: {
                from: "issues",
                localField: "_id",
                foreignField: "req_id",
                as: "issue",
            },
        },
        {
            $addFields: {
                issue: {
                    $first: "$issue",
                },
            },
        },
        {
            $project: {
                "issue._id": 1,
            },
        },
        {
            $match: {
                "issue._id": issue,
            },
        },
    ]);
    if (!checkIssue) {
        throw new ApiError(
            500,
            "Bad request || You are unauthorised to view this page"
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(201, showIssue, "Sent Particular Issue"));
});

export {
    registerUser,
    loginUser,
    logoutUser,
    newRefreshToken,
    updateProfile,
    viewProfile,
    getMyRequestHistory,
    getRequest,
    getMyIssueHistory,
    getIssue,
    getOneRequest,
    getRecent,
};
