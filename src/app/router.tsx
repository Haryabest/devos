import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { DashboardPage } from '@/pages/dashboard';
import { ProjectsPage } from '@/pages/projects';
import { ProjectNewPage } from '@/pages/project-new';
import { ProjectEditPage } from '@/pages/project-edit';
import { ProjectDetailPage } from '@/pages/project-detail';
import { ProjectTasksPage } from '@/pages/project-tasks';
import { ProjectTaskDetailPage } from '@/pages/project-task-detail';
import { ProjectDocsPage } from '@/pages/project-docs';
import { ProjectApiPage } from '@/pages/project-api';
import { ProjectRoadmapPage } from '@/pages/project-roadmap';
import { DocumentsPage } from '@/pages/documents';
import { ClientsPage } from '@/pages/clients';
import { ClientDetailPage } from '@/pages/client-detail';
import { TeamPage } from '@/pages/team';
import { SettingsPage } from '@/pages/settings';
import { LoginPage } from '@/pages/login';
import { RegisterPage } from '@/pages/register';
import { ProfilePage } from '@/pages/profile';
import { BackendBootstrap } from '@/components/backend-bootstrap';
import { NotFoundPage } from '@/pages/not-found';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <AppShell />,
    children: [
      {
        element: <BackendBootstrap />,
        children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/projects', element: <ProjectsPage /> },
      { path: '/projects/new', element: <ProjectNewPage /> },
      { path: '/projects/:projectId/edit', element: <ProjectEditPage /> },
      { path: '/projects/:projectId', element: <ProjectDetailPage /> },
      { path: '/projects/:projectId/tasks', element: <ProjectTasksPage /> },
      { path: '/projects/:projectId/tasks/:taskId', element: <ProjectTaskDetailPage /> },
      { path: '/projects/:projectId/docs', element: <ProjectDocsPage /> },
      { path: '/projects/:projectId/api', element: <ProjectApiPage /> },
      { path: '/projects/:projectId/roadmap', element: <ProjectRoadmapPage /> },
      { path: '/documents', element: <DocumentsPage /> },
      { path: '/clients', element: <ClientsPage /> },
      { path: '/clients/:clientId', element: <ClientDetailPage /> },
      { path: '/team', element: <TeamPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
