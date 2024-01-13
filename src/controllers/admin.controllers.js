import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { Admin } from "../models/admin.models.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { generateTokens } from "../utils/generateToken.js";
import { Request } from "../models/request.models.js";

const registerAdmin = asyncHandler( async(req, res) => {
    const { email, password, department, fullname, key } = req.body

    if(
        [ email, password, fullname, department ].some((field) =>  field?.trim() === "")
        //[fullname, domain_id, prn, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(401, "All Fields are mandatory")
    }

    const exisitngAdmin = await Admin.findOne({email})
    if (exisitngAdmin){
        throw new ApiError(404, "Admin already exists")
    }

    if (key !== process.env.ADMIN_SECRET_KEY) {
        throw new ApiError(401, "Unauthorized -- please enter valid email ID")
    }

    const admin = await Admin.create({
        email: email,
        password: password,
        fullname: fullname,
        department,
        key: key
    })    
    const createdAdmin = await Admin.findById(admin._id).select("-password")
    if(!createdAdmin){
        throw new ApiError(500, "Error while creating admin")
    }
    return res.status(201).json(
        new ApiResponse(200, createdAdmin, "Admin Registered")
    )
    
})

const loginAdmin = asyncHandler( async(req, res) => {
    const  {email, password} = req.body;

    if ([email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required") 
    }
    
    const existingAdmin = await Admin.findOne({email})
    if(!existingAdmin){
        throw new ApiError(404, "Unregistered Admin email")
    }

    const isPasswordValid = await existingAdmin.passwordCheck(password)
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid Login Credentials")
    }
    
    const { accessToken, refreshToken } = await generateTokens(Admin, existingAdmin._id)


    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                accessToken: accessToken, 
                refreshToken: refreshToken
            },
            "Admin logged in successfully"
        )
    )
})

const logoutAdmin = asyncHandler( async(req, res) => {
    await Admin.findByIdAndUpdate(
        req.admin._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "Admin logged Out"))
})

const viewProfile = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.admin, "User Data")
        )
})
const getRequests = asyncHandler( async(_, res) => {
    // get all or filtered pending requests from your department or others
    // list of all requests
    const allrequests = await Request.aggregate([
            {
              $match: {
                status: "Pending"
              }
            }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse( 200, allrequests, "All pending requests fetched")
    )
})

const getRequestsFromDepartment = asyncHandler( async (req, res) => { 
    const admin = req.admin
    const allRequest = await Request.aggregate([
        {
            $match: {
              status: "Pending"
            }
        },
        {
          $lookup: {
            from: "students",
            localField: "student_id",
            foreignField: "_id",
            as: "student"
          }
        },
        {
          $addFields: {
            student: {
              $first: "$student"
            }
          }
        },
        {
            $match: {
                "student.department": admin.department,
            }
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
            students_Dec: 1    
          }
        },
        {
          $sort: {
            createdAt: 1
          }
        }
      ])
    if(!allRequest){
        throw new ApiError(400, "Error while finding requestd of your department")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(201, allRequest, "Request from your department fetched sucessfully")
    )    

})
const getOneRequest = asyncHandler( async(req, res) => {
    const { request } = req.params // TODO: add new req_no in models 
    if (!request?.trim()) {
        throw new ApiError(400, "request id is missing")
    }
    // get all the data, images, texts from a given particular request based on params (id or req_no)
    const showRequest = await Request.findOne({ student_id: request }).populate('student_id')
    if(!showRequest){
        throw new ApiError(404, "Request Not Found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(201, showRequest, "Sent Particular Request")
    )
    // show all data in frontend and give option to accept / reject request with a message
})

const updateRequest = asyncHandler( async(req, res) => {
    // update the status from the button of a given request with a message
})


// =============  M A I N T A I N A N C E  ========================//

const getApproved  = asyncHandler( async(_, res) => {
    // get all the approved requests
    // list of all approved
    const allApproved = await Request.aggregate([
        {
          $match: {
            status: "Approved"
          }
        },
        {
            $sort: {
              createdAt: 1
            }
        }
])
return res
.status(200)
.json(
    new ApiResponse( 200, allApproved, "All approved requests fetched")
)
})


// if the laptop is alloed to someone it cant be alloted to others

export{
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    getRequests,
    getOneRequest,
    getApproved,
    getRequestsFromDepartment,
    updateRequest,
    viewProfile
}

