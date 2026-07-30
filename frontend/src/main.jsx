import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "./index.css";
import App from "./App.jsx";
import MotionRoot from "./components/ui3d/MotionRoot.jsx";
import ThemeProvider from "./context/ThemeProvider.jsx";
import AuthProvider from "./context/AuthProvider.jsx";
import WorkspaceProvider from "./context/WorkspaceProvider.jsx";
import AssistantProvider from "./context/AssistantProvider.jsx";

import ChatSocketProvider from "./context/ChatSocketProvider.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <MotionRoot>
          <AuthProvider>
            <WorkspaceProvider>
              <AssistantProvider>
                <ChatSocketProvider>
                  <App />
                </ChatSocketProvider>
              </AssistantProvider>
            </WorkspaceProvider>
          </AuthProvider>
        </MotionRoot>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);