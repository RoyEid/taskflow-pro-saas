import { useContext } from "react";
import ChatSocketContext from "./ChatSocketContext";

function useChatSocket() {
  return useContext(ChatSocketContext);
}

export default useChatSocket;
