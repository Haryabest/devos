export interface RoadmapColumn {
  id: string;
  projectId: string;
  name: string;
  color: string;
  order: number;
}

export interface RoadmapCard {
  id: string;
  projectId: string;
  columnId: string;
  title: string;
  description: string;
  order: number;
  createdAt: string;
}
