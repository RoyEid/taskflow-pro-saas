import express from "express";
import {
    getInvitationByToken,
    acceptInvitation,
    declineInvitation,
    getMyInvitations,
    acceptInvitationById,
    declineInvitationById,
} from "../controllers/invitation.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/my", protect, getMyInvitations);
router.post("/my/:invitationId/accept", protect, acceptInvitationById);
router.post("/my/:invitationId/decline", protect, declineInvitationById);

router.get("/:token", getInvitationByToken);
router.post("/:token/accept", protect, acceptInvitation);
router.post("/:token/decline", protect, declineInvitation);

export default router;
