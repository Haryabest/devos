import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { DashboardPage } from '@/pages/dashboard';
import { ProjectsPage } from '@/pages/projects';
import { ProjectDetailPage } from '@/pages/project-detail';
import { TasksPage } from '@/pages/tasks';
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
      { path: '/tasks', element: <TasksPage /> },
      { path: '/documents', element: <DocumentsPage /> },
      { path: '/clients', element: <ClientsPage /> },
      { path: '/team', element: <TeamPage /> },
      { path: '/ai', element: <AiCenterPage /> },
      { path: '/settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
