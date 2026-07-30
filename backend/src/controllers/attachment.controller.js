import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import crypto from "crypto";
import mongoose from "mongoose";
import Message from "../models/Message.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../../uploads");
const attachmentBucketName = "chatAttachments";

const normalizeMimeType = (mimeType = "") =>
    String(mimeType).split(";")[0].trim().toLowerCase();

const mimeExtensionMap = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
    "audio/wav": "wav",
    "audio/x-wav": "wav",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mp3": "mp3",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/x-m4a": "m4a",
    "audio/m4a": "m4a",
    "audio/aac": "aac",
};

const allowedMimeTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    // Audio (Voice notes)
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/ogg",
    "audio/mp3",
    "audio/mpeg",
    "audio/mp4",
    "audio/x-m4a",
    "audio/m4a",
    "audio/aac",
];

const getStoredFilename = (file) => {
    const cleanMime = normalizeMimeType(file.mimetype);
    const cleanName = path.basename(file.originalname || "attachment").replace(/[^a-zA-Z0-9.-]/g, "_");
    const parsedName = path.parse(cleanName || "attachment");
    const isAudio = cleanMime.startsWith("audio/");
    const mimeExtension = mimeExtensionMap[cleanMime];
    const extension = isAudio && mimeExtension
        ? `.${mimeExtension}`
        : parsedName.ext || (mimeExtension ? `.${mimeExtension}` : "");
    const baseName = parsedName.name || "attachment";

    return `${baseName}${extension}`;
};

const getAttachmentBucket = () => {
    if (!mongoose.connection.db) {
        throw new ApiError(503, "Attachment storage is unavailable");
    }

    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: attachmentBucketName,
    });
};

const parseByteRange = (rangeHeader, fileSize) => {
    if (!rangeHeader) return null;

    const match = /^bytes=(\d*)-(\d*)$/i.exec(String(rangeHeader).trim());
    if (!match || (!match[1] && !match[2])) {
        return { invalid: true };
    }

    const startText = match[1];
    const endText = match[2];
    const suffixLength = !startText ? Number.parseInt(endText, 10) : null;
    const start = suffixLength !== null
        ? Math.max(fileSize - suffixLength, 0)
        : Number.parseInt(startText, 10);
    const requestedEnd = startText && endText
        ? Number.parseInt(endText, 10)
        : fileSize - 1;
    const end = Math.min(requestedEnd, fileSize - 1);

    if (
        Number.isNaN(start) ||
        Number.isNaN(end) ||
        (suffixLength !== null && (Number.isNaN(suffixLength) || suffixLength <= 0)) ||
        start < 0 ||
        start >= fileSize ||
        start > end
    ) {
        return { invalid: true };
    }

    return { start, end };
};

const setDownloadDisposition = (res, fileName) => {
    const encodedName = encodeURIComponent(fileName).replace(
        /['()]/g,
        (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    );
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodedName}`);
};

const streamAttachment = ({
    req,
    res,
    fileSize,
    contentType,
    fileName,
    createReadStream,
}) => {
    const pipeToResponse = (stream) => {
        stream.once("error", (error) => {
            if (!res.headersSent) {
                res.status(500).end();
                return;
            }

            res.destroy(error);
        });
        stream.pipe(res);
    };

    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=3600");

    if (req.query.download === "true") {
        setDownloadDisposition(res, fileName);
    }

    const range = parseByteRange(req.headers.range, fileSize);
    if (range?.invalid) {
        res.status(416).setHeader("Content-Range", `bytes */${fileSize}`);
        res.end();
        return;
    }

    if (range) {
        const { start, end } = range;
        res.status(206);
        res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
        res.setHeader("Content-Length", end - start + 1);
        pipeToResponse(createReadStream({ start, end }));
        return;
    }

    res.setHeader("Content-Length", fileSize);
    pipeToResponse(createReadStream());
};

export const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const cleanMime = normalizeMimeType(file.mimetype);
        if (allowedMimeTypes.includes(cleanMime)) {
            cb(null, true);
        } else {
            cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`), false);
        }
    },
}).single("file");

export const getAttachmentSecurely = asyncHandler(async (req, res) => {
    const { workspaceId, filename } = req.params;

    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(filename);

    // Verify in database that this file is linked to the requested workspace
    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const fileSuffix = `/messages/attachments/${safeFilename}`;

    const message = await Message.findOne({
        workspace: workspaceId,
        fileUrl: { $regex: new RegExp(escapeRegex(fileSuffix) + "$") },
    });

    if (!message) {
        throw new ApiError(403, "Access denied: file does not belong to this workspace");
    }

    const contentType = normalizeMimeType(message.mimeType) || "application/octet-stream";
    const downloadName = message.fileName || safeFilename;
    const bucket = getAttachmentBucket();
    const storedFile = await bucket
        .find({
            filename: safeFilename,
            "metadata.workspaceId": String(workspaceId),
        })
        .sort({ uploadDate: -1 })
        .limit(1)
        .next();

    if (storedFile) {
        streamAttachment({
            req,
            res,
            fileSize: storedFile.length,
            contentType,
            fileName: downloadName,
            createReadStream: (range) =>
                bucket.openDownloadStream(
                    storedFile._id,
                    range
                        ? { start: range.start, end: range.end + 1 }
                        : undefined
                ),
        });
        return;
    }

    // Compatibility fallback for files uploaded before GridFS storage.
    const filePath = path.join(uploadDir, safeFilename);
    if (!fs.existsSync(filePath)) {
        throw new ApiError(404, "Attachment file is no longer available");
    }

    const stats = await fs.promises.stat(filePath);
    streamAttachment({
        req,
        res,
        fileSize: stats.size,
        contentType,
        fileName: downloadName,
        createReadStream: (range) =>
            range
                ? fs.createReadStream(filePath, range)
                : fs.createReadStream(filePath),
    });
});

export const uploadAttachment = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    if (!req.file) {
        throw new ApiError(400, "No file uploaded or file rejected by validations");
    }

    if (req.file.size <= 0) {
        throw new ApiError(400, "Uploaded file is empty");
    }

    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    const uniqueFilename = `${uniqueSuffix}-${getStoredFilename(req.file)}`;
    const contentType = normalizeMimeType(req.file.mimetype);
    const bucket = getAttachmentBucket();
    const uploadStream = bucket.openUploadStream(uniqueFilename, {
        contentType,
        metadata: {
            workspaceId: String(workspaceId),
            uploaderId: String(req.user._id),
            originalName: req.file.originalname,
            mimeType: contentType,
        },
    });

    await new Promise((resolve, reject) => {
        uploadStream.once("error", reject);
        uploadStream.once("finish", resolve);
        uploadStream.end(req.file.buffer);
    });

    const fileUrl = `/api/workspaces/${workspaceId}/messages/attachments/${uniqueFilename}`;

    res.status(200).json(
        new ApiResponse(200, "File uploaded successfully", {
            fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: contentType,
        })
    );
});
