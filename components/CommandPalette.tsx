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
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-slate-950/40 backdrop-blur-md transition-all p-4">
      <div className="w-full max-w-xl bg-slate-900/40 backdrop-blur-3xl border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_-12px_rgba(34,211,238,0.3)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative ring-1 ring-white/10">
        {/* HUD Decorative Elements */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/50 rounded-br-2xl pointer-events-none" />

        {/* Scanline Effect Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_2px,3px_100%] z-10 opacity-20" />

        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-slate-900/50">
          <Search className="w-5 h-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SYSTEM COMMAND / SEARCH..."
            className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-slate-600 text-xl font-medium tracking-tight"
          />
          <div className="flex items-center gap-1">
            <span className="text-[10px] bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 px-2 py-1 rounded-md font-mono tracking-widest">ESC</span>
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto py-3 scrollbar-hide">
          {allItems.length === 0 ? (
            <div className="px-5 py-12 text-center text-slate-500">
              <p className="font-mono text-sm uppercase tracking-widest opacity-50">No matches found in local directory</p>
            </div>
          ) : (
            <div className="space-y-1 px-3">
              {filteredFileActions.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1">
                    <span className="text-[10px] font-bold text-cyan-500/50 uppercase tracking-[0.2em]">Data Sheets</span>
                    <div className="h-px flex-1 bg-cyan-500/10" />
                  </div>
                  {filteredFileActions.map((action, index) => {
                    const globalIndex = index;
                    const isSelected = globalIndex === selectedIndex;
                    return (
                      <button
                        key={action.id}
                        onClick={() => { action.action(); onClose(); }}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all group ${isSelected ? 'bg-cyan-500/10 border border-cyan-500/20 text-white shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]' : 'text-slate-400 hover:bg-white/5 border border-transparent'
                          }`}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.3)]' : 'bg-slate-800/50'}`}>
                            <action.icon className={`w-5 h-5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                          </div>
                          <span className={`font-semibold tracking-wide transition-colors ${isSelected ? 'text-cyan-100' : ''}`}>{action.label}</span>
                        </div>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)] animate-pulse" />}
                      </button>
                    );
                  })}
                </>
              )}
              {filteredActions.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1 mt-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Application Control</span>
                    <div className="h-px flex-1 bg-slate-700/30" />
                  </div>
                  {filteredActions.map((action, index) => {
                    const globalIndex = filteredFileActions.length + index;
                    const isSelected = globalIndex === selectedIndex;
                    return (
                      <button
                        key={action.id}
                        onClick={() => { action.action(); onClose(); }}
                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-left transition-all group ${isSelected ? 'bg-slate-800/60 border border-white/10 text-white' : 'text-slate-500 hover:bg-white/5 border border-transparent'
                          }`}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg transition-colors ${isSelected ? 'bg-slate-700 shadow-inner' : 'bg-slate-800/30'}`}>
                            <action.icon className={`w-5 h-5 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`} />
                          </div>
                          <span className="font-medium tracking-wide">{action.label}</span>
                        </div>
                        {action.shortcut ? (
                          <span className={`text-[10px] font-mono px-2 py-1 rounded bg-black/40 border transition-colors ${isSelected ? 'border-white/20 text-slate-300' : 'border-white/5 text-slate-600'}`}>{action.shortcut}</span>
                        ) : (
                          isSelected && <div className="w-1 h-3 bg-cyan-400/50" />
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-3 bg-slate-900/80 border-t border-white/5 text-[10px] text-slate-600 flex justify-between items-center font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="text-cyan-500/50">●</span> REAL-SHEET CORE</span>
            <span className="opacity-40">v2.4.0-NEXUS</span>
          </div>
          <div className="flex gap-4 opacity-70">
            <span className="flex items-center gap-1"><span className="text-slate-400">↑↓</span> NAV</span>
            <span className="flex items-center gap-1"><span className="text-slate-400">↵</span> EXEC</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;