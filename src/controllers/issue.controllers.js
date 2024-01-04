import { Issue } from "../models/issue.models";
import { asyncHandler } from "../utils/asyncHandler";

const newIssue = asyncHandler( async( req, res) => {
    const admin = req.admin
    const { duration, req_id, laptop_id} = req.body
    if (
        [duration, req_id, laptop_id ].some((field) => field.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const createIssue = await Issue.create({
        duration, 
        req_id, 
        laptop_id,
        issued_by: admin.fullname
    })

    const cretaedIssue = await Issue.findById(createIssue._id)
    if(!createIssue) {
        throw new ApiError("Error Creating New Issue")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, createIssue, "Issued")
    )


    

})