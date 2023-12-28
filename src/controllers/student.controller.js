import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js"
import { Student } from "../models/students.models.js"; 
import { upload } from "../middlewares/multer.middleware.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler( async (req, res)=>{
    const {fullname, domain_id, prn, password} = req.body
    
    if (
        [fullname, domain_id, prn, password].some((field) => 
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required") 
    } 

    const existingStudent = Student.findOne({
        $or: [{ domain_id }, { prn }]
    })
    if (existingStudent) {
        throw new ApiError(409, "User with PRN and Domain-ID already exists")
    }
    console.log(req.file);
    const idLocalPath = req.file[0].path;

    if(!idLocalPath){
        throw new ApiError(400, "ID card is required")
    }

    const student = await Student.create({
        fullname, 
        domain_id,
        prn, 
        password,
        id_card: idLocalPath
    })

    const createdStudent = Student.findById(student._id).select(
        "-password -refreshtoken"
    )

    if (!createdStudent) {
        throw new ApiError(500, "Error Creating Student")
    }

    return res.status(201).json(
        new ApiResponse(200, createdStudent, "Student Registered")
    )
})

export{ registerUser }