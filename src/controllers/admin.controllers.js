import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { Admin } from "../models/admin.models.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
    generateRefreshTokens,
    generateTokens,
} from "../utils/generateToken.js";
import { Request } from "../models/request.models.js";
import { Issue } from "../models/issue.models.js";
import s3Client from "../utils/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Laptop } from "../models/laptop.models.js";

const registerAdmin = asyncHandler(async (req, res) => {
    const { email, password, department, fullname, key, type } = req.body; // added type { admin, maintenance }

    if (
        [email, password, fullname].some((field) => field?.trim() === "")
        //[fullname, domain_id, prn, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(401, "All Fields are mandatory");
    }

    const exisitngAdmin = await Admin.findOne({ email });
    if (exisitngAdmin) {
        throw new ApiError(404, "Admin already exists");
    }
    if (key !== process.env.ADMIN_SECRET_KEY) {
        throw new ApiError(405, "Unauthorized -- please enter valid email ID");
    }
    var admin;
    if (department) {
        admin = await Admin.create({
            email: email,
            password: password,
            fullname: fullname,
            department,
            key: key,
            userType: type,
        });
    } else {
        admin = await Admin.create({
            email: email,
            password: password,
            fullname: fullname,
            key: key,
            userType: type,
        });
    }

    const createdAdmin = await Admin.findById(admin._id).select("-password");
    if (!createdAdmin) {
        throw new ApiError(500, "Error while creating admin");
    }
    const { accessToken, refreshToken } = await generateTokens(
        Admin,
        createdAdmin._id
    );
    const options = {
        httpOnly: true,
        secure: true,
    };
    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken,
                    ...createdAdmin,
                    userType: type,
                },
                "Admin Registered"
            )
        );
});

const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password, type } = req.body;

    if ([email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existingAdmin = await Admin.findOne({ email });
    if (!existingAdmin) {
        throw new ApiError(404, "Unregistered Admin email");
    }

    const isPasswordValid = await existingAdmin.passwordCheck(password);
    if (!isPasswordValid) {
        throw new ApiError(401, JSON.stringify("Invalid Login Credentials"));
    }

    const { accessToken, refreshToken } = await generateTokens(
        Admin,
        existingAdmin._id
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .cookie("userType", existingAdmin.userType, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    userType: existingAdmin.userType,
                },
                "Admin logged in successfully"
            )
        );
});

// make a new function for admin refresh token
const newRefreshToken = asyncHandler(async (req, res) => {
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

        const admin = await Admin.findOne({ email: token.email });
        console.log(admin);

        if (!admin) {
            throw new ApiError(404, "Admin not found");
        }
        if (existingRefreshToken !== admin?.refreshToken) {
            throw new ApiError(401, "Refresh Token Not Matching");
        }

        // const accessToken = admin.createAccessToken();

        // const options = {
        //     httpOnly: true,
        //     secure: true,
        // };

        // return res
        //     .status(200)
        //     .cookie("accessToken", accessToken, options)
        //     .json(
        //         new ApiResponse(
        //             200,
        //             {
        //                 accessToken,
        //                 refreshToken: existingRefreshToken,
        //                 userType: admin.userType,
        //             },
        //             "Access Token Refreshed successfully"
        //         )
        //     );
        const { newRefreshToken } = await generateRefreshTokens(
            Admin,
            admin._id
        );
        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        accessToken,
                        refreshToken: newRefreshToken,
                        userType: admin.userType,
                    },
                    "Access Token Refreshed in successfully"
                )
            );
    } catch (error) {
        throw new ApiError(401, error.message);
    }
});

