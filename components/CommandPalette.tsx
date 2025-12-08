import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Zap, ArrowRight, Table, BarChart3, DatabaseZap, FileDown, PaintBucket, Sparkles, X, LayoutGrid } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: {
    id: string;
    label: string;
    icon: React.ElementType;
    shortcut?: string;
    action: () => void;
  }[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, actions }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredActions = actions.filter(action => 
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredActions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredActions.length) % filteredActions.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm transition-all">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 bg-slate-800/30">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-500 text-lg"
          />
          <div className="flex items-center gap-1">
             <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-1 rounded">ESC</span>
          </div>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filteredActions.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              <p>No commands found.</p>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-1 block">Suggestions</span>
              {filteredActions.map((action, index) => (
                <button
                  key={action.id}
                  onClick={() => { action.action(); onClose(); }}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-colors ${
                    index === selectedIndex 
                      ? 'bg-nexus-accent/10 text-white' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center gap-3">
                    <action.icon className={`w-5 h-5 ${index === selectedIndex ? 'text-nexus-accent' : 'text-slate-500'}`} />
                    <span className="font-medium">{action.label}</span>
                  </div>
                  {action.shortcut && (
                    <span className="text-xs text-slate-600 font-mono bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800">
                      {action.shortcut}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 bg-slate-800/50 border-t border-slate-700/50 text-xs text-slate-500 flex justify-between">
           <span>NexSheet OS v2.4</span>
           <div className="flex gap-3">
              <span>Navigate <span className="text-slate-300">↑↓</span></span>
              <span>Select <span className="text-slate-300">↵</span></span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;