import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { Admin } from "../models/admin.models.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { generateTokens } from "../utils/generateToken.js";

const registerAdmin = asyncHandler( async(res, req) => {
    const { email, password, fullname, key } = req.body

    if(
        [ email, password, fullname ]
        .some((field) => { field?.trim === ""})
    ) {
        throw new ApiError(401, "All Fields are mandatory")
    }

    const exisitngAdmin = await Admin.findOne(email)
    if (!exisitngAdmin){
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
    const createdAdmin = await Admin.findOne(admin._id).select("-password")
    if(!createdAdmin){
        throw new ApiError(500, "Error while creating admin")
    }
    return res.status(201).json(
        new ApiResponse(200, createdAdmin, "Admin Registered")
    )
    
})

const loginAdmin = asyncHandler( async(res, req) => {
    const  {email, password} = req.body;

    if ([email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required") 
    }
    
    const existingAdmin = await Admin.findOne(email)
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
                accessToken, refreshToken
            },
            "Admin logged in successfully"
        )
    )
})

const logoutAdmin = asyncHandler( async(res, req) => {
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

export{
    registerAdmin,
    loginAdmin,
    logoutAdmin
}

