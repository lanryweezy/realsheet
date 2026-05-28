import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Activity, Clock, Calendar, Target,
  Award, Zap, PieChart, ArrowUp, ArrowDown, Users, CheckCircle,
  Star, Trophy, Flame, Heart, Brain, Lightbulb, Download,
  RefreshCw, ChevronDown, Filter, X
} from 'lucide-react';
import { Task, Goal, Habit, Notification, loadFromStorage, STORAGE_KEYS } from '../types/productivity';
import { AIAgent, AgentTask } from '../types/aiAgents';

interface AnalyticsDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ProductivityMetrics {
  tasksCompleted: number;
  tasksPending: number;
  completionRate: number;
  avgTaskDuration: number;
  peakProductivityHour: number;
  streakDays: number;
  goalsCompleted: number;
  habitsActive: number;
  agentTasksCompleted: number;
  communicationsCount: number;
}

interface TimeUsage {
  date: string;
  productive: number;
  neutral: number;
  distracting: number;
}

interface DailyStats {
  date: string;
  tasksCompleted: number;
  habitsCompleted: number;
  rating: number;
  focusHours: number;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'time' | 'goals' | 'agents'>('overview');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [metrics, setMetrics] = useState<ProductivityMetrics>({
    tasksCompleted: 0,
    tasksPending: 0,
    completionRate: 0,
    avgTaskDuration: 0,
    peakProductivityHour: 9,
    streakDays: 0,
    goalsCompleted: 0,
    habitsActive: 0,
    agentTasksCompleted: 0,
    communicationsCount: 0
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [timeUsage, setTimeUsage] = useState<TimeUsage[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  // Load and calculate metrics
  useEffect(() => {
    calculateMetrics();
    generateInsights();
  }, [timeRange]);

  const calculateMetrics = () => {
    // Load tasks
    const tasks = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS) || [];
    const completedTasks = tasks.filter(t => t.status === 'done');
    
    // Load habits
    const habits = loadFromStorage<Habit[]>(STORAGE_KEYS.HABITS) || [];
    const activeHabits = habits.filter(h => h.isActive);
    
    // Load goals
    const goals = loadFromStorage<Goal[]>(STORAGE_KEYS.GOALS) || [];
    const completedGoals = goals.filter(g => g.status === 'completed');
    
    // Load agents
    const agents = loadFromStorage<AIAgent[]>('ai_agents') || [];
    const agentTasksCompleted = agents.reduce((sum, agent) => sum + agent.completedTasks, 0);
    
    // Calculate daily stats
    const stats: DailyStats[] = [];
    const today = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Simulate data (in real app, would load from storage)
      stats.push({
        date: dateStr,
        tasksCompleted: Math.floor(Math.random() * 10),
        habitsCompleted: Math.floor(Math.random() * 5),
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        focusHours: Math.floor(Math.random() * 4) + 4 // 4-8 hours
      });
    }
    
    setDailyStats(stats);
    
    // Calculate time usage
    const usage: TimeUsage[] = stats.map(day => ({
      date: day.date,
      productive: day.focusHours * 60,
      neutral: 120,
      distracting: 30
    }));
    
    setTimeUsage(usage);
    
    // Update metrics
    setMetrics({
      tasksCompleted: completedTasks.length,
      tasksPending: tasks.filter(t => t.status !== 'done').length,
      completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      avgTaskDuration: 45, // minutes
      peakProductivityHour: 10,
      streakDays: activeHabits.reduce((max, h) => Math.max(max, h.streak), 0),
      goalsCompleted: completedGoals.length,
      habitsActive: activeHabits.length,
      agentTasksCompleted,
      communicationsCount: 0
    });
  };

  const generateInsights = () => {
    const newInsights = [
      '🎯 Your task completion rate is above average! Keep it up.',
      '⏰ Your most productive hours are 9-11 AM. Schedule important tasks then.',
      '🔥 You have a {streak}-day habit streak! Amazing consistency.',
      '📈 Task completion is up 15% compared to last week.',
      '🤖 AI agents completed {agentTasks} tasks for you, saving ~{hours} hours.',
      '💡 Consider taking breaks every 90 minutes for optimal focus.',
      '✅ Morning routines correlate with higher daily ratings.',
      '📊 You complete 23% more tasks on days with planned breaks.'
    ];
    
    setInsights(newInsights);
  };

  const maxDailyTasks = Math.max(...dailyStats.map(d => d.tasksCompleted), 1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-7xl h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-green-900/30 to-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <BarChart3 className="w-8 h-8 text-green-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
              <p className="text-xs text-slate-400">Track your productivity & insights</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            
            <button
              onClick={calculateMetrics}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-700 bg-slate-800/50">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'tasks', label: 'Tasks', icon: CheckCircle },
            { id: 'time', label: 'Time', icon: Clock },
            { id: 'goals', label: 'Goals', icon: Target },
            { id: 'agents', label: 'AI Agents', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-green-500 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  icon={CheckCircle}
                  label="Tasks Completed"
                  value={metrics.tasksCompleted}
                  trend={12}
                  color="green"
                />
                <MetricCard
                  icon={Flame}
                  label="Day Streak"
                  value={metrics.streakDays}
                  trend={5}
                  color="orange"
                />
                <MetricCard
                  icon={Target}
                  label="Goals Completed"
                  value={metrics.goalsCompleted}
                  trend={8}
                  color="blue"
                />
                <MetricCard
                  icon={Zap}
                  label="AI Tasks"
                  value={metrics.agentTasksCompleted}
                  trend={25}
                  color="purple"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Activity Chart */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Daily Activity</h3>
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="h-48 flex items-end gap-2">
                    {dailyStats.map((day, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all hover:from-green-400 hover:to-green-300"
                          style={{ 
                            height: `${(day.tasksCompleted / maxDailyTasks) * 100}%`,
                            minHeight: day.tasksCompleted > 0 ? '8px' : '0'
                          }}
                        />
                        <span className="text-[10px] text-slate-500">
                          {new Date(day.date).toLocaleDateString('en-US', { weekday: 'narrow' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Usage Chart */}
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Time Usage</h3>
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="space-y-3">
                    <TimeBar label="Productive" value={65} color="green" />
                    <TimeBar label="Meetings" value={20} color="blue" />
                    <TimeBar label="Breaks" value={10} color="yellow" />
                    <TimeBar label="Distracted" value={5} color="red" />
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-sm font-semibold text-white">AI-Powered Insights</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <Brain className="w-4 h-4 text-nexus-accent flex-shrink-0 mt-0.5" />
                      <span>{insight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Achievements */}
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Recent Achievements</h3>
                  <Trophy className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <AchievementBadge 
                    icon={Flame}
                    label="7-Day Streak"
                    earned={metrics.streakDays >= 7}
                    color="orange"
                  />
                  <AchievementBadge 
                    icon={CheckCircle}
                    label="100 Tasks"
                    earned={metrics.tasksCompleted >= 100}
                    color="green"
                  />
                  <AchievementBadge 
                    icon={Target}
                    label="Goal Crusher"
                    earned={metrics.goalsCompleted >= 5}
                    color="blue"
                  />
                  <AchievementBadge 
                    icon={Zap}
                    label="AI Master"
                    earned={metrics.agentTasksCompleted >= 50}
                    color="purple"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  icon={CheckCircle}
                  label="Completed"
                  value={metrics.tasksCompleted}
                  trend={15}
                  color="green"
                />
                <MetricCard
                  icon={Clock}
                  label="In Progress"
                  value={Math.floor(metrics.tasksPending / 2)}
                  trend={-5}
                  color="blue"
                />
                <MetricCard
                  icon={Target}
                  label="Completion Rate"
                  value={`${metrics.completionRate}%`}
                  trend={8}
                  color="purple"
                />
              </div>

              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-white mb-4">Task Completion Trend</h3>
                <div className="h-64 flex items-end gap-3">
                  {dailyStats.map((day, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-400 hover:to-blue-300"
                        style={{ 
                          height: `${(day.tasksCompleted / maxDailyTasks) * 100}%`,
                          minHeight: day.tasksCompleted > 0 ? '8px' : '0'
                        }}
                      />
                      <span className="text-[10px] text-slate-500">
                        {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Time Tab */}
          {activeTab === 'time' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Peak Hours</h3>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">
                    {metrics.peakProductivityHour}:00 - {metrics.peakProductivityHour + 2}:00
                  </div>
                  <p className="text-sm text-slate-400">Your most productive time of day</p>
                </div>

                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-sm font-semibold text-white">Avg Daily Focus</h3>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">
                    {dailyStats.reduce((sum, d) => sum + d.focusHours, 0) / dailyStats.length}h
                  </div>
                  <p className="text-sm text-slate-400">Hours of deep work per day</p>
                </div>
              </div>
            </div>
          )}

          {/* Goals Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  icon={Target}
                  label="Goals Completed"
                  value={metrics.goalsCompleted}
                  trend={20}
                  color="green"
                />
                <MetricCard
                  icon={Star}
                  label="Active Goals"
                  value={Math.floor(Math.random() * 5) + 3}
                  trend={10}
                  color="blue"
                />
                <MetricCard
                  icon={Trophy}
                  label="Success Rate"
                  value="78%"
                  trend={12}
                  color="purple"
                />
              </div>
            </div>
          )}

          {/* Agents Tab */}
          {activeTab === 'agents' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricCard
                  icon={Zap}
                  label="AI Tasks Done"
                  value={metrics.agentTasksCompleted}
                  trend={35}
                  color="purple"
                />
                <MetricCard
                  icon={Clock}
                  label="Hours Saved"
                  value={Math.floor(metrics.agentTasksCompleted * 0.5)}
                  trend={25}
                  color="green"
                />
                <MetricCard
                  icon={Brain}
                  label="Agent Efficiency"
                  value="94%"
                  trend={5}
                  color="blue"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  trend: number;
  color: 'green' | 'blue' | 'purple' | 'orange' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ icon: Icon, label, value, trend, color }) => {
  const colorClasses = {
    green: 'bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    orange: 'bg-orange-500/20 text-orange-400',
    red: 'bg-red-500/20 text-red-400'
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${
          trend > 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {trend > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
};

// Time Bar Component
const TimeBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
  const colorClasses: Record<string, string> = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClasses[color]} transition-all`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
};

// Achievement Badge Component
interface AchievementBadgeProps {
  icon: React.ElementType;
  label: string;
  earned: boolean;
  color: string;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({ icon: Icon, label, earned, color }) => {
  const colorClasses: Record<string, string> = {
    green: 'from-green-500 to-green-400',
    blue: 'from-blue-500 to-blue-400',
    purple: 'from-purple-500 to-purple-400',
    orange: 'from-orange-500 to-orange-400'
  };

  return (
    <div className={`relative p-4 rounded-xl border ${
      earned 
        ? `bg-gradient-to-br ${colorClasses[color]} border-transparent` 
        : 'bg-slate-700/50 border-slate-600 opacity-50'
    }`}>
      <Icon className={`w-8 h-8 mx-auto mb-2 ${earned ? 'text-white' : 'text-slate-500'}`} />
      <p className={`text-xs font-medium text-center ${earned ? 'text-white' : 'text-slate-500'}`}>
        {label}
      </p>
      {earned && (
        <div className="absolute top-2 right-2">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
