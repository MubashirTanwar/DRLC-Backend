import { Model, Schema, model } from "mongoose";


const issueSchema = new Schema( {
    duration: {
        type: Schema.Types.ObjectId,
        ref: "Admin"
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
        required: true,
        default: false
    },
    returned_on: {
        type: String,
        required: true
    },
    recieved_by: {
        type: Schema.Types.ObjectId,
        ref: "Admin"
    } 
}, { timestamps: true})


export const Issue = model("Issue", issueSchema)