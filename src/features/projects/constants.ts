import type { HealthScore, ProjectStatus, ProjectType } from '@/shared/types';

export type StatusFilter = ProjectStatus | 'ALL';
export type TypeFilter = ProjectType | 'ALL';
export type HealthFilter = HealthScore | 'ALL';
export type GroupFilter = string | 'ALL' | 'NONE';
