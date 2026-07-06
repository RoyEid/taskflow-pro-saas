const ASSISTANT_MESSAGE_MAX_LENGTH = 1000;
const ASSISTANT_HISTORY_MAX_ITEMS = 8;
const ASSISTANT_HISTORY_ITEM_MAX_LENGTH = 1000;

export const ASSISTANT_ACTION_TYPES = [];

const PAGE_GUIDANCE = {
    Dashboard: "You are currently on the Dashboard page. From here, you can view workspace overview, project statistics, recent activity, tasks, and progress summaries.",
    Workspaces: "You are currently on the Workspaces page. From here, you can switch workspaces, create a workspace manually, and manage workspace details.",
    Clients: "You are currently on the Clients page. From here, you can add clients, review client details, and prepare clients before creating projects.",
    Projects: "You are currently on the Projects page. From here, you can create projects, choose the related client, track status, priority, due dates, and open project details.",
    "Project Details": "You are currently on a Project Details page. From here, you can review one project, its tasks, status, priority, due date, and client relationship.",
    Tasks: "You are currently on the Tasks page. From here, you can create tasks manually, assign them to projects, set priority, status, due dates, and assignees.",
    "Task Details": "You are currently on a Task Details page. From here, you can review one task, update its details manually, and check its project relationship.",
    Chat: "You are currently on the Chat page. From here, you can communicate with your workspace team and use any visible message, file, document, or voice controls.",
    Members: "You are currently on the Members page. From here, workspace admins can invite members, review roles, and manage membership where permissions allow.",
    Settings: "You are currently on the Settings page. From here, you can update account settings, security options, password settings, and available workspace preferences.",
    Notifications: "You are currently on the Notifications page. From here, you can review important app alerts if notifications are available in your workspace.",
    Profile: "You are currently on the Profile page. From here, you can review and update profile information that TaskFlow Pro exposes.",
    Feedback: "You are currently on the Feedback page. From here, you can send feedback or support requests through the available form.",
    Help: "You are currently on the Help page. From here, you can find support information and guidance for using TaskFlow Pro.",
};

const STRING_KEYS = ["value", "label", "name", "title", "pageName", "moduleName", "pathname", "role"];

const normalizeText = (value = "") => {
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
        return String(value).trim();
    }
    if (Array.isArray(value)) {
        return value.map((item) => normalizeText(item)).filter(Boolean).join(", ");
    }
    if (typeof value === "object") {
        for (const key of STRING_KEYS) {
            const text = normalizeText(value[key]);
            if (text) return text;
        }
        return "";
    }

    return String(value || "").trim();
};

const trimToLimit = (value, limit) => normalizeText(value).slice(0, limit);

const sanitizeHistory = (history = []) => {
    if (!Array.isArray(history)) return [];

    return history
        .slice(-ASSISTANT_HISTORY_MAX_ITEMS)
        .map((item) => ({
            role: item?.role === "assistant" ? "assistant" : "user",
            content: trimToLimit(item?.content, ASSISTANT_HISTORY_ITEM_MAX_LENGTH),
        }))
        .filter((item) => item.content);
};

const normalizePathname = (pathname = "") => {
    const text = normalizeText(pathname).split("?")[0].split("#")[0].trim();
    if (!text || text === "/") return "/dashboard";
    return text.startsWith("/") ? text : `/${text}`;
};

export const getPageNameFromPath = (pathname = "") => {
    const path = normalizePathname(pathname).toLowerCase();

    if (path === "/dashboard") return "Dashboard";
    if (path === "/workspaces") return "Workspaces";
    if (path === "/clients") return "Clients";
    if (path === "/projects") return "Projects";
    if (/^\/projects\/[^/]+/.test(path)) return "Project Details";
    if (path === "/tasks") return "Tasks";
    if (/^\/tasks\/[^/]+/.test(path)) return "Task Details";
    if (path === "/chat") return "Chat";
    if (path === "/members") return "Members";
    if (path === "/settings") return "Settings";
    if (path === "/notifications") return "Notifications";
    if (path === "/profile") return "Profile";
    if (path === "/feedback") return "Feedback";
    if (path === "/help") return "Help";

    return "TaskFlow Pro";
};

const sanitizeContext = (context = {}, user = null) => {
    const pathname = trimToLimit(context?.pathname, 200);
    const pageName = trimToLimit(context?.pageName, 80) || getPageNameFromPath(pathname);

    return {
        pathname: normalizePathname(pathname),
        pageName,
        moduleName: trimToLimit(context?.moduleName, 80) || pageName,
        userRole: trimToLimit(context?.userRole || user?.role, 60),
        workspaceRole: trimToLimit(context?.workspaceRole, 60),
        themeMode: trimToLimit(context?.themeMode, 20),
    };
};

const includesAny = (text, patterns) => patterns.some((pattern) => pattern.test(text));

const pageAnswer = (context) => PAGE_GUIDANCE[context.pageName] || "You are currently in TaskFlow Pro. I can explain the current page and how to use the main app areas.";

const withRoleHint = (answer, context) => {
    if (!context.workspaceRole) return answer;
    return `${answer}\n\nYour current workspace role appears to be ${context.workspaceRole}. Some controls may only be available to owners or admins.`;
};

const workspaceHelp = () => "To create a workspace manually, go to Workspaces, click the create or new workspace button, enter a name and description, then save. A workspace is the main team or company space where projects, tasks, members, chat, and clients are organized.";

const clientHelp = () => "To create a client manually, go to Clients, click New Client, enter the client name and email, add company, phone, or notes if needed, then save. Create the client before creating projects for that client.";

