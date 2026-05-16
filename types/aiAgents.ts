import { Task, Goal, Notification, SheetData } from './productivity';

// ============ AGENT TYPES ============

export type AgentType = 
  | 'personal_assistant'
  | 'research_agent'
  | 'email_agent'
  | 'calendar_agent'
  | 'data_analyst'
  | 'task_agent'
  | 'goal_coach'
  | 'habit_coach'
  | 'integration_agent';

export type AgentStatus = 'idle' | 'working' | 'waiting' | 'completed' | 'error';

export type AgentPriority = 'low' | 'medium' | 'high' | 'critical';

// ============ AGENT INTERFACES ============

export interface AIAgent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  icon: string;
  color: string;
  status: AgentStatus;
  isActive: boolean;
  capabilities: string[];
  currentTask?: AgentTask;
  completedTasks: number;
  successRate: number;
  lastActiveAt?: Date;
  createdAt: Date;
  config: AgentConfig;
}

export interface AgentConfig {
  autoExecute: boolean;
  notifyOnCompletion: boolean;
  workingHours?: {
    start: string; // HH:MM
    end: string; // HH:MM
  };
  maxConcurrentTasks: number;
  preferences: Record<string, any>;
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  priority: AgentPriority;
  input: any;
  output?: any;
  error?: string;
  progress: number; // 0-100
  steps: AgentTaskStep[];
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number; // minutes
  actualDuration?: number; // minutes
}

export interface AgentTaskStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface AgentAction {
  id: string;
  type: string;
  name: string;
  description: string;
  parameters: AgentParameter[];
  execute: (params: any) => Promise<AgentActionResult>;
}

export interface AgentParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface AgentActionResult {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  nextActions?: AgentAction[];
}

export interface AgentMessage {
  id: string;
  agentId: string;
  type: 'info' | 'question' | 'confirmation' | 'alert' | 'success';
  title: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  requiresResponse: boolean;
  suggestedResponses?: string[];
}

export interface AgentLog {
  id: string;
  agentId: string;
  taskId: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  message: string;
  data?: any;
  timestamp: Date;
}

// ============ SPECIALIZED AGENT TYPES ============

export interface PersonalAssistantAgent extends AIAgent {
  type: 'personal_assistant';
  specialties: ['scheduling', 'reminders', 'task_management', 'communication'];
  learnedPreferences: UserPreferences;
}

