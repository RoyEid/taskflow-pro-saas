taskflow-pro
│
├── README.md
├── PROJECT_PLAN.md
├── API_PLAN.md
├── DATABASE_MODELS.md
├── FEATURES.md
├── .gitignore
│
├── backend
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   │
│   └── src
│       ├── server.js
│       ├── app.js
│       │
│       ├── config
│       │   ├── db.js
│       │   ├── env.js
│       │   └── cors.js
│       │
│       ├── models
│       │   ├── User.model.js
│       │   ├── Workspace.model.js
│       │   ├── WorkspaceMember.model.js
│       │   ├── Client.model.js
│       │   ├── Project.model.js
│       │   ├── Task.model.js
│       │   ├── Comment.model.js
│       │   ├── Attachment.model.js
│       │   ├── ActivityLog.model.js
│       │   ├── Notification.model.js
│       │   └── Invitation.model.js
│       │
│       ├── controllers
│       │   ├── auth.controller.js
│       │   ├── workspace.controller.js
│       │   ├── member.controller.js
│       │   ├── client.controller.js
│       │   ├── project.controller.js
│       │   ├── task.controller.js
│       │   ├── comment.controller.js
│       │   ├── attachment.controller.js
│       │   ├── dashboard.controller.js
│       │   ├── notification.controller.js
│       │   └── invitation.controller.js
│       │
│       ├── routes
│       │   ├── auth.routes.js
│       │   ├── workspace.routes.js
│       │   ├── member.routes.js
│       │   ├── client.routes.js
│       │   ├── project.routes.js
│       │   ├── task.routes.js
│       │   ├── comment.routes.js
│       │   ├── attachment.routes.js
│       │   ├── dashboard.routes.js
│       │   ├── notification.routes.js
│       │   └── invitation.routes.js
│       │
│       ├── middleware
│       │   ├── auth.middleware.js
│       │   ├── permission.middleware.js
│       │   ├── validate.middleware.js
│       │   ├── error.middleware.js
│       │   ├── upload.middleware.js
│       │   └── notFound.middleware.js
│       │
│       ├── services
│       │   ├── auth.service.js
│       │   ├── workspace.service.js
│       │   ├── permission.service.js
│       │   ├── activity.service.js
│       │   ├── notification.service.js
│       │   ├── upload.service.js
│       │   └── email.service.js
│       │
│       ├── validators
│       │   ├── auth.validator.js
│       │   ├── workspace.validator.js
│       │   ├── client.validator.js
│       │   ├── project.validator.js
│       │   ├── task.validator.js
│       │   └── comment.validator.js
│       │
│       ├── utils
│       │   ├── asyncHandler.js
│       │   ├── ApiError.js
│       │   ├── ApiResponse.js
│       │   ├── generateToken.js
│       │   ├── slugify.js
│       │   └── constants.js
│       │
│       └── seeds
│           └── seed.js
│
└── frontend
    ├── package.json
    ├── .env
    ├── .env.example
    ├── index.html
    │
    └── src
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        │
        ├── api
        │   ├── axios.js
        │   ├── auth.api.js
        │   ├── workspace.api.js
        │   ├── member.api.js
        │   ├── client.api.js
        │   ├── project.api.js
        │   ├── task.api.js
        │   ├── comment.api.js
        │   ├── attachment.api.js
        │   ├── dashboard.api.js
        │   └── notification.api.js
        │
        ├── routes
        │   ├── AppRoutes.jsx
        │   ├── ProtectedRoute.jsx
        │   └── RoleRoute.jsx
        │
        ├── layouts
        │   ├── AuthLayout.jsx
        │   └── DashboardLayout.jsx
        │
        ├── pages
        │   ├── auth
        │   │   ├── Login.jsx
        │   │   ├── Register.jsx
        │   │   ├── ForgotPassword.jsx
        │   │   └── ResetPassword.jsx
        │   │
        │   ├── dashboard
        │   │   └── Dashboard.jsx
        │   │
        │   ├── workspaces
        │   │   ├── WorkspaceSelect.jsx
        │   │   └── WorkspaceSettings.jsx
        │   │
        │   ├── projects
        │   │   ├── Projects.jsx
        │   │   └── ProjectDetails.jsx
        │   │
        │   ├── tasks
        │   │   └── MyTasks.jsx
        │   │
        │   ├── clients
        │   │   ├── Clients.jsx
        │   │   └── ClientPortal.jsx
        │   │
        │   ├── members
        │   │   └── Members.jsx
        │   │
        │   ├── notifications
        │   │   └── Notifications.jsx
        │   │
        │   └── settings
        │       └── Settings.jsx
        │
        ├── components
        │   ├── common
        │   │   ├── Button.jsx
        │   │   ├── Input.jsx
        │   │   ├── Textarea.jsx
        │   │   ├── Select.jsx
        │   │   ├── Modal.jsx
        │   │   ├── ConfirmDialog.jsx
        │   │   ├── Loader.jsx
        │   │   ├── EmptyState.jsx
        │   │   ├── Badge.jsx
        │   │   └── Avatar.jsx
        │   │
        │   ├── layout
        │   │   ├── Sidebar.jsx
        │   │   ├── Topbar.jsx
        │   │   └── MobileSidebar.jsx
        │   │
        │   ├── dashboard
        │   │   ├── StatCard.jsx
        │   │   ├── RecentActivity.jsx
        │   │   ├── TasksChart.jsx
        │   │   └── ProjectsChart.jsx
        │   │
        │   ├── projects
        │   │   ├── ProjectCard.jsx
        │   │   ├── ProjectForm.jsx
        │   │   └── ProjectStatusBadge.jsx
        │   │
        │   ├── tasks
        │   │   ├── TaskCard.jsx
        │   │   ├── TaskBoard.jsx
        │   │   ├── TaskColumn.jsx
        │   │   ├── TaskForm.jsx
        │   │   ├── TaskDetailsDrawer.jsx
        │   │   ├── TaskStatusBadge.jsx
        │   │   └── TaskPriorityBadge.jsx
        │   │
        │   ├── clients
        │   │   ├── ClientCard.jsx
        │   │   └── ClientForm.jsx
        │   │
        │   ├── members
        │   │   ├── MemberList.jsx
        │   │   ├── InviteMemberModal.jsx
        │   │   └── RoleBadge.jsx
        │   │
        │   └── comments
        │       ├── CommentList.jsx
        │       └── CommentForm.jsx
        │
        ├── context
        │   ├── AuthContext.jsx
        │   └── WorkspaceContext.jsx
        │
        ├── hooks
        │   ├── useAuth.js
        │   ├── useWorkspace.js
        │   └── useDebounce.js
        │
        ├── utils
        │   ├── constants.js
        │   ├── formatDate.js
        │   └── formatError.js
        │
        └── assets
            └── images