const projectHelp = () => "A project must belong to a client. First make sure the client exists, then go to Projects, click New Project, choose the client, add the project name, description, status, priority, and due date, then save.";

const taskHelp = () => "A task must belong to a project. First make sure the project exists, then go to Tasks, click New Task, select the project, fill the title, description, priority, status, due date, and assignee if needed, then save.";

const inviteHelp = (context) => withRoleHint("To invite a member manually, go to Members, click Invite Member, enter the email address, choose a role such as admin or member, then send the invitation. I cannot send invitations for you.", context);

const passwordHelp = () => "To update your password, go to Settings and open the account or security area. Enter your current password, then enter and confirm the new password. If you use Google OAuth, you may need to change the password from your Google account instead.";

const settingsHelp = () => "Settings is where you manage account options, password and security settings, workspace preferences, and sign-out controls that are available to your account.";

const dashboardHelp = () => "The Dashboard gives you a workspace overview: stats, project progress, task status, recent activity, and useful summaries so you can see what needs attention.";

const notificationHelp = () => "Use the notification bell or Notifications area to review important app alerts that TaskFlow Pro currently shows. If a notification control is not visible, that feature may not be enabled in your workspace yet.";

const chatHelp = () => "Chat is for workspace communication. Open Chat, choose the conversation or workspace channel, type your message, and use any visible file, document, or voice controls if they are available in the chat UI.";

const roleHelp = (context) => withRoleHint("Roles control what users can do. Owners and admins usually manage workspace settings and members. Members can work with tasks, projects, chat, and other areas depending on the permissions available in the app.", context);

const uploadHelp = () => "To upload files or documents, use the upload, attachment, or file button where it appears, usually in Chat or another page that supports documents. Choose the file, wait for it to attach, then send or save it.";

const readonlyHelp = () => "I cannot create, update, delete, submit, fetch, read, or inspect app records. I can explain where to go and how to use the TaskFlow Pro UI manually.";

const genericHelp = (context) => `${pageAnswer(context)}\n\nI can also explain how to manually use workspaces, clients, projects, tasks, members, settings, dashboard, notifications, and chat.`;

const buildGuidanceAnswer = ({ message, context }) => {
    const text = normalizeText(message).toLowerCase();

    if (!text) {
        return "Ask me how to use TaskFlow Pro, and I will give short manual steps.";
    }

    if (includesAny(text, [
        /\bwhere am i\b/,
        /\bwhat page\b/,
        /\bcurrent page\b/,
        /\bwhich page\b/,
    ])) {
        return pageAnswer(context);
    }

    if (includesAny(text, [
        /\bwhat can i do here\b/,
        /\bwhat can i do on this page\b/,
        /\bhow do i use this page\b/,
        /\bthis page\b/,
    ])) {
        return pageAnswer(context);
    }

    if (includesAny(text, [/\bpassword\b/, /\bsecurity\b/, /\bchange.*password\b/, /\bupdate.*password\b/])) {
        return passwordHelp();
    }

    if (includesAny(text, [/\binvite\b/, /\badd.*member\b/, /\bmember invitation\b/, /\bteammate\b/])) {
        return inviteHelp(context);
    }

    if (includesAny(text, [/\brole\b/, /\bpermission\b/, /\bowner\b/, /\badmin\b/, /\bmember\b/])) {
        return roleHelp(context);
    }

    if (includesAny(text, [
        /\bread\b/,
        /\bfetch\b/,
        /\bshow me (my|the|all|records?|tasks?|projects?|clients?|workspaces?|members?)\b/,
        /\bdelete\b/,
        /\bremove\b/,
        /\bupdate\b/,
        /\bedit\b/,
        /\bsubmit\b/,
        /\bcreate it\b/,
        /\bdo it for me\b/,
    ])) {
        return readonlyHelp();
    }

    if (includesAny(text, [/\bworkspace\b/, /\bcompany space\b/, /\bteam space\b/])) {
        return workspaceHelp();
    }

    if (includesAny(text, [/\bclient\b/, /\bcustomer\b/, /\bcompany\b/])) {
        return clientHelp();
    }

    if (includesAny(text, [/\bproject\b/])) {
        return projectHelp();
    }

    if (includesAny(text, [/\btask\b/, /\btodo\b/, /\bto-do\b/])) {
        return taskHelp();
    }

    if (includesAny(text, [/\bsettings\b/, /\baccount settings\b/])) {
        return settingsHelp();
    }

    if (includesAny(text, [/\bdashboard\b/, /\boverview\b/, /\bstats\b/])) {
        return dashboardHelp();
    }

    if (includesAny(text, [/\bnotification\b/, /\balert\b/, /\bbell\b/])) {
        return notificationHelp();
    }

    if (includesAny(text, [/\bchat\b/, /\bmessage\b/, /\bvoice\b/])) {
        return chatHelp();
    }

    if (includesAny(text, [/\bupload\b/, /\bfile\b/, /\bdocument\b/, /\battachment\b/])) {
        return uploadHelp();
    }

    return genericHelp(context);
};

export const getTaskFlowAssistantAnswer = async ({
    message,
    history = [],
    context = {},
    user = null,
}) => {
    const safeMessage = trimToLimit(message, ASSISTANT_MESSAGE_MAX_LENGTH);
    const safeContext = sanitizeContext(context, user);

    sanitizeHistory(history);

    return {
        type: "answer",
        answer: buildGuidanceAnswer({ message: safeMessage, context: safeContext }),
        metadata: {
            mode: "guidance_only",
            pageName: safeContext.pageName,
        },
    };
};
