import React, { useState, useEffect } from 'react';
import { 
  Bot, Play, Pause, Settings, MessageSquare, Zap, 
  TrendingUp, CheckCircle, Clock, AlertCircle, X,
  Brain, Cpu, Network, Activity, Send, Sparkles,
  ChevronRight, Plus, Trash2, RefreshCw
} from 'lucide-react';
import { 
  AIAgent, AgentTask, AgentMessage, AgentNetwork,
  PREDEFINED_AGENTS, createAgent, createAgentTask,
  AgentWorkflow, PREDEFINED_WORKFLOWS
} from '../types/aiAgents';
import { loadFromStorage, saveToStorage } from '../types/productivity';

interface AIAgentNetworkProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIAgentNetwork: React.FC<AIAgentNetworkProps> = ({
  isOpen,
  onClose
}) => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [activeTab, setActiveTab] = useState<'agents' | 'tasks' | 'workflows' | 'messages'>('agents');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [workflows, setWorkflows] = useState<AgentWorkflow[]>([]);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Load agents from storage or use predefined
  useEffect(() => {
    const storedAgents = loadFromStorage<AIAgent[]>('ai_agents');
    if (storedAgents && storedAgents.length > 0) {
      setAgents(storedAgents);
    } else {
      // Initialize with predefined agents
      const initializedAgents = PREDEFINED_AGENTS.map(agent => ({
        ...agent,
        id: `agent_${agent.type}_${Date.now()}`,
        createdAt: new Date()
      }));
      setAgents(initializedAgents);
      saveToStorage('ai_agents', initializedAgents);
    }

    const storedWorkflows = loadFromStorage<AgentWorkflow[]>('ai_workflows');
    if (storedWorkflows && storedWorkflows.length > 0) {
      setWorkflows(storedWorkflows);
    } else {
      setWorkflows(PREDEFINED_WORKFLOWS);
      saveToStorage('ai_workflows', PREDEFINED_WORKFLOWS);
    }
  }, []);

  // Save agents to storage
  useEffect(() => {
    if (agents.length > 0) {
      saveToStorage('ai_agents', agents);
    }
  }, [agents]);

  const toggleAgent = (agentId: string) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, isActive: !agent.isActive } : agent
    ));
  };

  const createTaskForAgent = (agentId: string, title: string, description: string) => {
    const task: AgentTask = {
      id: `task_${Date.now()}`,
      agentId,
      type: 'custom',
      title,
      description,
      status: 'pending',
      priority: 'medium',
      input: {},
      progress: 0,
      steps: [],
      createdAt: new Date()
    };

    setAgentTasks(prev => [...prev, task]);
    
    // Update agent status
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { 
        ...agent, 
        status: 'working',
        currentTask: task
      } : agent
    ));

    setNewTaskTitle('');
    setIsCreatingTask(false);

    // Simulate task completion
    setTimeout(() => {
      completeTask(task.id, agentId);
    }, 3000 + Math.random() * 5000);
  };

  const completeTask = (taskId: string, agentId: string) => {
    setAgentTasks(prev => prev.map(task => 
      task.id === taskId ? { 
        ...task, 
        status: 'completed',
        progress: 100,
        completedAt: new Date()
      } : task
    ));

    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { 
        ...agent, 
        status: 'idle',
        currentTask: undefined,
        completedTasks: agent.completedTasks + 1
      } : agent
    ));

    // Create success message
    const message: AgentMessage = {
      id: `msg_${Date.now()}`,
      agentId,
      type: 'success',
      title: 'Task Completed',
      content: `Successfully completed: ${taskId}`,
      timestamp: new Date(),
      isRead: false,
      requiresResponse: false
    };
    setMessages(prev => [...prev, message]);
  };

  const getAgentIcon = (type: string) => {
    const agent = agents.find(a => a.id === type);
    return agent?.icon || '🤖';
  };

  const getAgentColor = (type: string) => {
    const agent = agents.find(a => a.id === type);
    return agent?.color || '#6B7280';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-slate-500';
      case 'working': return 'bg-green-500 animate-pulse';
      case 'waiting': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-blue-500';
      default: return 'text-slate-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-7xl h-[85vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-purple-900/30 to-nexus-accent/30">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-nexus-accent/20 rounded-xl">
              <Bot className="w-8 h-8 text-nexus-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Agent Network</h2>
              <p className="text-xs text-slate-400">
                {agents.filter(a => a.isActive).length}/{agents.length} agents active • {agentTasks.filter(t => t.status === 'in_progress').length} tasks running
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-700 bg-slate-800/50">
          {[
            { id: 'agents', label: 'Agents', icon: Bot },
            { id: 'tasks', label: 'Tasks', icon: CheckCircle },
            { id: 'workflows', label: 'Workflows', icon: Network },
            { id: 'messages', label: 'Messages', icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-nexus-accent text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'tasks' && agentTasks.filter(t => t.status === 'in_progress').length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                  {agentTasks.filter(t => t.status === 'in_progress').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex h-full">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'agents' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map(agent => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    isSelected={selectedAgent?.id === agent.id}
                    onSelect={() => setSelectedAgent(agent)}
                    onToggle={() => toggleAgent(agent.id)}
                    onCreateTask={() => {
                      setSelectedAgent(agent);
                      setIsCreatingTask(true);
                    }}
                    getStatusColor={getStatusColor}
                    getAgentIcon={getAgentIcon}
                  />
                ))}
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Active Tasks</h3>
                  <button
                    onClick={() => setIsCreatingTask(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Task
                  </button>
                </div>
                
                {agentTasks.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No tasks yet. Create a task for an agent!</p>
                  </div>
                ) : (
                  agentTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      agent={agents.find(a => a.id === task.agentId)}
                      getPriorityColor={getPriorityColor}
                      getStatusColor={getStatusColor}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'workflows' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Automated Workflows</h3>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors">
                    <Plus className="w-4 h-4" />
                    New Workflow
                  </button>
                </div>
                
                {workflows.map(workflow => (
                  <WorkflowCard
                    key={workflow.id}
                    workflow={workflow}
                    agents={agents}
                    getAgentIcon={getAgentIcon}
                  />
                ))}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Agent Messages</h3>
                  <button
                    onClick={() => setMessages([])}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Clear All
                  </button>
                </div>
                
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map(message => (
                    <MessageCard
                      key={message.id}
                      message={message}
                      agent={agents.find(a => a.id === message.agentId)}
                    />
                  ))
                )}
              </div>
            )}
          </div>

          {/* Agent Detail Sidebar */}
          {selectedAgent && activeTab === 'agents' && (
            <div className="w-96 border-l border-slate-700 p-4 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">{selectedAgent.name}</h3>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedAgent.icon}</span>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedAgent.status)}`} />
                </div>

                <p className="text-sm text-slate-400">{selectedAgent.description}</p>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{selectedAgent.completedTasks} completed</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span>{selectedAgent.successRate}% success</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Capabilities</h4>
                  <div className="space-y-1">
                    {selectedAgent.capabilities.map((cap, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <Sparkles className="w-3 h-3 text-nexus-accent" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Actions</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleAgent(selectedAgent.id)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedAgent.isActive
                          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {selectedAgent.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {selectedAgent.isActive ? 'Pause Agent' : 'Activate Agent'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedAgent(selectedAgent);
                        setIsCreatingTask(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create Task
                    </button>
                    
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors">
                      <Settings className="w-4 h-4" />
                      Configure
                    </button>
                  </div>
                </div>

                {isCreatingTask && (
                  <div className="pt-4 border-t border-slate-700">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Task</h4>
                    <input
                      type="text"
                      placeholder="Task title..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-nexus-accent mb-2"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => createTaskForAgent(selectedAgent.id, newTaskTitle, 'Custom task')}
                        className="flex-1 px-3 py-2 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setIsCreatingTask(false);
                          setNewTaskTitle('');
                        }}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Agent Card Component
interface AgentCardProps {
  agent: AIAgent;
  isSelected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onCreateTask: () => void;
  getStatusColor: (status: string) => string;
  getAgentIcon: (type: string) => string;
}

const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isSelected,
  onSelect,
  onToggle,
  onCreateTask,
  getStatusColor,
  getAgentIcon
}) => (
  <div
    onClick={onSelect}
    className={`p-4 rounded-xl border transition-all cursor-pointer ${
      isSelected
        ? 'bg-slate-800 border-nexus-accent ring-2 ring-nexus-accent/50'
        : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
    }`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{agent.icon}</span>
        <div>
          <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
            <span className="text-xs text-slate-400 capitalize">{agent.status}</span>
          </div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`p-2 rounded-lg transition-colors ${
          agent.isActive
            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
        }`}
      >
        {agent.isActive ? <Activity className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
      </button>
    </div>

    <p className="text-xs text-slate-400 mb-3">{agent.description}</p>

    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-3 text-slate-400">
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          {agent.completedTasks}
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-blue-500" />
          {agent.successRate}%
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onCreateTask();
        }}
        className="px-3 py-1.5 bg-nexus-accent hover:bg-cyan-600 text-white rounded text-xs font-medium transition-colors"
      >
        Assign Task
      </button>
    </div>
  </div>
);

// Task Card Component
interface TaskCardProps {
  task: AgentTask;
  agent?: AIAgent;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  agent,
  getPriorityColor,
  getStatusColor
}) => (
  <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-3 flex-1">
        {agent && <span className="text-xl">{agent.icon}</span>}
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white">{task.title}</h4>
          <p className="text-xs text-slate-400">{task.description}</p>
        </div>
      </div>
      <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)} bg-slate-900`}>
        {task.priority}
      </div>
    </div>

    <div className="flex items-center justify-between mt-3">
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`} />
          {task.status}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {task.progress}%
        </span>
      </div>
      {task.progress < 100 && (
        <button className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      )}
    </div>

    <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
      <div 
        className="h-full bg-nexus-accent transition-all"
        style={{ width: `${task.progress}%` }}
      />
    </div>
  </div>
);

// Workflow Card Component
interface WorkflowCardProps {
  workflow: AgentWorkflow;
  agents: AIAgent[];
  getAgentIcon: (type: string) => string;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  agents,
  getAgentIcon
}) => (
  <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
    <div className="flex items-start justify-between mb-3">
      <div>
        <h4 className="text-sm font-semibold text-white">{workflow.name}</h4>
        <p className="text-xs text-slate-400">{workflow.description}</p>
      </div>
      <div className={`px-2 py-1 rounded text-xs font-medium ${
        workflow.isActive ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
      }`}>
        {workflow.isActive ? 'Active' : 'Inactive'}
      </div>
    </div>

    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
      <Clock className="w-3 h-3" />
      <span>Trigger: {workflow.trigger.type}</span>
      {workflow.trigger.schedule && (
        <span className="px-2 py-0.5 bg-slate-700 rounded">{workflow.trigger.schedule}</span>
      )}
    </div>

    <div className="flex items-center gap-2">
      {workflow.steps.map((step, idx) => {
        const agent = agents.find(a => a.id === step.agentId);
        return (
          <React.Fragment key={step.id}>
            {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-600" />}
            <div className="flex items-center gap-1 px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
              <span>{agent?.icon || '🤖'}</span>
              <span className="truncate max-w-[100px]">{step.action}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

// Message Card Component
interface MessageCardProps {
  message: AgentMessage;
  agent?: AIAgent;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, agent }) => (
  <div className={`p-4 rounded-lg border ${
    message.type === 'success' ? 'bg-green-900/20 border-green-500/30' :
    message.type === 'alert' ? 'bg-red-900/20 border-red-500/30' :
    'bg-slate-800 border-slate-700'
  }`}>
    <div className="flex items-start gap-3">
      {agent && <span className="text-2xl">{agent.icon}</span>}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold text-white">{message.title}</h4>
          <span className="text-xs text-slate-500">{message.timestamp.toLocaleString()}</span>
        </div>
        <p className="text-sm text-slate-300">{message.content}</p>
        {message.requiresResponse && (
          <div className="flex items-center gap-2 mt-2">
            <button className="px-3 py-1.5 bg-nexus-accent hover:bg-cyan-600 text-white rounded text-xs font-medium transition-colors">
              Respond
            </button>
            <button className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-xs font-medium transition-colors">
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

export default AIAgentNetwork;
