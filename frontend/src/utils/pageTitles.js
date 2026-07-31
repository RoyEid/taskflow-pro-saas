import { matchPath } from "react-router";

export const APP_NAME = "TaskFlow Pro";

const MAX_PAGE_NAME_LENGTH = 48;

const ROUTE_TITLES = [
  { path: "/", pageName: "Home" },
  { path: "/login", pageName: "Login" },
  { path: "/register", pageName: "Register" },
  { path: "/verify-email", pageName: "Verify Email" },
  { path: "/forgot-password", pageName: "Forgot Password" },
  { path: "/reset-password", pageName: "Reset Password" },
  { path: "/oauth-success", pageName: "Signing In" },
  { path: "/invitations/:token", pageName: "Workspace Invitation" },
  { path: "/dashboard", pageName: "Dashboard" },
  { path: "/workspaces", pageName: "Workspaces" },
  { path: "/clients", pageName: "Clients" },
  { path: "/projects/:projectId", pageName: "Project" },
  { path: "/projects", pageName: "Projects" },
  { path: "/tasks/:taskId", pageName: "Task" },
  { path: "/tasks", pageName: "Tasks" },
  { path: "/chat/:workspaceId", pageName: "Chat" },
  { path: "/chat", pageName: "Chat" },
  { path: "/members", pageName: "Team" },
  { path: "/settings", pageName: "Settings" },
  { path: "/feedback", pageName: "Feedback" },
  { path: "/help", pageName: "Help" },
];

function cleanPageName(pageName) {
  const suffixPattern = /\s*\|\s*TaskFlow Pro\s*$/i;
  const cleanName = String(pageName || "")
    .replace(suffixPattern, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleanName.length <= MAX_PAGE_NAME_LENGTH) {
    return cleanName;
  }

  return `${cleanName.slice(0, MAX_PAGE_NAME_LENGTH - 1).trimEnd()}…`;
}

export function formatDocumentTitle(pageName) {
  const cleanName = cleanPageName(pageName);

  return cleanName ? `${cleanName} | ${APP_NAME}` : APP_NAME;
}

export function getRoutePageName(pathname) {
  const route = ROUTE_TITLES.find(({ path }) =>
    matchPath({ path, end: true }, pathname)
  );

  return route?.pageName || "404";
}
