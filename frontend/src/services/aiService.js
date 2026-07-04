import api from "./api";

export const askAssistant = async ({ message, workspaceId, history = [], pendingAction }) => {
  const payload = {
    message,
    history,
  };

  if (workspaceId) {
    payload.workspaceId = workspaceId;
  }

  if (pendingAction) {
    payload.pendingAction = pendingAction;
  }

  const res = await api.post("/ai/assistant", payload);

  return res.data;
};

export const confirmAssistantAction = async ({ actionType, workspaceId, payload }) => {
  const body = {
    actionType,
    payload,
  };

  if (workspaceId) {
    body.workspaceId = workspaceId;
  }

  const res = await api.post("/ai/actions/confirm", body);

  return res.data;
};
