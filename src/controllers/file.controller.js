import s3Client from "../utils/s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";

export const getIdCardFromBucket = async (req, res) => {
    try {
        const { key } = req.params;
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `idCard/${key}`,
            })
        );
        response.Body.pipe(res);
    } catch (error) {
        return res.status(500).json({ message: data.Form.default });
    }
};

export const getParentsDeclerationFromBucket = async (req, res) => {
    try {
        const { key } = req.params;
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `pd/${key}`,
            })
        );
        response.Body.pipe(res);
    } catch (error) {
        return res.status(500).json({ message: data.Form.default });
    }
};

export const getStudentsDeclerationFromBucket = async (req, res) => {
    try {
        const { key } = req.params;
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `sd/${key}`,
            })
        );
        response.Body.pipe(res);
    } catch (error) {
        return res.status(500).json({ message: data.Form.default });
    }
};

export const getFacultyRecommendationFromBucket = async (req, res) => {
    try {
        const { key } = req.params;
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `fr/${key}`,
            })
        );
        response.Body.pipe(res);
    } catch (error) {
        return res.status(500).json({ message: data.Form.default });
    }
};

export const getPostDatedChequeFromBucket = async (req, res) => {
    try {
        const { key } = req.params;
        const response = await s3Client.send(
            new GetObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `pdc/${key}`,
            })
        );
        response.Body.pipe(res);
    } catch (error) {
        return res.status(500).json({ message: data.Form.default });
    }
};
