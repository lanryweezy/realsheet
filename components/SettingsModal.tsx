import React, { useState, useEffect } from 'react';
import { X, Moon, Sun, Monitor, Laptop, Type, Layout, Bell, Shield, User } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('appearance');
  const [accentColor, setAccentColor] = useState('#06b6d4');
  const [fontSize, setFontSize] = useState('medium');
  const [autoSave, setAutoSave] = useState(true);

  // Sync accent color with CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--nexus-accent', accentColor);
    // Darker shade for hover approximation
    // Simplified logic: usually you'd calculate this
    document.documentElement.style.setProperty('--nexus-accent-hover', accentColor); 
  }, [accentColor]);

  if (!isOpen) return null;

  const tabs = [
      { id: 'appearance', label: 'Appearance', icon: Layout },
      { id: 'editor', label: 'Editor', icon: Type },
      { id: 'account', label: 'Account', icon: User },
  ];

  const colors = [
      { hex: '#06b6d4', name: 'Cyan' },
      { hex: '#8b5cf6', name: 'Violet' },
      { hex: '#ec4899', name: 'Pink' },
      { hex: '#10b981', name: 'Emerald' },
      { hex: '#f59e0b', name: 'Amber' },
      { hex: '#3b82f6', name: 'Blue' },
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px] animate-in fade-in zoom-in duration-200">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-800/50 border-r border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6 px-2">Settings</h2>
            <div className="space-y-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-nexus-accent/10 text-nexus-accent' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col relative bg-slate-900">
            <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
            </button>

            <div className="flex-1 overflow-y-auto p-8">
                {activeTab === 'appearance' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">Theme</h3>
                            <p className="text-sm text-slate-400 mb-4">Customize the look and feel of the workspace.</p>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <button className="p-4 border border-nexus-accent bg-slate-800 rounded-xl flex flex-col items-center gap-2 transition-all">
                                    <Moon className="w-6 h-6 text-nexus-accent" />
                                    <span className="text-sm text-white">Dark</span>
                                </button>
                                <button className="p-4 border border-slate-700 bg-slate-800/50 rounded-xl flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                                    <Sun className="w-6 h-6 text-slate-400" />
                                    <span className="text-sm text-slate-400">Light (Soon)</span>
                                </button>
                                <button className="p-4 border border-slate-700 bg-slate-800/50 rounded-xl flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
                                    <Monitor className="w-6 h-6 text-slate-400" />
                                    <span className="text-sm text-slate-400">System</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Accent Color</h3>
                            <div className="flex gap-3">
                                {colors.map(c => (
                                    <button
                                        key={c.hex}
                                        onClick={() => setAccentColor(c.hex)}
                                        className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${accentColor === c.hex ? 'border-white ring-2 ring-white/20' : 'border-transparent'}`}
                                        style={{ backgroundColor: c.hex }}
                                        title={c.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'editor' && (
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Grid Preferences</h3>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div>
                                        <span className="block text-sm font-medium text-white">Auto-save changes</span>
                                        <span className="block text-xs text-slate-400 mt-1">Automatically save your workbook every few seconds.</span>
                                    </div>
                                    <div 
                                        className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative ${autoSave ? 'bg-nexus-accent' : 'bg-slate-600'}`}
                                        onClick={() => setAutoSave(!autoSave)}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${autoSave ? 'left-6' : 'left-1'}`} />
                                    </div>
                                </label>

                                <label className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                                    <div>
                                        <span className="block text-sm font-medium text-white">Smart Formulas</span>
                                        <span className="block text-xs text-slate-400 mt-1">Allow AI to suggest formulas as you type in the bar.</span>
                                    </div>
                                    <div className="w-11 h-6 bg-nexus-accent rounded-full relative"><div className="absolute top-1 left-6 w-4 h-4 bg-white rounded-full" /></div>
                                </label>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Typography</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {['Small', 'Medium', 'Large'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFontSize(s.toLowerCase())}
                                        className={`px-4 py-2 border rounded-lg text-sm transition-colors ${fontSize === s.toLowerCase() ? 'bg-nexus-accent/20 border-nexus-accent text-white' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'account' && (
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-nexus-accent to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                JD
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">John Doe</h3>
                                <p className="text-slate-400">john.doe@example.com</p>
                                <div className="mt-2 flex gap-2">
                                    <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">Free Plan</span>
                                    <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs border border-green-500/20">Verified</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Data & Privacy</h3>
                            <button className="w-full text-left px-4 py-3 bg-slate-800/30 border border-slate-700 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex justify-between items-center">
                                Export all my data
                                <Laptop className="w-4 h-4" />
                            </button>
                            <button className="w-full text-left px-4 py-3 bg-red-500/5 border border-red-500/20 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors flex justify-between items-center">
                                Delete Account
                                <Shield className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="p-6 border-t border-slate-800 flex justify-end">
                <button 
                    onClick={onClose}
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
                >
                    Done
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;