const logoutAdmin = asyncHandler(async (req, res) => {
    await Admin.findByIdAndUpdate(
        req.admin._id,
        {
            $set: {
                refreshToken: 0,
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
        .json(new ApiResponse(200, {}, "Admin logged Out"));
});

const getRequests = asyncHandler(async (req, res) => {
    // get all or filtered pending requests from your department or others
    // list of all requests
    // const allrequests = await Request.aggregate([
    //     {
    //         $match: {
    //             status: "Pending",
    //         },
    //     },
    // ]);
    try {
        const allrequests = await Request.aggregate([
            {
                $match: {
                    status: "Pending",
                },
            },
        ]).exec();

        // Populate the 'student_id' field
        await Request.populate(allrequests, { path: "student_id" });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    allrequests,
                    "All pending requests fetched"
                )
            );
    } catch (e) {
        return res
            .status(404)
            .json(
                new ApiResponse(
                    404,
                    { message: "Not Found" },
                    "Coulnd'nt fetch the user list"
                )
            );
    }
});

const getRequestsFromDepartment = asyncHandler(async (req, res) => {
    const admin = req.admin;
    console.log(admin);
    const allRequest = await Request.aggregate([
        {
            $lookup: {
                from: "students",
                localField: "student_id",
                foreignField: "_id",
                as: "student",
            },
        },
        {
            $addFields: {
                student: {
                    $first: "$student",
                },
            },
        },
        {
            $match: {
                "student.department": admin.department,
            },
        },
        {
            $project: {
                family_status: 1,
                pdc: 1,
                "student.fullname": 1,
                "student.department": 1,
                purpose: 1,
                faculty_Rec: 1,
                status: 1,
                duration: 1,
                ews: 1,
                parents_Dec: 1,
                createdAt: 1,
                updatedAt: 1,
                students_Dec: 1,
            },
        },
        {
            $sort: {
                createdAt: 1,
            },
        },
    ]);
    if (!allRequest) {
        throw new ApiError(
            400,
            "Error while finding requestd of your department"
        );
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                allRequest,
                "Request from your department fetched sucessfully"
            )
        );
});

// const getOneRequest = asyncHandler(async (req, res) => {
//     const { request } = req.params; // TODO: add new req_no in models
//     try {
//         if (!request?.trim()) {
//             return res
//                 .status(400)
//                 .json(
//                     new ApiResponse(
//                         400,
//                         { message: "No Student Id is given as param" },
//                         "No Student Id is given as param"
//                     )
//                 );
//         }
//         const showRequest =
//             await Request.findById(request).populate("student_id");
//         if (!showRequest) {
//             return res
//                 .status(404)
//                 .json(
//                     new ApiResponse(
//                         404,
//                         { message: "No Request found for given student" },
//                         "No Request found for given student"
//                     )
//                 );
//         }
//         const Idparams = {
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: `/id-card/${showRequest.student_id?.idCard}`,
//         };
//         const idcommand = new GetObjectCommand(Idparams);
//         const idurl = await getSignedUrl(s3Client, command, {
//             expiresIn: 14400,
//         });
//         showRequest.student_id.idCard = idurl;
//         const pdcparams = {
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: `/pdc/${showRequest.pdc}`,
//         };
//         const pdccommand = new GetObjectCommand(pdcparams);
//         const pdcurl = await getSignedUrl(s3Client, pdccommand, {
//             expiresIn: 14400,
//         });
//         showRequest.pdc = pdcurl;
//         const frparams = {
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: `/fr/${showRequest.faculty_Rec}`,
//         };
//         const frcommand = new GetObjectCommand(frparams);
//         const frurl = await getSignedUrl(s3Client, frcommand, {
//             expiresIn: 14400,
//         });
//         showRequest.faculty_Rec = frurl;
//         const sdparams = {
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: `/sd/${showRequest.students_Dec}`,
//         };
//         const sdcommand = new GetObjectCommand(sdparams);
//         const sdurl = await getSignedUrl(s3Client, sdcommand, {
//             expiresIn: 14400,
//         });
//         showRequest.students_Dec = sdurl;
//         const pdparams = {
//             Bucket: process.env.AWS_BUCKET_NAME,
//             Key: `/pd/${showRequest.parents_Dec}`,
//         };
//         const pdcommand = new GetObjectCommand(pdparams);
//         const pdurl = await getSignedUrl(s3Client, pdcommand, {
//             expiresIn: 14400,
//         });
//         showRequest.students_Dec = pdurl;

