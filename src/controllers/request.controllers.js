import { Request } from "../models/request.models.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const newRequest = asyncHandler( async (req, res) => {
    const student = req.student
    console.log(student);
    // Files = parents_Dec, students_Dec, faculty_Rec, pdc
    const { purpose, duration, ews, family_status } = req.body

    if (
        [purpose, duration, ews, family_status].some((field) => field.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const existingReq = await Request.find({ // C O U L D   B E   B E T T E R
        student_id: student.prn    
    }).sort("createdAt desc")

    if (existingReq !== null && (existingReq.status !== "Fulfiled" && existingReq.status !== "Rejected")) {
        throw new ApiError(402, "You have already applied; be patient");
    }


    const parents_DecLocalPath = req.files?.parents_Dec[0]?.path;
    const students_DecLocalPath = req.files?.students_Dec[0]?.path;
    const faculty_RecLocalPath = req.files?.faculty_Rec[0]?.path;
    const pdcLocalPath = req.files?.pdc[0]?.path;
    if(!(parents_DecLocalPath || students_DecLocalPath || faculty_RecLocalPath || pdcLocalPath)){
        throw new ApiError(401, "All files are required")
    }

    const request = await Request.create({
        purpose, 
        duration, 
        ews, 
        family_status,
        student_id: student.fullname,
        parents_Dec: parents_DecLocalPath,
        students_Dec: students_DecLocalPath,
        faculty_Rec: faculty_RecLocalPath,
        pdc: pdcLocalPath
    }
    )

    const createdRequest = await Request.findById(request._id)  
    if(!createdRequest) {
        throw new ApiError("Error submitting Request")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, createdRequest, "Request Successful")
    )

})


export {
    newRequest
}