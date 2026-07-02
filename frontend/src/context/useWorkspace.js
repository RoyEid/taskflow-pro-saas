import { useContext } from "react";
import WorkspaceContext from "./WorkspaceContext";

function useWorkspace() {
  return useContext(WorkspaceContext);
}

export default useWorkspace;
