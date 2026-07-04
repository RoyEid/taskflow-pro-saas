import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import passport from "passport";
import "./config/passport.js";

import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/client.routes.js";
import memberRoutes from "./routes/member.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import supportRoutes from "./routes/support.routes.js";
import invitationRoutes from "./routes/invitation.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import searchRoutes from "./routes/search.routes.js";
import messageRoutes from "./routes/message.routes.js";
import attachmentRoutes from "./routes/attachment.routes.js";
import aiRoutes from "./routes/ai.routes.js";

import notFound from "./middleware/notFound.middleware.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());
export const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    "http://localhost:5173"
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(helmet());
app.use(morgan("dev"));
app.use(passport.initialize());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "TaskFlow Pro API is running",
    });
});

app.use("/api/auth", authRoutes);

app.use("/api/workspaces", clientRoutes);
app.use("/api/workspaces", memberRoutes);
app.use("/api/workspaces", commentRoutes);
app.use("/api/workspaces", taskRoutes);
app.use("/api/workspaces", projectRoutes);
app.use("/api/workspaces", dashboardRoutes);
app.use("/api/workspaces", messageRoutes);
app.use("/api/workspaces", attachmentRoutes);
app.use("/api/workspaces", workspaceRoutes);

app.use("/api/feedback", feedbackRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
