import api from "./api";

export const askAssistant = async ({ message, history = [], context = {} }) => {
  const payload = {
    message,
    history,
    context,
  };

  const res = await api.post("/ai/assistant", payload);

  return res.data;
};
