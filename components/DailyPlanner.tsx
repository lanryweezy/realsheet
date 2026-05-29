import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Clock, Sun, Moon, Coffee, Briefcase, Dumbbell, Book,
  Plus, Check, X, ChevronLeft, ChevronRight, Sparkles, Brain,
  TrendingUp, Target, Award, Zap, Star, Edit2, Trash2
} from 'lucide-react';
import { 
  DailyPlan, Habit, Goal, Routine, Task,
  loadFromStorage, saveToStorage, addToStorage, updateInStorage, removeFromStorage,
  STORAGE_KEYS
} from '../types/productivity';

interface DailyPlannerProps {
  isOpen: boolean;
  onClose: () => void;
}

const DailyPlanner: React.FC<DailyPlannerProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyPlan, setDailyPlan] = useState<DailyPlan | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newHabit, setNewHabit] = useState('');

  // Load data from storage
  useEffect(() => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    const storedPlan = loadFromStorage<DailyPlan>(`daily_plan_${dateKey}`);
    if (storedPlan) {
      setDailyPlan(storedPlan);
    } else {
      // Create new plan for today
      const newPlan: DailyPlan = {
        date: dateKey,
        tasks: [],
        meetings: [],
        goals: [],
        notes: '',
        aiInsights: generateAIInsights()
      };
      setDailyPlan(newPlan);
    }

    const storedHabits = loadFromStorage<Habit[]>(STORAGE_KEYS.HABITS);
    if (storedHabits) setHabits(storedHabits);

    const storedGoals = loadFromStorage<Goal[]>(STORAGE_KEYS.GOALS);
    if (storedGoals) setGoals(storedGoals);

    const storedRoutines = loadFromStorage<Routine[]>(STORAGE_KEYS.ROUTINES);
    if (storedRoutines) setRoutines(storedRoutines);
  }, [selectedDate]);

  // Generate AI insights for the day
  function generateAIInsights() {
    const insights = [
      {
        type: 'productivity' as const,
        insight: 'Your most productive hours are 9-11 AM. Schedule deep work then.',
        confidence: 0.85
      },
      {
        type: 'scheduling' as const,
        insight: 'You have 3 high-priority tasks today. Consider blocking 2 hours.',
        confidence: 0.90
      },
      {
        type: 'wellness' as const,
        insight: 'Take a break every 90 minutes. Your focus declines after that.',
        confidence: 0.75
      }
    ];
    return insights;
  }

  const addTask = () => {
    if (!newTask.trim() || !dailyPlan) return;
    
    const task: Task = {
      id: `task_${Date.now()}`,
      title: newTask,
      status: 'todo',
      priority: 'medium',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const updatedPlan = { ...dailyPlan, tasks: [...dailyPlan.tasks, task] };
    setDailyPlan(updatedPlan);
    saveToStorage(`daily_plan_${selectedDate.toISOString().split('T')[0]}`, updatedPlan);
    setNewTask('');
  };

  const completeTask = (taskId: string) => {
    if (!dailyPlan) return;
    
    const updatedPlan: DailyPlan = {
      ...dailyPlan,
      tasks: dailyPlan.tasks.map(t => 
        t.id === taskId ? {
          ...t,
          status: (t.status === 'done' ? 'todo' : 'done') as Task['status'],
          completedAt: t.status === 'done' ? undefined : new Date()
        } : t
      )
    };
    
    setDailyPlan(updatedPlan);
    saveToStorage(`daily_plan_${selectedDate.toISOString().split('T')[0]}`, updatedPlan);
  };

  const deleteTask = (taskId: string) => {
    if (!dailyPlan) return;
    
    const updatedPlan = {
      ...dailyPlan,
      tasks: dailyPlan.tasks.filter(t => t.id !== taskId)
    };
    
    setDailyPlan(updatedPlan);
    saveToStorage(`daily_plan_${selectedDate.toISOString().split('T')[0]}`, updatedPlan);
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    
    const goal: Goal = {
      id: `goal_${Date.now()}`,
      title: newGoal,
      type: 'daily',
      startDate: new Date(),
      endDate: new Date(),
      progress: 0,
      status: 'active',
      tasks: [],
      milestones: []
    };
    
    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    saveToStorage(STORAGE_KEYS.GOALS, updatedGoals);
    setNewGoal('');
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    
    const habit: Habit = {
      id: `habit_${Date.now()}`,
      name: newHabit,
      frequency: 'daily',
      streak: 0,
      completions: [],
      isActive: true
    };
    
    const updatedHabits = [...habits, habit];
    setHabits(updatedHabits);
    saveToStorage(STORAGE_KEYS.HABITS, updatedHabits);
    setNewHabit('');
  };

  const completeHabit = (habitId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    const updatedHabits = habits.map(h => {
      if (h.id === habitId) {
        const alreadyCompleted = h.completions.some(
          d => d.toISOString().split('T')[0] === today
        );
        
        if (alreadyCompleted) {
          return {
            ...h,
            completions: h.completions.filter(d => d.toISOString().split('T')[0] !== today),
            streak: Math.max(0, h.streak - 1)
          };
        } else {
          return {
            ...h,
            completions: [...h.completions, new Date()],
            streak: h.streak + 1
          };
        }
      }
      return h;
    });
    
    setHabits(updatedHabits);
    saveToStorage(STORAGE_KEYS.HABITS, updatedHabits);
  };

  const getDayName = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const navigateDay = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const completedTasks = dailyPlan?.tasks.filter(t => t.status === 'done').length || 0;
  const totalTasks = dailyPlan?.tasks.length || 0;
  const progressPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-nexus-accent/20 to-purple-500/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDay(-1)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white">{getDayName(selectedDate)}</h2>
                <p className="text-xs text-slate-400">{selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <button
                onClick={() => navigateDay(1)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1.5 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Today
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex h-full">
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Progress Bar */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-white">Daily Progress</h3>
                <span className="text-xs text-slate-400">{completedTasks}/{totalTasks} tasks</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-nexus-accent to-purple-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              {progressPercent === 100 && (
                <div className="flex items-center gap-2 mt-2 text-green-400 text-xs">
                  <Award className="w-4 h-4" />
                  <span>All tasks completed! Great job! 🎉</span>
                </div>
              )}
            </div>

            {/* AI Insights */}
            {dailyPlan?.aiInsights && dailyPlan.aiInsights.length > 0 && (
              <div className="bg-gradient-to-r from-purple-900/30 to-nexus-accent/30 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-semibold text-white">AI Insights for Today</h3>
                </div>
                <div className="space-y-2">
                  {dailyPlan.aiInsights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <Brain className="w-4 h-4 text-nexus-accent flex-shrink-0 mt-0.5" />
                      <span>{insight.insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-nexus-accent" />
                  <h3 className="text-sm font-semibold text-white">Today's Tasks</h3>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              
              {isEditing && (
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Add a new task..."
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    autoFocus
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-nexus-accent"
                  />
                  <button
                    onClick={addTask}
                    className="px-3 py-2 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Add
                  </button>
                </div>
              )}
              
              <div className="space-y-2">
                {dailyPlan?.tasks.map(task => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      task.status === 'done' ? 'bg-slate-900/50' : 'bg-slate-900'
                    }`}
                  >
                    <button
                      onClick={() => completeTask(task.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        task.status === 'done'
                          ? 'bg-green-500 border-green-500'
                          : 'border-slate-600 hover:border-nexus-accent'
                      }`}
                    >
                      {task.status === 'done' && <Check className="w-3 h-3 text-white" />}
                    </button>
                    <span className={`flex-1 text-sm ${
                      task.status === 'done' ? 'text-slate-500 line-through' : 'text-white'
                    }`}>
                      {task.title}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                {(!dailyPlan?.tasks || dailyPlan.tasks.length === 0) && (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    <p>No tasks yet. Add your first task!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Habits */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-sm font-semibold text-white">Daily Habits</h3>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Add a new habit..."
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-nexus-accent"
                />
                <button
                  onClick={addHabit}
                  className="px-3 py-2 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Add
                </button>
              </div>
              
              <div className="space-y-2">
                {habits.map(habit => {
                  const today = new Date().toISOString().split('T')[0];
                  const completedToday = habit.completions.some(
                    d => d.toISOString().split('T')[0] === today
                  );
                  
                  return (
                    <div
                      key={habit.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        completedToday ? 'bg-green-900/20 border border-green-500/30' : 'bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => completeHabit(habit.id)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            completedToday
                              ? 'bg-green-500 text-white'
                              : 'bg-slate-700 hover:bg-nexus-accent text-slate-300'
                          }`}
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <div>
                          <h4 className="text-sm font-medium text-white">{habit.name}</h4>
                          <p className="text-xs text-slate-400">🔥 {habit.streak} day streak</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 border-l border-slate-700 p-4 space-y-4 overflow-y-auto">
            {/* Goals */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-nexus-accent" />
                  <h3 className="text-sm font-semibold text-white">Active Goals</h3>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <input
                  type="text"
                  placeholder="Add a goal..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addGoal()}
                  className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-nexus-accent"
                />
                <button
                  onClick={addGoal}
                  className="p-2 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-2">
                {goals.filter(g => g.status === 'active').map(goal => (
                  <div key={goal.id} className="p-3 bg-slate-800 rounded-lg">
                    <h4 className="text-sm font-medium text-white mb-2">{goal.title}</h4>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-nexus-accent transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{goal.progress}% complete</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Notes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Book className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Notes</h3>
              </div>
              <textarea
                placeholder="Write your thoughts, ideas, or reflections..."
                value={dailyPlan?.notes || ''}
                onChange={(e) => {
                  if (dailyPlan) {
                    const updated = { ...dailyPlan, notes: e.target.value };
                    setDailyPlan(updated);
                    saveToStorage(`daily_plan_${selectedDate.toISOString().split('T')[0]}`, updated);
                  }
                }}
                className="w-full h-32 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-nexus-accent resize-none"
              />
            </div>

            {/* Day Rating */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <h3 className="text-sm font-semibold text-white">Rate Your Day</h3>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => {
                      if (dailyPlan) {
                        const updated = { ...dailyPlan, rating: star };
                        setDailyPlan(updated);
                        saveToStorage(`daily_plan_${selectedDate.toISOString().split('T')[0]}`, updated);
                      }
                    }}
                    className={`p-1 transition-colors ${
                      (dailyPlan?.rating || 0) >= star ? 'text-yellow-500' : 'text-slate-600 hover:text-yellow-500'
                    }`}
                  >
                    <Star className="w-8 h-8 fill-current" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyPlanner;
