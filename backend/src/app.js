import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.routes.js";
import clientRoutes from "./routes/client.routes.js";
import memberRoutes from "./routes/member.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/task.routes.js";
import commentRoutes from "./routes/comment.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";

import notFound from "./middleware/notFound.middleware.js";
import errorHandler from "./middleware/error.middleware.js";

const app = express();

app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

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
app.use("/api/workspaces", workspaceRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;