export type AutomationTrigger =
  | 'deadline_soon'
  | 'critical_tasks'
  | 'if_then'
  | 'sla_escalation';

export type AutomationWhenField = 'status' | 'priority';
export type AutomationThenAction = 'webhook' | 'notify';

export interface IfThenConfig {
  when: { field: AutomationWhenField; value: string };
  then: { action: AutomationThenAction; event?: string; message?: string };
}

export interface SlaConfig {
  hoursWithoutUpdate: number;
  priority: 'HIGH' | 'CRITICAL';
}
