import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { Student } from "../models/students.models.js"; 
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import { generateTokens } from "../utils/generateToken.js";

const registerUser = asyncHandler( async (req, res)=>{
    const {fullname, domain_id, prn, password, department, year, sem, number} = req.body
    
    if (
        [fullname, domain_id, prn, password, department, year, sem, number].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required") 
    } 

    const existingStudent = await Student.findOne({
        $or: [{ domain_id }, { prn }]
    })
    if (existingStudent) {
        throw new ApiError(409, "User with PRN and Domain-ID already exists")
    }

    const idLocalPath = req.file?.path;
    if(!idLocalPath){
        throw new ApiError(400, "ID card is required")
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
        number
    })

    const newID = "ID" + '-' + prn

    const createdStudent = await Student.findById(student._id).select(
        "-password -refreshtoken"
    )

    if (!createdStudent) {
        throw new ApiError(500, "Error Creating Student")
    }

    return res.status(201).json(
        new ApiResponse(200, createdStudent, "Student Registered")
    )
})

const loginUser = asyncHandler( async (req, res) => {
    const  {domain_id, prn, password} = req.body;
    console.log(req.body);
    if ([domain_id, prn, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required") 
    }
    console.log(domain_id, prn, password);
    
    const existingStudent = await Student.findOne({
        $or: [{ domain_id }, { prn }]
    })
    if(!existingStudent){
        throw new ApiError(404, "Unregistered DomainID or PRN")
    }

    const isPasswordValid = await existingStudent.passwordCheck(password)
    if(!isPasswordValid) {
        throw new ApiError(401, "Invalid Login Credentials")
    }
    
    const { accessToken, refreshToken } = await generateTokens(Student, existingStudent._id)

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
            "Student logged in successfully"
        )
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    await Student.findByIdAndUpdate(
        req.student._id,
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
    .json(new ApiResponse(200, {}, "Student logged Out"))
})

const newRefreshToken = asyncHandler( async (req, res) => {
    // get current
    // decrypt
    // Authenticate with the one in DB
    // generate new
    // swap in DB
    // send res

    const existingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if(!existingRefreshToken){
        throw new ApiError(401, "No Refresh Token")
    }    

    try {
        const token = jwt.verify(
            existingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        console.log(token);
    
        const student = await Student.findById(token.domain_id)
        console.log(student);
    
        if(!student){
            throw new ApiError(404, "Student not found")
        }
        if(token !== student?.refreshToken){
            throw new ApiError(401, "Refresh Token Not Matching")
        }
    
        const { accessToken, newRefreshToken } = await generateTokens(Student, student._id)
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, 
                    refreshToken: newRefreshToken
                },
                "Access Token Refreshed in successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error.message)
    }
    
})

const updateProfile = asyncHandler( async (req, res) => {
    const student = req.student
    
    const updateStudent = await Student.findById(student._id)
    if(!updateStudent){
        throw new ApiError(404, "User not found")
    }

    const {fullname, domain_id, prn, department, year, sem, number} = req.body
    
    if (
        [fullname, domain_id, prn, department, year, sem, number].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required") 
    } 

    const updatedStudent = await Student.findByIdAndUpdate(
        student._id, 
        {
            $set: {
                fullname, 
                domain_id, 
                prn, 
                department, 
                year, 
                sem, 
                number
            }
        },
        {
            new: true
        }
    ).select("-password -idCard -refreshToken")

    if(!updatedStudent){
        throw new ApiError(500, "Error While Updating Information")
    }


    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedStudent, "Profile Changes Successful")
    )



})

const viewProfile = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.student, "User Data")
    )
})
export{ 
    registerUser,
    loginUser,
    logoutUser,
    newRefreshToken ,
    updateProfile,
    viewProfile
}