import { Model, Schema, model } from "mongoose";


const issueSchema = new Schema( {
    duration: {
        type: String,
        required: true
    },
    req_id:{
        type: Schema.Types.ObjectId,
        ref: "Request"
    },
    laptop_id: {
        type: String,
        required: true
    },
    returned: {
        type: Boolean,
        default: false
    },
    returned_on: {
        type: String,
    },
    issued_by: {
        type: String,
        required: true
    },
    recieved_by: {
        type: String,
    }  
}, { timestamps: true})


export const Issue = model("Issue", issueSchema)