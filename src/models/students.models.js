import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const studentSchema  = new mongoose.Schema({
    domain_id: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true
    },
    prn: {
        type: Number,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    }, 
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    history: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Request"
        }
    ],
    refreshtoken: {
        type: String
    }
}, 
{
    timestamps: true
})

studentSchema.pre("save", async function (next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 8)
    };
    next()
})

studentSchema.methods.passwordCheck = async function(password){
    return await bcrypt.compare(password, this.password)
}

export const Student = mongoose.model("Student", studentSchema)