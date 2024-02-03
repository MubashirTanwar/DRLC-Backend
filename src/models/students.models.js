import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const studentSchema = new mongoose.Schema(
    {
        domain_id: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
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
            index: true,
        },
        idCard: {
            type: String,
            required: true,
        },
        department: {
            type: String,
            required: true,
        },
        year: {
            type: String,
            required: true,
        },
        sem: {
            type: String,
            required: true,
        },
        number: {
            type: Number,
            required: true,
        },
        history: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Request",
            },
        ],
        refreshToken: {
            type: String,
        },
        userType: {
            type: String,
            default: "student",
        },
        appliedCurrent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

studentSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

studentSchema.methods.passwordCheck = async function (password) {
    return await bcrypt.compare(password, this.password);
};

studentSchema.methods.createAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            domain_id: this.domain_id,
            prn: this.prn,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

studentSchema.methods.createRefreshToken = function () {
    return jwt.sign(
        {
            domain_id: this.domain_id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const Student = mongoose.model("Student", studentSchema);
