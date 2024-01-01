import { Schema, model } from "mongoose";

const requestSchema = new Schema( {
    purpose: {
        type: String,
        required: true
    },
    duration: {
        type: String,
        enum: ["Short", "Medium", "Long"],
        required: true
    },
    student_id:{
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true
    },
    // https://mongoosejs.com/docs/schematypes.html#booleans
    ews: {
        type: Boolean,
        required: true
    },
    family_status: {
        type: Boolean,
        required: true
    },
    parents_Dec: {
        type: String,
        required: true
    },
    students_Dec: {
        type: String,
        required: true
    },
    faculty_Rec: {
        type: String,
        required: true
    },
    pdc: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected", "Fulfiled"],
        default: "Pending"
    },
    
}, { timestamps: true } )


export const Request = model("Request", requestSchema)