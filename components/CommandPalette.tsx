import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, FileSpreadsheet } from 'lucide-react';

export interface CommandAction {
  id: string;
  label: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
  fileActions?: CommandAction[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, actions, fileActions = [] }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredActions = actions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );
  const filteredFileActions = fileActions.filter((action) =>
    action.label.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = useMemo(() => [...filteredFileActions, ...filteredActions], [filteredFileActions, filteredActions]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = allItems[selectedIndex];
        if (item) {
          item.action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allItems, selectedIndex, onClose]);

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
            placeholder="Search commands or open files..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-500 text-lg"
          />
          <div className="flex items-center gap-1">
             <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-1 rounded">ESC</span>
          </div>
        </div>
        
        <div className="max-h-[320px] overflow-y-auto py-2">
          {allItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              <p>No commands or files found.</p>
            </div>
          ) : (
            <div className="space-y-1 px-2">
              {filteredFileActions.length > 0 && (
                <>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-1 block">Open file</span>
                  {filteredFileActions.map((action, index) => {
                    const globalIndex = index;
                    return (
                      <button
                        key={action.id}
                        onClick={() => { action.action(); onClose(); }}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-colors ${
                          globalIndex === selectedIndex ? 'bg-nexus-accent/10 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <div className="flex items-center gap-3">
                          <action.icon className={`w-5 h-5 ${globalIndex === selectedIndex ? 'text-nexus-accent' : 'text-slate-500'}`} />
                          <span className="font-medium truncate">{action.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </>
              )}
              {filteredActions.length > 0 && (
                <>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 py-1 block">Commands</span>
                  {filteredActions.map((action, index) => {
                    const globalIndex = filteredFileActions.length + index;
                    return (
                      <button
                        key={action.id}
                        onClick={() => { action.action(); onClose(); }}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-colors ${
                          globalIndex === selectedIndex ? 'bg-nexus-accent/10 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <div className="flex items-center gap-3">
                          <action.icon className={`w-5 h-5 ${globalIndex === selectedIndex ? 'text-nexus-accent' : 'text-slate-500'}`} />
                          <span className="font-medium">{action.label}</span>
                        </div>
                        {action.shortcut && (
                          <span className="text-xs text-slate-600 font-mono bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800">{action.shortcut}</span>
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="px-4 py-2 bg-slate-800/50 border-t border-slate-700/50 text-xs text-slate-500 flex justify-between">
           <span>RealSheet · ⌘K</span>
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