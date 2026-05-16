import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, BellOff, Check, CheckCircle, Clock, AlertCircle, 
  Calendar, Target, TrendingUp, Zap, Settings, Trash2, 
  ChevronRight, X, Filter, PauseCircle
} from 'lucide-react';
import { 
  Notification, NotificationAction, Task, Goal, Habit,
  createNotification, analyzeSheetForNotifications,
  loadFromStorage, saveToStorage, STORAGE_KEYS
} from '../types/productivity';
import { SheetData } from '../types';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  sheetData?: SheetData | null;
  onNavigate?: (type: string, id: string) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  sheetData,
  onNavigate
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'action_required'>('all');
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  // Load notifications from storage
  useEffect(() => {
    const stored = loadFromStorage<Notification[]>(STORAGE_KEYS.NOTIFICATIONS);
    if (stored) {
      setNotifications(stored.map(n => ({
        ...n,
        scheduledAt: n.scheduledAt ? new Date(n.scheduledAt) : undefined,
        expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
        createdAt: new Date(n.createdAt)
      })));
    }
  }, []);

  // Analyze sheet for smart notifications
  useEffect(() => {
    if (sheetData) {
      const suggestions = analyzeSheetForNotifications(sheetData);
      const newNotifications = suggestions.map(suggestion => 
        createNotification(
          suggestion.type === 'insight' ? 'insight' : 'task',
          suggestion.priority,
          suggestion.title,
          suggestion.message,
          suggestion.data
        )
      );
      
      if (newNotifications.length > 0) {
        setNotifications(prev => {
          const updated = [...prev, ...newNotifications];
          saveToStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
          return updated;
        });
      }
    }
  }, [sheetData]);

  // Save notifications to storage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filter === 'unread') return !n.isRead;
      if (filter === 'action_required') return !n.isActioned && n.actions && n.actions.length > 0;
      return true;
    });
  }, [notifications, filter]);

  // Group by priority
  const groupedNotifications = useMemo(() => {
    const groups = {
      urgent: filteredNotifications.filter(n => n.priority === 'urgent'),
      high: filteredNotifications.filter(n => n.priority === 'high'),
      medium: filteredNotifications.filter(n => n.priority === 'medium'),
      low: filteredNotifications.filter(n => n.priority === 'low'),
    };
    return groups;
  }, [filteredNotifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAsActioned = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isActioned: true } : n)
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const snoozeNotification = (id: string, hours: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? {
        ...n,
        scheduledAt: new Date(Date.now() + hours * 60 * 60 * 1000)
      } : n)
    );
  };

  const handleAction = (notification: Notification, action: NotificationAction) => {
    if (action.type === 'navigate' && onNavigate && notification.relatedData) {
      if (notification.relatedData.taskId) {
        onNavigate('task', notification.relatedData.taskId);
      } else if (notification.relatedData.cellReference) {
        onNavigate('cell', notification.relatedData.cellReference);
      }
    }
    
    if (action.type === 'dismiss') {
      dismissNotification(notification.id);
    }
    
    if (action.type === 'execute') {
      // Execute action payload
      console.log('Executing action:', action.payload);
      markAsActioned(notification.id);
    }

    markAsRead(notification.id);
  };

  const clearAllRead = () => {
    setNotifications(prev => prev.filter(n => !n.isRead));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Bell className="w-4 h-4 text-yellow-500" />;
      case 'low': return <Bell className="w-4 h-4 text-blue-500" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckCircle className="w-4 h-4" />;
      case 'reminder': return <Bell className="w-4 h-4" />;
      case 'deadline': return <Clock className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'goal': return <Target className="w-4 h-4" />;
      case 'insight': return <TrendingUp className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md h-full bg-slate-900 border-l border-slate-700 shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-nexus-accent/20 rounded-lg">
              <Bell className="w-5 h-5 text-nexus-accent" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Notifications</h2>
              <p className="text-xs text-slate-400">
                {notifications.filter(n => !n.isRead).length} unread
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearAllRead}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Clear all read"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-700">
          <div className="flex-1 flex items-center gap-1 bg-slate-800 rounded-lg p-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'action_required', label: 'Action' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  filter === tab.id
                    ? 'bg-nexus-accent text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {Object.entries(groupedNotifications).map(([priority, priorityNotifs]) => 
            priorityNotifs.length > 0 && (
              <div key={priority} className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <div className={`w-2 h-2 rounded-full ${getPriorityColor(priority)}`} />
                  {priority}
                  <span className="text-slate-600">({priorityNotifs.length})</span>
                </div>
                
                {priorityNotifs.map(notification => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    isSelected={selectedNotification === notification.id}
                    onSelect={() => setSelectedNotification(notification.id)}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onDismiss={() => dismissNotification(notification.id)}
                    onSnooze={(hours) => snoozeNotification(notification.id, hours)}
                    onAction={(action) => handleAction(notification, action)}
                    getPriorityIcon={getPriorityIcon}
                    getTypeIcon={getTypeIcon}
                  />
                ))}
              </div>
            )
          )}

          {notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <h3 className="text-sm font-semibold text-white mb-1">No notifications</h3>
              <p className="text-xs text-slate-400">You're all caught up!</p>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{notifications.length} total</span>
            <span>{notifications.filter(n => !n.isActioned && n.actions).length} need action</span>
            <span>{notifications.filter(n => !n.isRead).length} unread</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Card Component
interface NotificationCardProps {
  notification: Notification;
  isSelected: boolean;
  onSelect: () => void;
  onMarkAsRead: () => void;
  onDismiss: () => void;
  onSnooze: (hours: number) => void;
  onAction: (action: NotificationAction) => void;
  getPriorityIcon: (priority: string) => React.ReactNode;
  getTypeIcon: (type: string) => React.ReactNode;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  isSelected,
  onSelect,
  onMarkAsRead,
  onDismiss,
  onSnooze,
  onAction,
  getPriorityIcon,
  getTypeIcon
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <div
      className={`border rounded-lg p-3 transition-all ${
        notification.isRead ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-800 border-slate-600'
      } ${isSelected ? 'ring-2 ring-nexus-accent' : ''}`}
      onClick={() => {
        onSelect();
        if (!notification.isRead) onMarkAsRead();
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getPriorityIcon(notification.priority)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {getTypeIcon(notification.type)}
              <h3 className={`text-sm font-semibold ${
                notification.isRead ? 'text-slate-300' : 'text-white'
              }`}>
                {notification.title}
              </h3>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActions(!showActions);
                }}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              >
                <ChevronRight className={`w-3 h-3 transition-transform ${showActions ? 'rotate-90' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <p className="text-xs text-slate-400 mt-1">{notification.message}</p>
          
          {notification.scheduledAt && (
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
              <Clock className="w-3 h-3" />
              <span>Scheduled: {notification.scheduledAt.toLocaleString()}</span>
            </div>
          )}
          
          {/* Actions */}
          {showActions && notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 space-y-2 pt-3 border-t border-slate-700">
              {notification.actions.map(action => (
                <button
                  key={action.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction(action);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-white transition-colors"
                >
                  <span>{action.label}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              ))}
              
              {/* Snooze Options */}
              <div className="flex items-center gap-1 pt-2 border-t border-slate-700">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-xs text-slate-400">Snooze:</span>
                {[1, 2, 4, 8, 24].map(hours => (
                  <button
                    key={hours}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSnooze(hours);
                    }}
                    className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-colors"
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
