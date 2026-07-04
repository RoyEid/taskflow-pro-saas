import api from "./api";

export const askAssistant = async ({ message, workspaceId, history = [] }) => {
  const payload = {
    message,
    history,
  };

  if (workspaceId) {
    payload.workspaceId = workspaceId;
  }

  const res = await api.post("/ai/assistant", payload);

  return res.data;
};