//         return res
//             .status(202)
//             .json(new ApiResponse(202, showRequest, "Sent Particular Request"));
//     } catch (e) {
//         return res
//             .status(500)
//             .json(
//                 new ApiResponse(
//                     500,
//                     { message: e },
//                     "Couldn't Fetch the Student Request"
//                 )
//             );
//     }
// });
const getOneRequest = asyncHandler(async (req, res) => {
    const { request } = req.params; // TODO: add new req_no in models
    try {
        if (!request?.trim()) {
            return res
                .status(400)
                .json(
                    new ApiResponse(
                        400,
                        { message: "No Request ID is given as param" },
                        "No Request ID is given as param"
                    )
                );
        }

        const showRequest =
            await Request.findById(request).populate("student_id");

        if (!showRequest) {
            return res
                .status(404)
                .json(
                    new ApiResponse(
                        404,
                        { message: "No Request found for the given ID" },
                        "No Request found for the given ID"
                    )
                );
        }

        // const getIdCardUrl = async (key) => {
        //     const params = {
        //         Bucket: process.env.AWS_BUCKET_NAME,
        //         Key: key,
        //     };
        //     const command = new GetObjectCommand(params);
        //     const res = await getSignedUrl(s3Client, command, {
        //         expiresIn: 14400,
        //     });
        //     return res;
        // };

        // showRequest.student_id.idCard = await getIdCardUrl(
        //     `/id-card/${showRequest.student_id?.idCard}`
        // );
        // showRequest.pdc = await getIdCardUrl(`/pdc/${showRequest.pdc}`);
        // showRequest.faculty_Rec = await getIdCardUrl(
        //     `/fr/${showRequest.faculty_Rec}`
        // );
        // showRequest.students_Dec = await getIdCardUrl(
        //     `/sd/${showRequest.students_Dec}`
        // );
        // showRequest.parents_Dec = await getIdCardUrl(
        //     `/pd/${showRequest.parents_Dec}`
        // );

        return res
            .status(202)
            .json(new ApiResponse(202, showRequest, "Sent Particular Request"));
    } catch (e) {
        return res
            .status(500)
            .json(
                new ApiResponse(
                    500,
                    { message: e.message || "Internal Server Error" },
                    "Couldn't Fetch the Student Request"
                )
            );
    }
});

const updateRequest = asyncHandler(async (req, res) => {
    // update the status from the button of a given request with a message
    const { update, message } = req.body;

    const { request } = req.params; // TODO: add new req_no in models
    if (!request?.trim()) {
        throw new ApiError(400, "Request id is missing");
    }

    const showRequest = await Request.findById(request);
    if (!showRequest) {
        throw new ApiError(404, "Request Not Found");
    }

    const updatedRequest = await Request.findByIdAndUpdate(
        request,
        {
            $set: {
                status: update,
                message: message,
            },
        },
        {
            new: true,
        }
    );

    return res.status(200).json(new ApiResponse(201, {}, "Request Updated"));
});

const viewProfile = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, req.admin, "User Data"));
});

// =============  M A I N T A I N A N C E  ========================//

const getApproved = asyncHandler(async (req, res) => {
    // get all the approved requests
    // list of all approved
    const allApproved = await Request.aggregate([
        {
            $match: {
                status: "Approved",
            },
        },
    ]);
    await Request.populate(allApproved, { path: "student_id" });
    return res
        .status(200)
        .json(
            new ApiResponse(200, allApproved, "All approved requests fetched")
        );
});

