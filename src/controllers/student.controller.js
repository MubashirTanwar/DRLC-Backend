import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { Student } from "../models/students.models.js"; 
import { upload } from "../middlewares/multer.middleware.js";
import { ApiResponse } from "../utils/apiResponse.js";

const generateTokens = async(userID) => {
    try {
        const logStudent = await Student.findById(userID)

        const accessToken = logStudent.createAccessToken()

        const refreshToken = logStudent.createRefreshToken();

        logStudent.refreshToken = refreshToken
        await logStudent.save({validateBeforeSave: false})

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler( async (req, res)=>{
    const {fullname, domain_id, prn, password} = req.body
    
    if (
        [fullname, domain_id, prn, password].some((field) => 
        field?.trim() === "")
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
        idCard: idLocalPath
    })

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
    if ([domain_id, prn, password].some((field) => 
        field?.trim() === "")) {
        throw new ApiError(400, "All fields are required") 
    }
    
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
    
    const { accessToken, refreshToken } = await generateTokens(existingStudent._id)

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

export{ 
    registerUser,
    loginUser,
    logoutUser 
}