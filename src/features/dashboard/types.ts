export type ActivityItem = {
  id: string;
  kind: 'task' | 'doc' | 'project';
  title: string;
  projectName?: string;
  projectId?: string;
  at: string;
};

export type Recommendation = {
  text: string;
  action?: () => void;
  label?: string;
};
