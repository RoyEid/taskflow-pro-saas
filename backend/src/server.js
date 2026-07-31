import "dotenv/config";

import http from "http";
import { Server } from "socket.io";

import app, { allowedOrigins } from "./app.js";
import connectDB from "./config/db.js";
import registerChatSocket from "./sockets/chat.socket.js";

const PORT = Number(process.env.PORT) || 5000;

let httpServer = null;

const normalizeOrigin = (origin = "") =>
    String(origin).trim().replace(/\/+$/, "");

const isAllowedOrigin = (origin) => {
    if (!origin) {
        return true;
    }

    const normalizedRequestOrigin = normalizeOrigin(origin);

    return allowedOrigins
        .filter(Boolean)
        .map(normalizeOrigin)
        .includes(normalizedRequestOrigin);
};

const startServer = async () => {
    try {
        if (
            process.env.NODE_ENV === "production" &&
            !process.env.FRONTEND_URL
        ) {
            console.warn(
                "WARNING: FRONTEND_URL is not set in production. " +
                "Frontend links may default to localhost."
            );
        }

        await connectDB();

        httpServer = http.createServer(app);

        const io = new Server(httpServer, {
            cors: {
                origin: (origin, callback) => {
                    if (isAllowedOrigin(origin)) {
                        callback(null, true);
                        return;
                    }

                    callback(
                        new Error(
                            `Socket connection blocked by CORS: ${origin}`
                        )
                    );
                },
                credentials: true,
            },

            pingInterval: 10000,
            pingTimeout: 10000,
        });

        app.set("io", io);

        registerChatSocket(io);

        /*
         * Listen errors do not always enter the surrounding try/catch,
         * so handle them directly on the HTTP server.
         */
        httpServer.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(
                    `\n[Server] Port ${PORT} is already being used.`
                );
                console.error(
                    "Stop the other backend process and run npm run dev again.\n"
                );

                process.exit(1);
            }

            console.error(
                "[Server] HTTP server error:",
                error.message
            );

            process.exit(1);
        });

        httpServer.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error(
            "Failed to start server:",
            error.message
        );

        process.exit(1);
    }
};

const shutdownServer = (signal) => {
    console.log(`\n[Server] ${signal} received. Shutting down...`);

    if (!httpServer) {
        process.exit(0);
        return;
    }

    httpServer.close((error) => {
        if (error) {
            console.error(
                "[Server] Failed to shut down cleanly:",
                error.message
            );

            process.exit(1);
            return;
        }

        console.log("[Server] Shutdown complete.");
        process.exit(0);
    });

    /*
     * Prevent the process from hanging forever during shutdown.
     */
    setTimeout(() => {
        console.error("[Server] Forced shutdown after timeout.");
        process.exit(1);
    }, 10000).unref();
};

process.on("SIGINT", () => shutdownServer("SIGINT"));
process.on("SIGTERM", () => shutdownServer("SIGTERM"));

startServer();