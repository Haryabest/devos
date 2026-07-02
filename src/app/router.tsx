import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { DashboardPage } from '@/pages/dashboard';
import { ProjectsPage } from '@/pages/projects';
import { ProjectDetailPage } from '@/pages/project-detail';
import { ProjectTasksPage } from '@/pages/project-tasks';
import { ProjectTaskDetailPage } from '@/pages/project-task-detail';
import { ProjectDocsPage } from '@/pages/project-docs';
import { ProjectApiPage } from '@/pages/project-api';
import { DocumentsPage } from '@/pages/documents';
import { ClientsPage } from '@/pages/clients';
import { TeamPage } from '@/pages/team';
import { AiCenterPage } from '@/pages/ai-center';
import { SettingsPage } from '@/pages/settings';
import { LoginPage } from '@/pages/login';
import { RegisterPage } from '@/pages/register';
import { NotFoundPage } from '@/pages/not-found';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <AppShell />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/projects/:projectId', element: <ProjectDetailPage /> },
      { path: '/projects/:projectId/tasks', element: <ProjectTasksPage /> },
      { path: '/projects/:projectId/tasks/:taskId', element: <ProjectTaskDetailPage /> },
      { path: '/projects/:projectId/docs', element: <ProjectDocsPage /> },
      { path: '/projects/:projectId/api', element: <ProjectApiPage /> },
      { path: '/documents', element: <DocumentsPage /> },
      { path: '/clients', element: <ClientsPage /> },
      { path: '/team', element: <TeamPage /> },
      { path: '/ai', element: <AiCenterPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
