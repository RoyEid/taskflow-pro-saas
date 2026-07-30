import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Message from "../src/models/Message.model.js";

dotenv.config({ quiet: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "../../uploads");
const bucketName = "chatAttachments";

if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
}

await mongoose.connect(process.env.MONGO_URI);

try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName,
    });
    const messages = await Message.find({
        fileUrl: { $type: "string", $ne: "" },
    })
        .select("workspace sender fileUrl fileName mimeType")
        .lean();
    const result = {
        migrated: 0,
        alreadyStored: 0,
        missingLocalFile: 0,
    };

    for (const message of messages) {
        const storedPath = String(message.fileUrl).split("?")[0];
        const filename = path.basename(storedPath);
        const workspaceId = String(message.workspace);

        if (!filename) {
            result.missingLocalFile += 1;
            continue;
        }

        const existingFile = await bucket
            .find({
                filename,
                "metadata.workspaceId": workspaceId,
            })
            .limit(1)
            .next();

        if (existingFile) {
            result.alreadyStored += 1;
            continue;
        }

        const localPath = path.join(uploadDir, filename);
        if (!fs.existsSync(localPath)) {
            result.missingLocalFile += 1;
            continue;
        }

        const uploadStream = bucket.openUploadStream(filename, {
            contentType: message.mimeType || "application/octet-stream",
            metadata: {
                workspaceId,
                uploaderId: String(message.sender),
                originalName: message.fileName || filename,
                mimeType: message.mimeType || "application/octet-stream",
                migratedFrom: "local-disk",
            },
        });

        await pipeline(fs.createReadStream(localPath), uploadStream);
        result.migrated += 1;
    }

    console.log(JSON.stringify(result, null, 2));
} finally {
    await mongoose.disconnect();
}
