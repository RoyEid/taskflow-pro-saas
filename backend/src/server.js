import "dotenv/config";

import http from "http";
import { Server } from "socket.io";
import app, { allowedOrigins } from "./app.js";
import connectDB from "./config/db.js";
import registerChatSocket from "./sockets/chat.socket.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_URL) {
            console.warn("WARNING: FRONTEND_URL is not set in production environment. Invitation links will default to localhost.");
        }

        await connectDB();

        const httpServer = http.createServer(app);
        const io = new Server(httpServer, {
            cors: {
                origin: allowedOrigins,
                credentials: true,
            },
        });

        app.set("io", io);
        registerChatSocket(io);

        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();
