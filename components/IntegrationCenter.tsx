import React, { useState, useEffect } from 'react';
import { 
  Plug, Zap, Globe, Cloud, Database, Webhook, Server,
  RefreshCw, Check, X, Plus, Settings, Trash2, ExternalLink,
  Shield, Key, Lock, Activity, Clock, AlertCircle, Power
} from 'lucide-react';
import { loadFromStorage, saveToStorage } from '../types/productivity';

interface IntegrationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Integration {
  id: string;
  service: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'communication' | 'productivity' | 'storage' | 'analytics' | 'automation';
  isConnected: boolean;
  lastSyncAt?: Date;
  status: 'active' | 'error' | 'disconnected';
  config?: any;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered?: Date;
  successRate: number;
}

const IntegrationCenter: React.FC<IntegrationCenterProps> = ({
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'integrations' | 'webhooks' | 'api'>('integrations');
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Pre-defined integrations
  const availableIntegrations: Omit<Integration, 'id'>[] = [
    {
      service: 'google-calendar',
      name: 'Google Calendar',
      description: 'Sync meetings and events',
      icon: '📅',
      color: '#4285F4',
      category: 'productivity',
      isConnected: false,
      status: 'disconnected'
    },
    {
      service: 'google-drive',
      name: 'Google Drive',
      description: 'Store and sync files',
      icon: '📁',
      color: '#0F9D58',
      category: 'storage',
      isConnected: false,
      status: 'disconnected'
    },
    {
      service: 'slack',
      name: 'Slack',
      description: 'Team communication & notifications',
      icon: '💬',
      color: '#4A154B',
      category: 'communication',
      isConnected: false,
      status: 'disconnected'
    },
    {
      service: 'zapier',
      name: 'Zapier',
      description: 'Connect 5000+ apps',
      icon: '⚡',
      color: '#FF4F00',
      category: 'automation',
      isConnected: false,
      status: 'disconnected'
    },
    {
      service: 'twilio',
      name: 'Twilio',
      description: 'SMS & phone calls',
      icon: '📞',
      color: '#F22F46',
      category: 'communication',
      isConnected: false,
      status: 'disconnected'
    },
    {
      service: 'sendgrid',
      name: 'SendGrid',
      description: 'Email delivery',
      icon: '📧',
      color: '#0097E6',
      category: 'communication',
      isConnected: false,
      status: 'disconnected'
    },
    {
      service: 'notion',
      name: 'Notion',
      description: 'Notes & databases',
      icon: '📝',
      color: '#000000',
      category: 'productivity',
      isConnected: false,
      status: 'disconnected'
    },
    {
      service: 'salesforce',
      name: 'Salesforce',
      description: 'CRM integration',
      icon: '☁️',
      color: '#00A1E0',
      category: 'productivity',
      isConnected: false,
      status: 'disconnected'
    },
    {
      service: 'stripe',
      name: 'Stripe',
      description: 'Payment processing',
      icon: '💳',
      color: '#635BFF',
      category: 'analytics',
      isConnected: false,
      status: 'disconnected'
    },
    {
      service: 'github',
      name: 'GitHub',
      description: 'Code & issues tracking',
      icon: '🐙',
      color: '#181717',
      category: 'productivity',
      isConnected: false,
      status: 'disconnected'
    },
    {
      service: 'airtable',
      name: 'Airtable',
      description: 'Database sync',
      icon: '🗃️',
      color: '#FCB400',
      category: 'storage',
      isConnected: false,
      status: 'disconnected'
    },
    {
      service: 'discord',
      name: 'Discord',
      description: 'Community & notifications',
      icon: '🎮',
      color: '#5865F2',
      category: 'communication',
      isConnected: false,
      status: 'disconnected'
    }
  ];

  // Load integrations
  useEffect(() => {
    const stored = loadFromStorage<Integration[]>('integrations');
    if (stored && stored.length > 0) {
      setIntegrations(stored);
    } else {
      const initialized = availableIntegrations.map((i, idx) => ({
        ...i,
        id: `integration_${idx}`
      }));
      setIntegrations(initialized);
      saveToStorage('integrations', initialized);
    }

    const storedWebhooks = loadFromStorage<Webhook[]>('webhooks');
    if (storedWebhooks) {
      setWebhooks(storedWebhooks);
    }
  }, []);

  // Save integrations
  useEffect(() => {
    if (integrations.length > 0) {
      saveToStorage('integrations', integrations);
    }
  }, [integrations]);

  const connectIntegration = (integrationId: string) => {
    setIsConnecting(true);
    
    // Simulate OAuth flow
    setTimeout(() => {
      setIntegrations(prev => prev.map(int => 
        int.id === integrationId 
          ? { ...int, isConnected: true, status: 'active' as const, lastSyncAt: new Date() }
          : int
      ));
      setIsConnecting(false);
      setSelectedIntegration(null);
    }, 2000);
  };

  const disconnectIntegration = (integrationId: string) => {
    setIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { ...int, isConnected: false, status: 'disconnected' as const, lastSyncAt: undefined }
        : int
    ));
  };

  const syncIntegration = (integrationId: string) => {
    setIntegrations(prev => prev.map(int => 
      int.id === integrationId 
        ? { ...int, lastSyncAt: new Date() }
        : int
    ));
    
    // Simulate sync
    setTimeout(() => {
      setIntegrations(prev => prev.map(int => 
        int.id === integrationId && int.isConnected
          ? { ...int, status: 'active' as const }
          : int
      ));
    }, 1000);
  };

  const addWebhook = () => {
    const newWebhook: Webhook = {
      id: `webhook_${Date.now()}`,
      name: 'New Webhook',
      url: 'https://your-domain.com/webhook',
      events: ['task.created', 'task.completed'],
      isActive: true,
      successRate: 100
    };
    setWebhooks(prev => [...prev, newWebhook]);
    saveToStorage('webhooks', [...webhooks, newWebhook]);
  };

  const toggleWebhook = (webhookId: string) => {
    setWebhooks(prev => prev.map(w => 
      w.id === webhookId ? { ...w, isActive: !w.isActive } : w
    ));
  };

  const deleteWebhook = (webhookId: string) => {
    setWebhooks(prev => prev.filter(w => w.id !== webhookId));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication': return <Cloud className="w-4 h-4" />;
      case 'productivity': return <Activity className="w-4 h-4" />;
      case 'storage': return <Database className="w-4 h-4" />;
      case 'analytics': return <Zap className="w-4 h-4" />;
      case 'automation': return <RefreshCw className="w-4 h-4" />;
      default: return <Plug className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'communication': return 'text-blue-400 bg-blue-500/20';
      case 'productivity': return 'text-green-400 bg-green-500/20';
      case 'storage': return 'text-purple-400 bg-purple-500/20';
      case 'analytics': return 'text-yellow-400 bg-yellow-500/20';
      case 'automation': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-7xl h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-orange-900/30 to-red-900/30">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <Plug className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Integration Center</h2>
                <p className="text-xs text-slate-400">
                  {integrations.filter(i => i.isConnected).length} connected • {webhooks.length} webhooks
                </p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-orange-500"
              aria-label="Close Integration Center"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 p-3 border-b border-slate-700 bg-slate-800/50">
            {[
              { id: 'integrations', label: 'Integrations', icon: Plug },
              { id: 'webhooks', label: 'Webhooks', icon: Webhook },
              { id: 'api', label: 'API Keys', icon: Key }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations.map(integration => (
                  <div
                    key={integration.id}
                    onClick={() => setSelectedIntegration(integration)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedIntegration?.id === integration.id
                        ? 'bg-orange-900/20 border-orange-500'
                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{integration.icon}</span>
                        <div>
                          <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
                          <p className="text-xs text-slate-400">{integration.description}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        integration.isConnected
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {integration.isConnected ? 'Connected' : 'Disconnected'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${getCategoryColor(integration.category)}`}>
                        {getCategoryIcon(integration.category)}
                        <span className="capitalize">{integration.category}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {integration.isConnected ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                syncIntegration(integration.id);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-orange-500"
                              title="Sync"
                              aria-label={`Sync ${integration.name}`}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                disconnectIntegration(integration.id);
                              }}
                              className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-red-500"
                              title="Disconnect"
                              aria-label={`Disconnect ${integration.name}`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              connectIntegration(integration.id);
                            }}
                            className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs font-medium transition-colors"
                          >
                            Connect
                          </button>
                        )}
                      </div>
                    </div>

                    {integration.lastSyncAt && (
                      <div className="flex items-center gap-1 mt-3 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>Last sync: {integration.lastSyncAt.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Webhooks Tab */}
            {activeTab === 'webhooks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">
                    {webhooks.length} Webhooks
                  </h3>
                  <button
                    onClick={addWebhook}
                    className="flex items-center gap-2 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Webhook
                  </button>
                </div>

                {webhooks.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Webhook className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No webhooks configured</p>
                  </div>
                ) : (
                  webhooks.map(webhook => (
                    <div
                      key={webhook.id}
                      className="p-4 bg-slate-800 border border-slate-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold text-white">{webhook.name}</h4>
                          <p className="text-xs text-slate-400 font-mono mt-1">{webhook.url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-xs font-medium ${
                            webhook.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-slate-700 text-slate-400'
                          }`}>
                            {webhook.isActive ? 'Active' : 'Inactive'}
                          </div>
                          <button
                            onClick={() => toggleWebhook(webhook.id)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-orange-500"
                            aria-label={`${webhook.isActive ? 'Disable' : 'Enable'} webhook ${webhook.name}`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteWebhook(webhook.id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-red-500"
                            aria-label={`Delete webhook ${webhook.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          <span>{webhook.events.length} events</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Check className="w-3 h-3 text-green-500" />
                          <span>{webhook.successRate}% success</span>
                        </div>
                        {webhook.lastTriggered && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Last: {webhook.lastTriggered.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'api' && (
              <div className="space-y-4">
                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-green-400" />
                    <h3 className="text-sm font-semibold text-white">API Authentication</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                        API Key
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value="sk_live_xxxxxxxxxxxxxxxxxxxx"
                          readOnly
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-mono"
                        />
                        <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors">
                          Copy
                        </button>
                        <button className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
                          Regenerate
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Keep this key secret. Never share it or expose it in client-side code.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                        Webhook Secret
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="password"
                          value="whsec_xxxxxxxxxxxxxxxxxxxx"
                          readOnly
                          className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-mono"
                        />
                        <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors">
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-1">Security Best Practices</h4>
                      <ul className="text-xs text-slate-300 space-y-1">
                        <li>• Never commit API keys to version control</li>
                        <li>• Use environment variables for sensitive data</li>
                        <li>• Rotate keys regularly</li>
                        <li>• Use webhook signatures to verify requests</li>
                        <li>• Implement rate limiting</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <h3 className="text-sm font-semibold text-white mb-3">API Documentation</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                      <span className="text-slate-300">Base URL</span>
                      <code className="text-xs text-orange-400 font-mono">https://api.realsheet.com/v1</code>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                      <span className="text-slate-300">Rate Limit</span>
                      <code className="text-xs text-orange-400 font-mono">1000 requests/hour</code>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                      <span className="text-slate-300">Authentication</span>
                      <code className="text-xs text-orange-400 font-mono">Bearer Token</code>
                    </div>
                  </div>
                  <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors">
                    <ExternalLink className="w-4 h-4" />
                    View Full Documentation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Integration Detail Sidebar */}
        {selectedIntegration && (
          <div className="w-96 border-l border-slate-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{selectedIntegration.name}</h3>
              <button
                onClick={() => setSelectedIntegration(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-orange-500"
                aria-label="Close integration details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center mb-4">
              <span className="text-6xl">{selectedIntegration.icon}</span>
            </div>

            <p className="text-sm text-slate-400 mb-4">{selectedIntegration.description}</p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedIntegration.isConnected
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {selectedIntegration.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Category</span>
                <span className="text-white capitalize">{selectedIntegration.category}</span>
              </div>
              {selectedIntegration.lastSyncAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Last Sync</span>
                  <span className="text-white">{selectedIntegration.lastSyncAt.toLocaleString()}</span>
                </div>
              )}
            </div>

            {selectedIntegration.isConnected ? (
              <div className="space-y-2">
                <button
                  onClick={() => syncIntegration(selectedIntegration.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Sync Now
                </button>
                <button
                  onClick={() => disconnectIntegration(selectedIntegration.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Power className="w-4 h-4" />
                  Disconnect
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors">
                  <Settings className="w-4 h-4" />
                  Configure
                </button>
              </div>
            ) : (
              <button
                onClick={() => connectIntegration(selectedIntegration.id)}
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isConnecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Plug className="w-4 h-4" />
                )}
                {isConnecting ? 'Connecting...' : 'Connect'}
              </button>
            )}

            <div className="mt-6 pt-6 border-t border-slate-700">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Features</h4>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  Real-time sync
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  Bi-directional updates
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  Automatic conflict resolution
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  Encrypted data transfer
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IntegrationCenter;
