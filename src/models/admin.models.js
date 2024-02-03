import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const adminSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
        },
        password: {
            type: String,
            required: true,
        },
        department: {
            type: String,
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        key: {
            type: String,
            required: true,
            trim: true,
        },
        refreshToken: {
            type: String,
        },
        userType: {
            type: String,
            enum: ["admin", "maintenance"],
        },
    },
    { timestamps: true }
);

adminSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

adminSchema.methods.passwordCheck = async function (password) {
    return await bcrypt.compare(password, this.password);
};

adminSchema.methods.createAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            fullname: this.fullname,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

adminSchema.methods.createRefreshToken = function () {
    return jwt.sign(
        {
            email: this.email,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

export const Admin = mongoose.model("Admin", adminSchema);
