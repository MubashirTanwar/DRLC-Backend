import { Schema, model } from "mongoose";

const historySchema = Schema({
    logId: {
        type: Number,
        required: true
    }, // numeric 
    laptop_id: {
        type: Schema.Types.ObjectId,
        ref: "Laptop"
    },
    issue_id: {
        type: Schema.Types.ObjectId,
        ref: "Issue"
    },
    status: {
        type: Schema.Types.ObjectId,
        ref: "Issue"
    },
    issued_to:{
        type: Schema.Types.ObjectId,
        ref: "Student"
    },
    issued_by:{
        type: Schema.Types.ObjectId,
        ref: "Admin"
    },
    department:{
        type: Schema.Types.ObjectId,
        ref: "Student"
    },
})

export const History = model("History", historySchema)