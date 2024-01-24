import { Request } from "../models/request.models.js";
import { Student } from "../models/students.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const newRequest = asyncHandler(async (req, res) => {
    const student = req.student;
    console.log(student);
    const { purpose, duration, ews, family_status, id } = req.body;

    if (
        [purpose, duration, ews, family_status].some(
            (field) => field.trim() === ""
        )
    ) {
        // throw new ApiError(400, "All fields are required");
        res.status(400).json(
            new ApiResponse(
                400,
                { message: "Please submit All Files" },
                "Request Not Read"
            )
        );
    }

    const existingReq = await Request.find({
        student_id: id,
    }).sort("createdAt desc");

    if (existingReq.length > 0) {
        const latestRequest = existingReq[0];

        if (
            latestRequest.status !== "Fulfilled" &&
            latestRequest.status !== "Rejected"
        ) {
            return res
                .status(402)
                .json(
                    new ApiResponse(
                        402,
                        { message: "You have already applied; be patient" },
                        "Request Not Written"
                    )
                );
        }
    }

    // const parents_DecLocalPath = req.files?.parents_Dec[0];
    // const students_DecLocalPath = req.files?.students_Dec[0];
    // const faculty_RecLocalPath = req.files?.faculty_Rec[0];
    // const pdcLocalPath = req.files?.pdc[0]?.path;
    const { parents_Dec, students_Dec, faculty_Rec, pdc } = res.locals;
    if (!(parents_Dec || students_Dec || faculty_Rec || pdc)) {
        // throw new ApiError(401, "All files are required");
        res.status(401).json(
            new ApiResponse(
                401,
                {
                    message:
                        "Your Files couldn't be saved, please try again later",
                },
                "File Not Written"
            )
        );
    }

    const request = await Request.create({
        purpose,
        duration,
        ews,
        family_status,
        student_id: id,
        parents_Dec,
        students_Dec,
        faculty_Rec,
        pdc,
    });

    const createdRequest = await Request.findById(request._id);
    if (!createdRequest) {
        res.status(408).json(
            new ApiResponse(
                408,
                {
                    message:
                        "Your Request couldn't be saved, please try again later",
                },
                "Request Not Saved"
            )
        );
    }

    const updateStudent = await Student.findByIdAndUpdate(id, {
        $set: {
            appliedCurrent: true,
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, createdRequest, "Request Successful"));
});

export { newRequest };
