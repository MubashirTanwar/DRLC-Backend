import { Issue } from "../models/issue.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const newIssue = asyncHandler( async( req, res) => {
    // get all approved request
    // option on the list to issue laptops
    // get a list of unissued laptops
    // post req should take data like req_id, approved by, student details, and other laptop status
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

    const createdIssue = await Issue.findById(createIssue._id)
    if(!createdIssue) {
        throw new ApiError("Error Creating New Issue")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, createdIssue, "Issued")
    )
})

const allIssue = asyncHandler( async (req, res) => {
    // returns all the currently issued laptops calculate days left and due date 
    // an option to file return in the frontend
})

const newReturn = asyncHandler(async (req, res) => {
    // once the laptop is returned change the return status, update the laptop condition
})

export{
    newIssue
}