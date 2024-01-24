import { Issue } from "../models/issue.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Request } from "../models/request.models.js";
import { Laptop } from "../models/laptop.models.js";
import { ApiError } from "../utils/apiError.js";

const getApproved = asyncHandler(async (req, res) => {
    // get all the approved requests
    // list of all approved
    try {
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
                new ApiResponse(
                    200,
                    allApproved,
                    "All approved requests fetched"
                )
            );
    } catch (e) {
        return res
            .status(500)
            .json(
                new ApiResponse(
                    500,
                    { message: "Server Error" },
                    "Server Error"
                )
            );
    }
});

const newIssue = asyncHandler(async (req, res) => {
    // get all approved request
    // option on the list to issue laptops
    // get a list of unissued laptops
    // post req should take data like req_id, approved by, student details, and other laptop status
    const admin = req.admin;
    const { duration, req_id, laptop_id } = req.body;
    if ([duration, req_id, laptop_id].some((field) => field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    const existingIssue = await Issue.findOne({
        req_id: req_id,
    });
    if (existingIssue) {
        return res.status(400).json(new ApiResponse(400, {}, "Already Issued"));
    }
    const createIssue = await Issue.create({
        duration,
        req_id,
        laptop_id,
        issued_by: admin.fullname,
    });

    await Request.findByIdAndUpdate(req_id, {
        $set: {
            status: "Fulfiled",
        },
    });

    return res.status(200).json(new ApiResponse(200, createdIssue, "Issued"));
});

const allFreeLaptops = asyncHandler(async (req, res) => {
    const freeLaptops = await Laptop.aggregate([
        {
            $match: {
                status: "Free",
            },
        },
        {
            $sort: {
                laptop_id: 1,
            },
        },
    ]);
    if (!freeLaptops) {
        throw new ApiError(500, "Error while fetching Free Laptops");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, freeLaptops, "All Free laptops fetched"));
});

const allIssuedLaptops = asyncHandler(async (req, res) => {
    // returns all the currently issued laptops calculate days left and due date
    // an option to file return in the frontend
    const issuedLaptops = await Laptop.aggregate([
        {
            $match: {
                status: "Issued",
            },
        },
        {
            $sort: {
                laptop_id: 1,
            },
        },
    ]);
    if (!issuedLaptops) {
        throw new ApiError(500, "Error while fetching Issued Laptops");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(201, issuedLaptops, "All Issued laptops fetched")
        );
});

const newReturn = asyncHandler(async (req, res) => {
    // once the laptop is returned change the return status, update the laptop condition
    const admin = req.admin;
    // returned is boolean in DB
    // use params to update the issue
    const condition = req.body;
    const { issue } = req.params;
    if (!issue?.trim()) {
        throw new ApiError(400, "issue id is missing");
    }
    const findIssue = await Issue.findById(issue);
    if (!findIssue) {
        throw new ApiError(404, "Couldn't Find Issue ID");
    }

    const isReturned = await Issue.findByIdAndUpdate(
        issue,
        {
            $set: {
                returned: True,
                returned_on: Date,
                recieved_by: admin.fullname,
            },
        },
        {
            new: true,
        }
    );
    if (!isReturned) {
        throw new ApiError(500, "Error while filing return ");
    }

    const updateLaptop = await Laptop.findOneAndUpdate(
        {
            laptop_id: issue.laptop_id,
        },
        {
            status: "Free",
            conditon: condition,
        }
    );
    if (!updateLaptop) {
        throw new ApiError(
            500,
            "An error occured while updating laptop condition"
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(201, isReturned, "Returne Filed Successfully"));
});

const allReturn = asyncHandler(async (req, res) => {
    // all returned issues
    const allReturnedLaptops = await Issue.aggregate([
        {
            $match: {
                returned: True,
            },
        },
        {
            $sort: {
                updatedAt: 1,
            },
        },
    ]);

    if (!allReturnedLaptops) {
        throw new ApiError(401, "Error while findinf returned laptops");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                allReturnedLaptops,
                "Successful fetching allReturnedLaptops"
            )
        );
});

export {
    getApproved,
    newIssue,
    allFreeLaptops,
    allIssuedLaptops,
    newReturn,
    allReturn,
};