export interface UserPreferences {
  bestWorkHours?: string[];
  preferredBreakDuration?: number;
  taskPrioritizationStyle?: 'urgent_first' | 'important_first' | 'easy_first';
  communicationStyle?: 'brief' | 'detailed' | 'friendly';
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface ResearchAgent extends AIAgent {
  type: 'research_agent';
  specialties: ['web_research', 'data_collection', 'summarization', 'fact_checking'];
  sources: string[];
}

export interface EmailAgent extends AIAgent {
  type: 'email_agent';
  specialties: ['drafting', 'responding', 'categorizing', 'follow_ups'];
  connectedAccounts: string[];
  templates: EmailTemplate[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  category: string;
}

export interface CalendarAgent extends AIAgent {
  type: 'calendar_agent';
  specialties: ['scheduling', 'optimization', 'conflict_resolution', 'reminders'];
  connectedCalendars: string[];
  workingHours: WorkingHours;
  meetingPreferences: MeetingPreferences;
}

export interface WorkingHours {
  monday: { start: string; end: string; isWorking: boolean };
  tuesday: { start: string; end: string; isWorking: boolean };
  wednesday: { start: string; end: string; isWorking: boolean };
  thursday: { start: string; end: string; isWorking: boolean };
  friday: { start: string; end: string; isWorking: boolean };
  saturday: { start: string; end: string; isWorking: boolean };
  sunday: { start: string; end: string; isWorking: boolean };
}

export interface MeetingPreferences {
  defaultDuration: number;
  bufferBetweenMeetings: number;
  preferredTimes: string[];
  avoidTimes: string[];
}

export interface DataAnalystAgent extends AIAgent {
  type: 'data_analyst';
  specialties: ['analysis', 'visualization', 'insights', 'predictions'];
  models: string[];
  lastAnalysis?: AnalysisResult;
}

export interface AnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  visualizations: string[];
  timestamp: Date;
}

export interface TaskAgent extends AIAgent {
  type: 'task_agent';
  specialties: ['creation', 'prioritization', 'delegation', 'tracking'];
  activeTasks: Task[];
}

export interface GoalCoachAgent extends AIAgent {
  type: 'goal_coach';
  specialties: ['goal_setting', 'progress_tracking', 'motivation', 'accountability'];
  activeGoals: Goal[];
  checkInSchedule: string; // daily, weekly, etc.
}

export interface HabitCoachAgent extends AIAgent {
  type: 'habit_coach';
  specialties: ['habit_formation', 'streak_tracking', 'motivation', 'accountability'];
  trackedHabits: string[];
}

export interface IntegrationAgent extends AIAgent {
  type: 'integration_agent';
  specialties: ['api_integration', 'webhooks', 'automation', 'sync'];
  connectedServices: string[];
  activeIntegrations: Integration[];
}

export interface Integration {
  id: string;
  service: string;
  type: 'webhook' | 'api' | 'sync';
  config: any;
  isActive: boolean;
  lastSyncAt?: Date;
}

// ============ AGENT ORCHESTRATION ============

export interface AgentNetwork {
  agents: AIAgent[];
  activeTasks: AgentTask[];
  messageQueue: AgentMessage[];
  logs: AgentLog[];
}

export interface AgentCoordinator {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'error';
  assignedAgents: string[];
  currentObjective?: AgentObjective;
  completedObjectives: number;
}

export interface AgentObjective {
  id: string;
  title: string;
  description: string;
  priority: AgentPriority;
  assignedAgents: string[];
  tasks: AgentTask[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  deadline?: Date;
}

// ============ HELPER FUNCTIONS ============

export const createAgent = (
  type: AgentType,
  name: string,
  description: string,
  icon: string,
  color: string,
  capabilities: string[]
): AIAgent => ({
  id: `agent_${type}_${Date.now()}`,
  type,
  name,
  description,
  icon,
  color,
  status: 'idle',
  isActive: true,
  capabilities,
  completedTasks: 0,
  successRate: 100,
  createdAt: new Date(),
  config: {
    autoExecute: false,
    notifyOnCompletion: true,
    maxConcurrentTasks: 3,
    preferences: {}
  }
});

export const createAgentTask = (
  agentId: string,
  type: string,
  title: string,
  description: string,
  priority: AgentPriority = 'medium',
  input: any = {}
): AgentTask => ({
  id: `task_${Date.now()}`,
  agentId,
  type,
  title,
  description,
  status: 'pending',
  priority,
  input,
  progress: 0,
  steps: [],
  createdAt: new Date()
});

export const createAgentMessage = (
  agentId: string,
  type: AgentMessage['type'],
  title: string,
  content: string,
  requiresResponse = false
): AgentMessage => ({
  id: `msg_${Date.now()}`,
  agentId,
  type,
  title,
  content,
  timestamp: new Date(),
  isRead: false,
  requiresResponse
});

// ============ PREDEFINED AGENTS ============

export const PREDEFINED_AGENTS: Omit<AIAgent, 'id' | 'createdAt'>[] = [
  {
    type: 'personal_assistant',
    name: 'Alex - Personal Assistant',
    description: 'Manages your schedule, tasks, and reminders',
    icon: '👤',
    color: '#3B82F6',
    status: 'idle',
    isActive: true,
    capabilities: [
      'Schedule management',
      'Task prioritization',
      'Smart reminders',
      'Meeting coordination'
    ],
    completedTasks: 0,
    successRate: 100,
    config: {
      autoExecute: false,
      notifyOnCompletion: true,
      maxConcurrentTasks: 5,
      preferences: {}
    }
  },
  {
    type: 'research_agent',
    name: 'Riley - Research Specialist',
    description: 'Gathers information and provides insights',
    icon: '🔬',
    color: '#8B5CF6',
    status: 'idle',
    isActive: true,
    capabilities: [
      'Web research',
      'Data collection',
      'Summarization',
      'Fact checking'
    ],
    completedTasks: 0,
    successRate: 100,
    config: {
      autoExecute: false,
      notifyOnCompletion: true,
      maxConcurrentTasks: 3,
      preferences: {}
    }
  },
  {
    type: 'email_agent',
    name: 'Emmett - Email Assistant',
    description: 'Drafts and manages your email communications',
    icon: '📧',
    color: '#EC4899',
    status: 'idle',
    isActive: true,
    capabilities: [
      'Email drafting',
      'Auto-responses',
      'Email categorization',
      'Follow-up reminders'
    ],
    completedTasks: 0,
    successRate: 100,
    config: {
      autoExecute: false,
      notifyOnCompletion: true,
      maxConcurrentTasks: 10,
      preferences: {}
    }
  },
  {
    type: 'calendar_agent',
    name: 'Cal - Calendar Manager',
    description: 'Optimizes your schedule and manages meetings',
    icon: '📅',
    color: '#10B981',
    status: 'idle',
    isActive: true,
    capabilities: [
      'Schedule optimization',
      'Meeting scheduling',
      'Conflict resolution',
      'Time blocking'
    ],
    completedTasks: 0,
    successRate: 100,
    config: {
      autoExecute: false,
      notifyOnCompletion: true,
      maxConcurrentTasks: 5,
      preferences: {}
    }
  },
  {
    type: 'data_analyst',
    name: 'Data - Analytics Expert',
    description: 'Analyzes your data and provides actionable insights',
    icon: '📊',
    color: '#F59E0B',
    status: 'idle',
    isActive: true,
    capabilities: [
      'Data analysis',
      'Trend detection',
      'Predictions',
      'Visualization recommendations'
    ],
    completedTasks: 0,
    successRate: 100,
    config: {
      autoExecute: false,
      notifyOnCompletion: true,
      maxConcurrentTasks: 3,
      preferences: {}
    }
  },
  {
    type: 'task_agent',
    name: 'Tasky - Task Coordinator',
    description: 'Manages and prioritizes your task queue',
    icon: '✅',
    color: '#06B6D4',
    status: 'idle',
    isActive: true,
    capabilities: [
      'Task creation',
      'Prioritization',
      'Progress tracking',
      'Deadline management'
    ],
    completedTasks: 0,
    successRate: 100,
    config: {
      autoExecute: false,
      notifyOnCompletion: true,
      maxConcurrentTasks: 10,
      preferences: {}
    }
  },
  {
    type: 'goal_coach',
    name: 'Coach - Goal Strategist',
    description: 'Helps you set and achieve your goals',
    icon: '🎯',
    color: '#EF4444',
    status: 'idle',
    isActive: true,
    capabilities: [
      'Goal setting',
      'Progress tracking',
      'Milestone planning',
      'Motivation'
    ],
    completedTasks: 0,
    successRate: 100,
    config: {
      autoExecute: false,
      notifyOnCompletion: true,
      maxConcurrentTasks: 5,
      preferences: {}
    }
  },
  {
    type: 'habit_coach',
    name: 'Habit - Habit Builder',
    description: 'Builds and tracks your daily habits',
    icon: '🔥',
    color: '#F97316',
    status: 'idle',
    isActive: true,
    capabilities: [
      'Habit formation',
      'Streak tracking',
      'Motivation',
      'Accountability'
    ],
    completedTasks: 0,
    successRate: 100,
    config: {
      autoExecute: false,
      notifyOnCompletion: true,
      maxConcurrentTasks: 10,
      preferences: {}
    }
  }
];

// ============ AGENT WORKFLOWS ============

export interface AgentWorkflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  isActive: boolean;
}

export interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'event' | 'condition';
  schedule?: string; // cron expression
  event?: string;
  condition?: string;
}

