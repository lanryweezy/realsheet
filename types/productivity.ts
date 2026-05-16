import { SheetData } from '../types';

export interface Notification {
  id: string;
  type: 'task' | 'reminder' | 'deadline' | 'meeting' | 'goal' | 'insight';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  scheduledAt?: Date;
  expiresAt?: Date;
  isRead: boolean;
  isActioned: boolean;
  relatedData?: {
    sheetId?: string;
    cellReference?: string;
    taskId?: string;
    projectId?: string;
  };
  actions?: NotificationAction[];
  createdAt: Date;
}

export interface NotificationAction {
  id: string;
  label: string;
  type: 'navigate' | 'execute' | 'dismiss' | 'snooze';
  payload?: any;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  completedAt?: Date;
  tags: string[];
  assignees?: string[];
  relatedData?: {
    sheetId?: string;
    cellReference?: string;
    range?: string;
  };
  subtasks?: Subtask[];
  attachments?: TaskAttachment[];
  aiSuggestions?: TaskAISuggestion[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface TaskAttachment {
  id: string;
  type: 'file' | 'link' | 'note' | 'email';
  url?: string;
  content?: string;
  createdAt: Date;
}

export interface TaskAISuggestion {
  type: 'priority_change' | 'due_date_change' | 'subtask_suggestion' | 'automation';
  suggestion: string;
  confidence: number;
  reason: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'archived';
  startDate: Date;
  endDate?: Date;
  tasks: Task[];
  milestones: Milestone[];
  color?: string;
  team?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: Date;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface DailyPlan {
  date: string; // ISO date string
  tasks: Task[];
  meetings: Meeting[];
  goals: string[];
  notes?: string;
  aiInsights?: DailyAIInsight[];
  completedAt?: Date;
}

export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  location?: string;
  videoLink?: string;
  agenda?: string;
  notes?: string;
}

export interface DailyAIInsight {
  type: 'productivity' | 'scheduling' | 'wellness' | 'goal';
  insight: string;
  action?: string;
  confidence: number;
}

export interface Routine {
  id: string;
  name: string;
  type: 'morning' | 'evening' | 'work' | 'custom';
  tasks: RoutineTask[];
  schedule: {
    daysOfWeek: number[]; // 0-6 (Sunday-Saturday)
    time?: string; // HH:MM format
  };
  isActive: boolean;
  streak?: number;
  lastCompleted?: Date;
}

export interface RoutineTask {
  id: string;
  title: string;
  duration?: number; // minutes
  isCompleted: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  startDate: Date;
  endDate?: Date;
  milestones: GoalMilestone[];
  tasks: Task[];
  progress: number; // 0-100
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  aiInsights?: GoalAIInsight[];
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface GoalAIInsight {
  type: 'on_track' | 'behind' | 'ahead' | 'recommendation';
  insight: string;
  suggestion?: string;
  confidence: number;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  tags: string[];
  lastContactedAt?: Date;
  nextFollowUpAt?: Date;
  interactionHistory: Interaction[];
  notes?: string;
}

export interface Interaction {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'message' | 'note';
  timestamp: Date;
  summary?: string;
  notes?: string;
  relatedData?: any;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetPerDay?: number;
  streak: number;
  completions: Date[]; // Array of completion dates
  goal?: number; // Target streak
  isActive: boolean;
}

export interface ProductivityInsight {
  type: 'task_completion' | 'time_usage' | 'pattern' | 'recommendation';
  title: string;
  description: string;
  data?: any;
  actionable?: boolean;
  actionSuggestion?: string;
}

export interface DailyPlan {
  date: string;
  tasks: Task[];
  meetings: Meeting[];
  goals: string[];
  notes?: string;
  aiInsights?: DailyAIInsight[];
  completedAt?: Date;
  rating?: number; // 1-5 stars
}

export interface DailyAIInsight {
  type: 'productivity' | 'scheduling' | 'wellness' | 'goal';
  insight: string;
  action?: string;
  confidence: number;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  startDate: Date;
  endDate?: Date;
  milestones: GoalMilestone[];
  tasks: Task[];
  progress: number;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  aiInsights?: GoalAIInsight[];
  category?: string;
  color?: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface GoalAIInsight {
  type: 'on_track' | 'behind' | 'ahead' | 'recommendation';
  insight: string;
  suggestion?: string;
  confidence: number;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  targetPerDay?: number;
  streak: number;
  completions: Date[];
  goal?: number;
  isActive: boolean;
  category?: string;
  icon?: string;
  color?: string;
}

export interface Routine {
  id: string;
  name: string;
  type: 'morning' | 'evening' | 'work' | 'custom';
  tasks: RoutineTask[];
  schedule: {
    daysOfWeek: number[];
    time?: string;
  };
  isActive: boolean;
  streak?: number;
  lastCompleted?: Date;
}

export interface RoutineTask {
  id: string;
  title: string;
  duration?: number;
  isCompleted: boolean;
  order?: number;
}

export interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
  location?: string;
  videoLink?: string;
  agenda?: string;
  notes?: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  role?: string;
  tags: string[];
  lastContactedAt?: Date;
  nextFollowUpAt?: Date;
  interactionHistory: Interaction[];
  notes?: string;
}

export interface Interaction {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'message' | 'note';
  timestamp: Date;
  summary?: string;
  notes?: string;
  relatedData?: any;
}

// Helper functions
export const createNotification = (
  type: Notification['type'],
  priority: Notification['priority'],
  title: string,
  message: string,
  relatedData?: Notification['relatedData']
): Notification => ({
  id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  priority,
  title,
  message,
  isRead: false,
  isActioned: false,
  relatedData,
  createdAt: new Date(),
});

export const createTask = (
  title: string,
  priority: Task['priority'] = 'medium',
  dueDate?: Date,
  relatedData?: Task['relatedData']
): Task => ({
  id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  title,
  status: 'todo',
  priority,
  dueDate,
  tags: [],
  relatedData,
  subtasks: [],
  attachments: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const createGoal = (
  title: string,
  type: Goal['type'],
  startDate: Date,
  endDate: Date,
  targetValue?: number
): Goal => ({
  id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  title,
  type,
  targetValue,
  currentValue: 0,
  startDate,
  endDate,
  milestones: [],
  tasks: [],
  progress: 0,
  status: 'active',
});

export const createHabit = (
  name: string,
  frequency: Habit['frequency'] = 'daily'
): Habit => ({
  id: `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  name,
  frequency,
  streak: 0,
  completions: [],
  isActive: true,
});

// Storage keys
export const STORAGE_KEYS = {
  NOTIFICATIONS: 'realsheet_notifications',
  TASKS: 'realsheet_tasks',
  PROJECTS: 'realsheet_projects',
  GOALS: 'realsheet_goals',
  HABITS: 'realsheet_habits',
  ROUTINES: 'realsheet_routines',
  CONTACTS: 'realsheet_contacts',
  DAILY_PLANS: 'realsheet_daily_plans',
};

// Local storage helpers
export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
};

export const loadFromStorage = <T>(key: string): T | null => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to load from storage:', error);
    return null;
  }
};

export const addToStorage = <T>(key: string, item: T): void => {
  const existing = loadFromStorage<T[]>(key) || [];
  existing.push(item);
  saveToStorage(key, existing);
};

export const updateInStorage = <T extends { id: string }>(key: string, itemId: string, updates: Partial<T>): void => {
  const existing = loadFromStorage<T[]>(key) || [];
  const updated = existing.map(item => 
    item.id === itemId ? { ...item, ...updates } : item
  );
  saveToStorage(key, updated);
};

export const removeFromStorage = (key: string, itemId: string): void => {
  const existing = loadFromStorage<any[]>(key) || [];
  const updated = existing.filter(item => item.id !== itemId);
  saveToStorage(key, updated);
};

// AI-powered notification suggestions
export interface NotificationSuggestion {
  type: 'deadline_approaching' | 'overdue_task' | 'meeting_soon' | 'follow_up' | 'insight';
  priority: 'low' | 'medium' | 'high';
  title: string;
  message: string;
  data: any;
}

export const analyzeSheetForNotifications = (sheetData: SheetData): NotificationSuggestion[] => {
  const suggestions: NotificationSuggestion[] = [];
  
  if (!sheetData || !sheetData.rows) return suggestions;
  
  // Analyze for deadlines
  sheetData.rows.forEach((row, rowIndex) => {
    Object.entries(row).forEach(([col, value]) => {
      const cellValue = String(value);
      
      // Check for dates in the future (potential deadlines)
      if (cellValue.match(/\d{4}-\d{2}-\d{2}/)) {
        const date = new Date(cellValue);
        const daysUntil = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil >= 0 && daysUntil <= 7) {
          suggestions.push({
            type: 'deadline_approaching',
            priority: daysUntil <= 2 ? 'high' : 'medium',
            title: `Deadline Approaching`,
            message: `${col} is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
            data: { rowIndex, column: col, value: cellValue, daysUntil }
          });
        }
      }
      
      // Check for task status
      if (col.toLowerCase().includes('status') || col.toLowerCase().includes('state')) {
        if (cellValue.toLowerCase().includes('overdue') || cellValue.toLowerCase().includes('blocked')) {
          suggestions.push({
            type: 'overdue_task',
            priority: 'high',
            title: 'Task Requires Attention',
            message: `${col}: ${cellValue}`,
            data: { rowIndex, column: col, value: cellValue }
          });
        }
      }
      
      // Check for follow-up needed
      if (col.toLowerCase().includes('follow') || col.toLowerCase().includes('contact')) {
        suggestions.push({
          type: 'follow_up',
          priority: 'medium',
          title: 'Follow-up Needed',
          message: `Follow up on: ${cellValue}`,
          data: { rowIndex, column: col, value: cellValue }
        });
      }
    });
  });
  
  return suggestions;
};
