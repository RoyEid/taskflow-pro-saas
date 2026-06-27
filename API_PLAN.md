Auth:

POST /api/auth/register

POST /api/auth/login

GET  /api/auth/me



Workspaces:

POST /api/workspaces

GET  /api/workspaces

GET  /api/workspaces/:workspaceId



Members:

GET   /api/workspaces/:workspaceId/members

POST  /api/workspaces/:workspaceId/members/invite

PATCH /api/workspaces/:workspaceId/members/:memberId/role



Clients:

POST /api/workspaces/:workspaceId/clients

GET  /api/workspaces/:workspaceId/clients



Projects:

POST /api/workspaces/:workspaceId/projects

GET  /api/workspaces/:workspaceId/projects

GET  /api/workspaces/:workspaceId/projects/:projectId

PUT  /api/workspaces/:workspaceId/projects/:projectId



Tasks:

POST  /api/workspaces/:workspaceId/projects/:projectId/tasks

GET   /api/workspaces/:workspaceId/projects/:projectId/tasks

PATCH /api/workspaces/:workspaceId/tasks/:taskId/status

PUT   /api/workspaces/:workspaceId/tasks/:taskId

DELETE /api/workspaces/:workspaceId/tasks/:taskId



Comments:

POST /api/workspaces/:workspaceId/tasks/:taskId/comments

GET  /api/workspaces/:workspaceId/tasks/:taskId/comments



Dashboard:

GET /api/workspaces/:workspaceId/dashboard/overview

