import { useContext } from "react";
import AssistantContext from "./AssistantContext";

function useAssistant() {
  return useContext(AssistantContext);
}

export default useAssistant;
