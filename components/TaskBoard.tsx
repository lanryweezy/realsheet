import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, MoreVertical, Calendar, Clock, Flag, CheckCircle, 
  AlertCircle, ChevronDown, Search, Filter, Grid3x3, 
  List, BarChart3, Zap, Brain, Sparkles, X
} from 'lucide-react';
import { 
  Task, Project, createTask, createNotification,
  loadFromStorage, saveToStorage, addToStorage, updateInStorage, removeFromStorage,
  STORAGE_KEYS, Notification
} from '../types/productivity';
import { SheetData } from '../types';

interface TaskBoardProps {
  isOpen: boolean;
  onClose: () => void;
  sheetData?: SheetData | null;
  onNavigate?: (type: string, id: string) => void;
}

const TaskBoard: React.FC<TaskBoardProps> = ({
  isOpen,
  onClose,
  sheetData,
  onNavigate
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [filter, setFilter] = useState<Task['status'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Load tasks from storage
  useEffect(() => {
    const storedTasks = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS);
    if (storedTasks && Array.isArray(storedTasks)) {
      setTasks(storedTasks.map(t => ({
        ...t,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt)
      })));
    }

    const storedProjects = loadFromStorage<Project[]>(STORAGE_KEYS.PROJECTS);
    if (storedProjects) {
      setProjects(storedProjects);
    }
  }, []);

  // Save tasks to storage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }, [tasks]);

  // Analyze sheet and create tasks
  useEffect(() => {
    if (sheetData && sheetData.rows.length > 0) {
      const newTasks: Task[] = [];
      
      sheetData.rows.forEach((row, rowIndex) => {
        Object.entries(row).forEach(([col, value]) => {
          const cellValue = String(value);
          
          // Detect potential tasks
          if (
            col.toLowerCase().includes('task') ||
            col.toLowerCase().includes('todo') ||
            col.toLowerCase().includes('action') ||
            col.toLowerCase().includes('deadline')
          ) {
            const dueDateMatch = cellValue.match(/\d{4}-\d{2}-\d{2}/);
            const dueDate = dueDateMatch ? new Date(dueDateMatch[0]) : undefined;
            
            const task = createTask(
              `${col}: ${cellValue}`,
              'medium',
              dueDate,
              {
                sheetId: sheetData.id,
                cellReference: `${col}${rowIndex + 1}`,
                range: `${col}${rowIndex + 1}`
              }
            );
            
            newTasks.push(task);
          }
        });
      });
      
      if (newTasks.length > 0 && tasks.length === 0) {
        setTasks(newTasks);
        
        // Create notification for new tasks
        const notification = createNotification(
          'task',
          'medium',
          'Tasks Detected',
          `Found ${newTasks.length} potential tasks in your spreadsheet`,
          { sheetId: sheetData.id }
        );
        
        const existingNotifs = loadFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS) || [];
        saveToStorage(STORAGE_KEYS.NOTIFICATIONS, [...existingNotifs, notification]);
      }
    }
  }, [sheetData]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter !== 'all' && task.status !== filter) return false;
      if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [tasks, filter, searchQuery]);

  // Group tasks by status
  const groupedTasks = useMemo(() => ({
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    review: filteredTasks.filter(t => t.status === 'review'),
    done: filteredTasks.filter(t => t.status === 'done'),
    blocked: filteredTasks.filter(t => t.status === 'blocked'),
  } as Record<string, Task[]>), [filteredTasks]);

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const task = createTask(newTaskTitle, 'medium');
    setTasks(prev => [...prev, task]);
    setNewTaskTitle('');
    setIsCreatingTask(false);
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    updateInStorage<Task>(STORAGE_KEYS.TASKS, taskId, { 
      status,
      updatedAt: new Date(),
      completedAt: status === 'done' ? new Date() : undefined
    });
    
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status, updatedAt: new Date(), completedAt: status === 'done' ? new Date() : undefined } : t
    ));
  };

  const deleteTask = (taskId: string) => {
    removeFromStorage(STORAGE_KEYS.TASKS, taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-slate-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-slate-500';
      case 'in_progress': return 'bg-blue-500';
      case 'review': return 'bg-yellow-500';
      case 'done': return 'bg-green-500';
      case 'blocked': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getAIInsights = (task: Task) => {
    const insights: string[] = [];
    
    if (task.dueDate) {
      const daysUntil = Math.ceil((task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) {
        insights.push(`⚠️ Overdue by ${Math.abs(daysUntil)} days`);
      } else if (daysUntil <= 2) {
        insights.push(`⏰ Due in ${daysUntil} days`);
      }
    }
    
    if (task.subtasks && task.subtasks.length > 0) {
      const completed = task.subtasks.filter(s => s.isCompleted).length;
      insights.push(`📊 ${completed}/${task.subtasks.length} subtasks complete`);
    }
    
    return insights;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-6xl h-[80vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-nexus-accent/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-nexus-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Task Board</h2>
              <p className="text-xs text-slate-400">
                {tasks.filter(t => t.status === 'done').length}/{tasks.length} completed
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setView('board')}
                className={`p-2 rounded transition-colors ${
                  view === 'board' ? 'bg-nexus-accent text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Board view"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded transition-colors ${
                  view === 'list' ? 'bg-nexus-accent text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-nexus-accent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {/* Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-nexus-accent"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
            
            <button
              onClick={() => setIsCreatingTask(true)}
              className="flex items-center gap-2 px-4 py-2 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        {/* Quick Task Creation */}
        {isCreatingTask && (
          <div className="p-4 border-b border-slate-700 bg-slate-800/50">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="What needs to be done?"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                autoFocus
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-nexus-accent"
              />
              <button
                onClick={addTask}
                className="px-4 py-2 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsCreatingTask(false);
                  setNewTaskTitle('');
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Board View */}
        {view === 'board' ? (
          <div className="flex-1 overflow-x-auto p-4">
            <div className="flex gap-4 h-full">
              {Object.entries(groupedTasks).map(([status, statusTasks]) => (
                <div key={status} className="flex-shrink-0 w-80">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                      <h3 className="text-sm font-semibold text-white capitalize">{status.replace('_', ' ')}</h3>
                      <span className="text-xs text-slate-500">({statusTasks.length})</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {statusTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onSelect={() => setSelectedTask(task)}
                        onUpdateStatus={updateTaskStatus}
                        onDelete={deleteTask}
                        getPriorityColor={getPriorityColor}
                        getAIInsights={getAIInsights}
                      />
                    ))}
                    
                    {statusTasks.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-slate-700 rounded-lg">
                        <p className="text-xs text-slate-500">No tasks</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <button
                      onClick={() => updateTaskStatus(task.id, task.status === 'done' ? 'todo' : 'done')}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        task.status === 'done'
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-600 hover:border-nexus-accent'
                      }`}
                    >
                      {task.status === 'done' && <CheckCircle className="w-4 h-4 text-white" />}
                    </button>
                    
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${
                        task.status === 'done' ? 'text-slate-500 line-through' : 'text-white'
                      }`}>
                        {task.title}
                      </h4>
                      {task.dueDate && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          <span>{task.dueDate.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Flag className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
                    <button
                      onClick={() => setSelectedTask(task)}
                      className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdateStatus={updateTaskStatus}
          onDelete={deleteTask}
        />
      )}
    </div>
  );
};

// Task Card Component
interface TaskCardProps {
  task: Task;
  onSelect: () => void;
  onUpdateStatus: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
  getPriorityColor: (priority: string) => string;
  getAIInsights: (task: Task) => string[];
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onSelect,
  onUpdateStatus,
  onDelete,
  getPriorityColor,
  getAIInsights
}) => {
  const insights = getAIInsights(task);
  
  return (
    <div
      onClick={onSelect}
      className="p-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-white flex-1">{task.title}</h4>
        <Flag className={`w-4 h-4 flex-shrink-0 ${getPriorityColor(task.priority)}`} />
      </div>
      
      {task.dueDate && (
        <div className="flex items-center gap-1 mb-2 text-xs text-slate-400">
          <Calendar className="w-3 h-3" />
          <span>{task.dueDate.toLocaleDateString()}</span>
        </div>
      )}
      
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {insights.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-slate-700">
          {insights.map((insight, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-slate-400">
              <Brain className="w-3 h-3 text-nexus-accent" />
              <span>{insight}</span>
            </div>
          ))}
        </div>
      )}
      
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-nexus-accent transition-all"
                style={{ 
                  width: `${(task.subtasks.filter(s => s.isCompleted).length / task.subtasks.length) * 100}%`
                }}
              />
            </div>
            <span>
              {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Task Detail Modal
interface TaskDetailModalProps {
  task: Task;
  onClose: () => void;
  onUpdateStatus: (id: string, status: Task['status']) => void;
  onDelete: (id: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onUpdateStatus,
  onDelete
}) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl max-h-[80vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
          <h3 className="text-lg font-bold text-white">{task.title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Status */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Status</label>
            <select
              value={task.status}
              onChange={(e) => onUpdateStatus(task.id, e.target.value as Task['status'])}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-nexus-accent"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          
          {/* Priority */}
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Priority</label>
            <div className="flex items-center gap-2">
              <Flag className={`w-5 h-5 ${
                task.priority === 'urgent' ? 'text-red-500' :
                task.priority === 'high' ? 'text-orange-500' :
                task.priority === 'medium' ? 'text-yellow-500' :
                'text-blue-500'
              }`} />
              <span className="text-sm text-white capitalize">{task.priority}</span>
            </div>
          </div>
          
          {/* Due Date */}
          {task.dueDate && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Due Date</label>
              <div className="flex items-center gap-2 text-white">
                <Calendar className="w-5 h-5 text-slate-400" />
                <span>{task.dueDate.toLocaleDateString()}</span>
              </div>
            </div>
          )}
          
          {/* Description */}
          {task.description && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Description</label>
              <p className="text-sm text-slate-300">{task.description}</p>
            </div>
          )}
          
          {/* Subtasks */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Subtasks</label>
              <div className="space-y-2">
                {task.subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-2 p-2 bg-slate-800 rounded">
                    <input
                      type="checkbox"
                      checked={subtask.isCompleted}
                      readOnly
                      className="w-4 h-4 rounded border-slate-600 text-nexus-accent focus:ring-nexus-accent"
                    />
                    <span className={subtask.isCompleted ? 'text-slate-500 line-through' : 'text-white'}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-700">
            <button
              onClick={() => {
                onDelete(task.id);
                onClose();
              }}
              className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-colors"
            >
              Delete Task
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;
