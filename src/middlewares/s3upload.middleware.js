import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import makeId from "../utils/makeNewId.js";
import s3Client from "../utils/s3.js";
import path from "path";

const fileFilter = (req, file, callback) => {
    if (file.mimetype === "image/png" || "image/jpeg" || "image/jpg") {
        callback(null, true);
    } else {
        callback(new Error("The file must be PNG, JPG or JPEG !!"), false);
    }
};
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 1,
    },
    fileFilter: fileFilter,
});

export const uploadIdCard = async (req, res, next) => {
    try {
        const name = makeId(15);
        let id_urn = name + path.extname(req.file?.originalname);
        try {
            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `/id-card/${id_urn}`,
                Body: req.file?.buffer,
            };

            const command = new PutObjectCommand(params);
            const fileSend = await s3Client.send(new PutObjectCommand(params));
            res.locals.idCard = `/id-card/${id_urn}`;
            return next();
        } catch (error) {
            return res.status(500).json({
                message: "Something went wrong! Please try again later",
            });
        }
    } catch (error) {
        console.log("IdCard upload error - " + error);
        return res.status(500).json({ message: "Some error occured" });
    }
};
export const updateIdCard = async (req, res, next) => {
    try {
        const name = makeId(15);
        if (!req.file?.idCard) {
            return next();
        }
        const oldFileName = req.body.oldIdCard;
        let id_urn = name + path.extname(req.file?.idCard);
        try {
            if (oldFileName) {
                const deleteParam = {
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: `/idCard/${oldFileName}`,
                };
                await s3Client.send(new DeleteObjectCommand(deleteParam));
            }

            const uploadParam = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `/idCard/${id_urn}`,
                Body: req.file?.buffer,
            };

            await s3Client.send(new PutObjectCommand(uploadParam));
            res.locals.iCard = `idCard/${id_urn}`;
            res.locals.oldIdCard = oldIdCard;
            return next();
        } catch (error) {
            return res.status(500).json({
                message: "Something went wrong! Please try again later",
            });
        }
    } catch (error) {
        console.log("resume upload " + error);
        return res.status(500).json({ message: "Some error occurred" });
    }
};
export const uploadFiles = async (req, res, next) => {
    try {
        const filePromises = [];

        const fields = [
            { name: "parents_Dec", maxCount: 1, folder: "pd" },
            { name: "students_Dec", maxCount: 1, folder: "sd" },
            { name: "faculty_Rec", maxCount: 1, folder: "fr" },
            { name: "pdc", maxCount: 1, folder: "pdc" },
        ];

        const uploadFile = async (field) => {
            const files = req.files[field.name];

            if (!files || files.length === 0) {
                return null;
            }

            const file = files[0];

            const name = makeId(15);
            const id_urn = name + path.extname(file.originalname);
            const folderPath = field.folder;

            const params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `/${folderPath}/${id_urn}`,
                Body: file.buffer,
                ContentType: file.mimetype,
            };

            const command = new PutObjectCommand(params);
            const fileSend = await s3Client.send(command);

            return `/${folderPath}/${id_urn}`;
        };

        for (const field of fields) {
            const fileUrl = await uploadFile(field);
            if (fileUrl) {
                res.locals[field.name] = fileUrl;
            }
        }

        return next();
    } catch (error) {
        console.log("Files upload error - " + error);
        return res.status(500).json({ message: "Some error occurred" });
    }
};
