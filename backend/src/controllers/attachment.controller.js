import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import crypto from "crypto";
import Message from "../models/Message.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../../uploads");

// TODO: Local uploads are okay for development. For production, use Cloudinary, AWS S3, Supabase Storage, or Firebase Storage.

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

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

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

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + crypto.randomBytes(4).toString("hex");
        cb(null, uniqueSuffix + "-" + getStoredFilename(file));
    },
});

export const uploadMiddleware = multer({
    storage,
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
    const filePath = path.join(uploadDir, safeFilename);

    if (!fs.existsSync(filePath)) {
        throw new ApiError(404, "File not found on server");
    }

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

    const stats = await fs.promises.stat(filePath);
    const contentType = normalizeMimeType(message.mimeType) || "application/octet-stream";

    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Accept-Ranges", "bytes");

    if (req.query.download === "true") {
        res.download(filePath, message.fileName || safeFilename);
    } else {
        res.setHeader("Content-Type", contentType);

        const range = req.headers.range;
        if (range) {
            const [startText, endText] = range.replace(/bytes=/, "").split("-");
            const suffixLength = !startText && endText ? Number.parseInt(endText, 10) : null;
            const start = suffixLength
                ? Math.max(stats.size - suffixLength, 0)
                : Number.parseInt(startText, 10);
            const requestedEnd = endText && startText ? Number.parseInt(endText, 10) : stats.size - 1;
            const end = Math.min(requestedEnd, stats.size - 1);

            if (
                Number.isNaN(start) ||
                Number.isNaN(end) ||
                (suffixLength !== null && Number.isNaN(suffixLength)) ||
                start < 0 ||
                start > end
            ) {
                res.status(416).setHeader("Content-Range", `bytes */${stats.size}`);
                res.end();
                return;
            }

            res.status(206);
            res.setHeader("Content-Range", `bytes ${start}-${end}/${stats.size}`);
            res.setHeader("Content-Length", end - start + 1);
            fs.createReadStream(filePath, { start, end }).pipe(res);
            return;
        }

        res.setHeader("Content-Length", stats.size);
        fs.createReadStream(filePath).pipe(res);
    }
});

export const uploadAttachment = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    if (!req.file) {
        throw new ApiError(400, "No file uploaded or file rejected by validations");
    }

    if (req.file.size <= 0) {
        throw new ApiError(400, "Uploaded file is empty");
    }

    const uniqueFilename = req.file.filename;
    const fileUrl = `/api/workspaces/${workspaceId}/messages/attachments/${uniqueFilename}`;

    res.status(200).json(
        new ApiResponse(200, "File uploaded successfully", {
            fileUrl,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: normalizeMimeType(req.file.mimetype),
        })
    );
});
