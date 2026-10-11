export type StepType =
  | 'ai_prompt'
  | 'http_request'
  | 'webhook_send'
  | 'github_create_issue'
  | 'github_create_pr_desc'
  | 'github_comment'
  | 'code_transform'
  | 'text_transform'
  | 'condition'
  | 'variable_set'
  | 'delay'
  | 'slack_message'
  | 'discord_message'
  | 'loop'
  | 'script_js';

export type TriggerType = 'manual' | 'webhook' | 'schedule' | 'github_push' | 'github_pr';

export interface PipelineStep {
  id: string;
  type: StepType;
  label: string;
  config: Record<string, string>;
  enabled: boolean;
  outputVar?: string; // stores step output into {{varName}}
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  startedAt: string;
  finishedAt?: string;
  status: 'running' | 'success' | 'failed' | 'cancelled';
  logs: RunLog[];
  variables: Record<string, string>;
  triggeredBy: string;
}

export interface RunLog {
  stepId: string;
  stepLabel: string;
  startedAt: string;
  finishedAt?: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  output?: string;
  error?: string;
}

export interface Pipeline {
  id: string;
  name: string;
  description: string;
  trigger: TriggerType;
  triggerConfig: Record<string, string>;
  steps: PipelineStep[];
  variables: Record<string, string>; // initial variable defaults
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'failed';
  runCount: number;
  enabled: boolean;
  tags: string[];
}
