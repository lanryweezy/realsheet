import React, { useState, useEffect, useMemo } from 'react';
import {
    Bell, BellOff, Check, CheckCircle, Clock, AlertCircle,
    Calendar, Target, TrendingUp, Zap, Settings, Trash2,
    ChevronRight, X, Filter, PauseCircle, Activity, Layout,
    Sparkles, CheckSquare, ListTodo, MoreHorizontal, ShieldCheck
} from 'lucide-react';
import {
    Notification, NotificationAction, Task, Goal, Habit,
    createNotification, analyzeSheetForNotifications,
    loadFromStorage, saveToStorage, STORAGE_KEYS
} from '../types/productivity';
import { SheetData } from '../types';

interface NexusActionCenterProps {
    isOpen: boolean;
    onClose: () => void;
    sheetData?: SheetData | null;
    onNavigate?: (type: string, id: string) => void;
}

export const NexusActionCenter: React.FC<NexusActionCenterProps> = ({
    isOpen,
    onClose,
    sheetData,
    onNavigate
}) => {
    const [activeTab, setActiveTab] = useState<'notifications' | 'tasks' | 'insights'>('notifications');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    // Load data from storage
    useEffect(() => {
        const storedNotifs = loadFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS);
        if (storedNotifs) {
            setNotifications(storedNotifs.map(n => ({
                ...n,
                createdAt: new Date(n.createdAt),
                scheduledAt: n.scheduledAt ? new Date(n.scheduledAt) : undefined,
            })));
        }

        const storedTasks = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS);
        if (storedTasks) {
            setTasks(storedTasks.map(t => ({
                ...t,
                createdAt: new Date(t.createdAt),
                dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
            })));
        }
    }, []);

    // Smart analysis for notifications
    useEffect(() => {
        if (sheetData) {
            const suggestions = analyzeSheetForNotifications(sheetData);
            const newNotifs = suggestions.map(s => createNotification(
                s.type === 'insight' ? 'insight' : 'task',
                s.priority,
                s.title,
                s.message,
                s.data
            ));

            if (newNotifs.length > 0) {
                setNotifications(prev => {
                    const updated = [...newNotifs, ...prev]; // Latest first
                    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
                    return updated;
                });
            }
        }
    }, [sheetData]);

    const unreadCount = notifications.filter(n => !n.isRead).length;
    const pendingTasksCount = tasks.filter(t => t.status !== 'done').length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/40 backdrop-blur-sm transition-all animate-in fade-in" onClick={onClose}>
            <div
                className="w-full max-w-lg h-full bg-slate-900/80 backdrop-blur-2xl border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col animate-in slide-in-from-right duration-500"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Hub Header */}
                <div className="px-6 py-8 border-b border-white/5 bg-gradient-to-br from-slate-800/50 to-transparent">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                                <Activity className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white tracking-tight">Nexus Action Center</h2>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">
                                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> System Secure</span>
                                    <span className="opacity-30">|</span>
                                    <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-all hover:rotate-90"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                            <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">Unread</div>
                            <div className="text-2xl font-bold text-cyan-400">{unreadCount}</div>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                            <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">Active Tasks</div>
                            <div className="text-2xl font-bold text-purple-400">{pendingTasksCount}</div>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                            <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">Health</div>
                            <div className="text-2xl font-bold text-emerald-400">98%</div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center px-4 pt-4 border-b border-white/5">
                    {[
                        { id: 'notifications', label: 'Alerts', icon: Bell, count: unreadCount },
                        { id: 'tasks', label: 'Tasks', icon: CheckSquare, count: pendingTasksCount },
                        { id: 'insights', label: 'AI Intelligence', icon: Sparkles, count: 0 }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium border-b-2 transition-all
                ${activeTab === tab.id
                                    ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5'
                                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                }
              `}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-6">
                    {activeTab === 'notifications' && (
                        <div className="space-y-4">
                            {notifications.length > 0 ? (
                                notifications.map(notif => (
                                    <div
                                        key={notif.id}
                                        className={`p-4 rounded-2xl border transition-all ${notif.isRead ? 'bg-white/2 border-white/5' : 'bg-white/5 border-cyan-500/30 shadow-[0_4px_20px_rgba(34,211,238,0.1)]'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 p-2 rounded-lg ${notif.priority === 'urgent' ? 'bg-red-500/20 text-red-500' : 'bg-slate-700/50 text-slate-400'}`}>
                                                {notif.type === 'insight' ? <TrendingUp className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-[10px] font-mono uppercase tracking-widest ${notif.priority === 'urgent' ? 'text-red-400' : 'text-slate-500'}`}>
                                                        {notif.priority} alert
                                                    </span>
                                                    <span className="text-[10px] text-slate-600">
                                                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-semibold text-white mb-1">{notif.title}</h4>
                                                <p className="text-xs text-slate-400 leading-relaxed mb-3">{notif.message}</p>

                                                <div className="flex items-center gap-2">
                                                    <button className="px-3 py-1.5 rounded-lg bg-cyan-400/10 text-cyan-400 text-[10px] font-bold hover:bg-cyan-400/20 transition-all">
                                                        Action
                                                    </button>
                                                    <button className="px-3 py-1.5 rounded-lg bg-white/5 text-slate-400 text-[10px] font-bold hover:bg-white/10 transition-all">
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState icon={BellOff} message="Atmosphere is calm. No active alerts." />
                            )}
                        </div>
                    )}

                    {activeTab === 'tasks' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <ListTodo className="w-4 h-4 text-purple-400" /> Active Tasks
                                </h3>
                                <button className="text-[10px] text-cyan-400 font-bold hover:underline">View All</button>
                            </div>
                            {tasks.length > 0 ? (
                                tasks.map(task => (
                                    <div key={task.id} className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-5 h-5 rounded-md border-2 border-slate-700 flex items-center justify-center group-hover:border-cyan-400 transition-colors cursor-pointer">
                                                {task.status === 'done' && <Check className="w-3 h-3 text-cyan-400" />}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-slate-200">{task.title}</h4>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    {task.dueDate && (
                                                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(task.dueDate).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 text-[10px] text-slate-500 capitalize">
                                                        <span className={`w-1.5 h-1.5 rounded-full ${task.priority === 'urgent' ? 'bg-red-500' : 'bg-slate-500'}`} />
                                                        {task.priority}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="p-1.5 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all text-slate-500">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState icon={CheckCircle} message="Mission accomplished. All tasks cleared." />
                            )}
                        </div>
                    )}

                    {activeTab === 'insights' && (
                        <div className="space-y-6">
                            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-transparent border border-indigo-500/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all duration-1000" />
                                <Sparkles className="w-8 h-8 text-indigo-400 mb-4 animate-pulse" />
                                <h3 className="text-lg font-bold text-white mb-2">Nexus Intelligence</h3>
                                <p className="text-sm text-slate-300 leading-relaxed italic">
                                    "Based on your current workspace patterns, I suggest organizing your 'Sales Data' sheet with pivot tables for 15% better insight visibility."
                                </p>
                                <button className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-all border border-white/10 border-dashed">
                                    Initialize Scan
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Predicted Bottlenecks</h4>
                                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-800/40 border border-white/5">
                                    <div className="w-12 h-12 flex-shrink-0 rounded-full border-4 border-slate-700 border-t-amber-400 flex items-center justify-center text-[10px] font-bold">
                                        84%
                                    </div>
                                    <div>
                                        <h5 className="text-sm font-semibold text-slate-200">Data Redundancy Risk</h5>
                                        <p className="text-xs text-slate-400 mt-0.5">Duplicate entries detected in Col C.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Center Footer */}
                <div className="p-6 bg-slate-950/20 border-t border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Nexus Core Online</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1"><Layout className="w-3 h-3" /> v3.4.0</span>
                            <span className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors"><Settings className="w-3 h-3" /> Dashboard</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EmptyState = ({ icon: Icon, message }: { icon: any, message: string }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-700">
        <div className="w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center mb-4 text-slate-600 border border-white/5">
            <Icon className="w-8 h-8" />
        </div>
        <p className="text-sm font-medium text-slate-400 max-w-[200px] leading-relaxed">
            {message}
        </p>
    </div>
);