export interface WorkflowStep {
  id: string;
  agentId: string;
  action: string;
  parameters: any;
  condition?: string;
  onError?: 'stop' | 'continue' | 'retry';
  maxRetries?: number;
}

export const PREDEFINED_WORKFLOWS: AgentWorkflow[] = [
  {
    id: 'workflow_daily_planning',
    name: 'Daily Planning Routine',
    description: 'Automated morning planning routine',
    trigger: {
      type: 'scheduled',
      schedule: '0 8 * * *' // 8 AM daily
    },
    steps: [
      {
        id: 'step_1',
        agentId: 'agent_personal_assistant',
        action: 'review_calendar',
        parameters: { date: 'today' },
        onError: 'continue'
      },
      {
        id: 'step_2',
        agentId: 'agent_task_agent',
        action: 'prioritize_tasks',
        parameters: { date: 'today', maxTasks: 5 },
        onError: 'continue'
      },
      {
        id: 'step_3',
        agentId: 'agent_personal_assistant',
        action: 'create_daily_plan',
        parameters: {},
        onError: 'stop'
      }
    ],
    isActive: true
  },
  {
    id: 'workflow_meeting_prep',
    name: 'Meeting Preparation',
    description: 'Automated meeting preparation workflow',
    trigger: {
      type: 'scheduled',
      schedule: '30 * * * *' // Every hour at :30
    },
    steps: [
      {
        id: 'step_1',
        agentId: 'agent_calendar_agent',
        action: 'check_upcoming_meetings',
        parameters: { withinMinutes: 30 },
        onError: 'continue'
      },
      {
        id: 'step_2',
        agentId: 'agent_research_agent',
        action: 'gather_meeting_context',
        parameters: {},
        condition: 'meetings_found',
        onError: 'continue'
      },
      {
        id: 'step_3',
        agentId: 'agent_personal_assistant',
        action: 'send_preparation_summary',
        parameters: {},
        onError: 'continue'
      }
    ],
    isActive: true
  },
  {
    id: 'workflow_goal_checkin',
    name: 'Goal Progress Check-in',
    description: 'Weekly goal progress review',
    trigger: {
      type: 'scheduled',
      schedule: '0 9 * * 1' // Monday 9 AM
    },
    steps: [
      {
        id: 'step_1',
        agentId: 'agent_goal_coach',
        action: 'review_goals',
        parameters: { period: 'week' },
        onError: 'continue'
      },
      {
        id: 'step_2',
        agentId: 'agent_goal_coach',
        action: 'generate_progress_report',
        parameters: {},
        onError: 'continue'
      },
      {
        id: 'step_3',
        agentId: 'agent_goal_coach',
        action: 'suggest_adjustments',
        parameters: {},
        onError: 'continue'
      }
    ],
    isActive: true
  }
];