const getOneApprovedRequest = asyncHandler(async (req, res) => {
    const { request } = req.params; // TODO: add new req_no in models
    try {
        if (!request?.trim()) {
            return res
                .status(400)
                .json(
                    new ApiResponse(
                        400,
                        { message: "No Request ID is given as param" },
                        "No Request ID is given as param"
                    )
                );
        }
        const showRequest =
            await Request.findById(request).populate("student_id");

        if (!showRequest) {
            return res
                .status(404)
                .json(
                    new ApiResponse(
                        404,
                        { message: "No Request found for the given ID" },
                        "No Request found for the given ID"
                    )
                );
        }

        // const getIdCardUrl = async (key) => {
        //     const params = {
        //         Bucket: process.env.AWS_BUCKET_NAME,
        //         Key: key,
        //     };
        //     const command = new GetObjectCommand(params);
        //     const res = await getSignedUrl(s3Client, command, {
        //         expiresIn: 14400,
        //     });
        //     return res;
        // };

        // showRequest.student_id.idCard = await getIdCardUrl(
        //     `/id-card/${showRequest.student_id?.idCard}`
        // );
        // showRequest.pdc = await getIdCardUrl(`/pdc/${showRequest.pdc}`);
        // showRequest.faculty_Rec = await getIdCardUrl(
        //     `/fr/${showRequest.faculty_Rec}`
        // );
        // showRequest.students_Dec = await getIdCardUrl(
        //     `/sd/${showRequest.students_Dec}`
        // );
        // showRequest.parents_Dec = await getIdCardUrl(
        //     `/pd/${showRequest.parents_Dec}`
        // );

        return res
            .status(202)
            .json(new ApiResponse(202, showRequest, "Sent Particular Request"));
    } catch (e) {
        return res
            .status(500)
            .json(
                new ApiResponse(
                    500,
                    { message: e.message || "Internal Server Error" },
                    "Couldn't Fetch the Student Request"
                )
            );
    }
});

const getOneIssuedRequest = asyncHandler(async (req, res) => {
    const { id } = req.params; // TODO: add new req_no in models
    try {
        if (!id?.trim()) {
            return res
                .status(400)
                .json(
                    new ApiResponse(
                        400,
                        { message: "No Request ID is given as param" },
                        "No Request ID is given as param"
                    )
                );
        }
        const showRequest = await Issue.findById(id).populate({
            path: "req_id",
            populate: {
                path: "student_id",
                model: "Student", // Adjust this with the actual model name for students
            },
        });
        // const showRequest = await Issue.findById(id).populate([
        //     {
        //         path: "req_id",
        //         populate: { path: "student_id", model: "Student" },
        //     },
        //     { path: "laptop_id" }, // Assuming laptop_id is a string field
        // ]);

        if (!showRequest) {
            return res
                .status(404)
                .json(
                    new ApiResponse(
                        404,
                        { message: "No Request found for the given ID" },
                        "No Request found for the given ID"
                    )
                );
        }

        return res
            .status(202)
            .json(new ApiResponse(202, showRequest, "Sent Particular Request"));
    } catch (e) {
        return res
            .status(500)
            .json(
                new ApiResponse(
                    500,
                    { message: e.message || "Internal Server Error" },
                    "Couldn't Fetch the Student Request"
                )
            );
    }
});

const changeLaptopStatus = asyncHandler(async (req, res) => {
    const { status, id } = req.body;
    console.log(status, id);
    try {
        const updatedLaptop = await Laptop.findOneAndUpdate(
            { laptop_id: id },
            { condition: status }
        );

        if (!updatedLaptop) {
            // If no laptop with the specified ID is found
            return res
                .status(404)
                .json(
                    new ApiResponse(
                        404,
                        { message: "No Laptop found for the given ID" },
                        "No Laptop found for the given ID"
                    )
                );
        }

        // The updatedLaptop variable now contains the updated document
        return res
            .status(202)
            .json(new ApiResponse(202, {}, "Status Changed Successfully"));
    } catch (e) {
        return res
            .status(500)
            .json(
                new ApiResponse(
                    500,
                    { message: e.message || "Internal Server Error" },
                    "Couldn't Update the Status "
                )
            );
    }
});

// if the laptop is alloed to someone it cant be alloted to others

export {
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    getRequests,
    getOneRequest,
    getRequestsFromDepartment,
    updateRequest,
    viewProfile,
    getOneApprovedRequest,
    getOneIssuedRequest,
    changeLaptopStatus,
    newRefreshToken,
};
