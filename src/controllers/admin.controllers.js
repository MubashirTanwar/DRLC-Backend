import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { Admin } from "../models/admin.models.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { generateTokens } from "../utils/generateToken.js";
import { Request } from "../models/request.models.js";

const registerAdmin = asyncHandler( async(req, res) => {
    const { email, password, fullname, key } = req.body

    if(
        [ email, password, fullname ].some((field) =>  field?.trim() === "")
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

const getRequests = asyncHandler( async(req, res) => {
    // get all or filtered pending requests from your department or others
    // list of all requests
})
const getOneRequest = asyncHandler( async(req, res) => {
    // get all the data, images, texts from a given particular request based on params (id or req_no)
    // show all data in frontend and give option to accept / reject request with a message
})

const updateRequest = asyncHandler( async(req, res) => {
    // update the status of a given request with a message
})


// =============  M A I N T A I N A N C E  ========================//

const getApproved  = asyncHandler( async(req, res) => {
    // get all the approved requests
    // list of all approved
})
const newIssue = asyncHandler( async (req, res) => {
    // option on the list to issue laptops
    // get a list fo unissued laptops
    // post req should take data like req_id, approved by, student details, and other laptop status
})
const allIssue = asyncHandler( async (req, res) => {
    // returns all the currently issued laptops calculate days left and due date 
    // an option to file return in the frontend
})

const newReturn = asyncHandler(async (req, res) => {
    // once the laptop is returned change the return status, update the laptop condition
})

// if the laptop is alloed to someone it cant be alloted to others

export{
    registerAdmin,
    loginAdmin,
    logoutAdmin,
    getRequests
}

