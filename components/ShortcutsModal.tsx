import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
      { category: 'General', items: [
          { keys: ['⌘', 'K'], label: 'Command Palette' },
          { keys: ['⌘', 'S'], label: 'Save (Auto-saved)' },
          { keys: ['ESC'], label: 'Close Modals / Clear Selection' },
      ]},
      { category: 'Editing', items: [
          { keys: ['⌘', 'Z'], label: 'Undo' },
          { keys: ['⌘', 'Y'], label: 'Redo' },
          { keys: ['Enter'], label: 'Edit Cell / Move Down' },
          { keys: ['Tab'], label: 'Move Right' },
          { keys: ['Delete'], label: 'Clear Cell' },
      ]},
      { category: 'Navigation', items: [
          { keys: ['↑', '↓', '←', '→'], label: 'Move Selection' },
          { keys: ['Shift', 'Arrows'], label: 'Extend Selection' },
      ]},
  ];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-800 rounded-lg text-slate-300">
                <Keyboard className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {shortcuts.map(cat => (
                <div key={cat.category}>
                    <h3 className="text-sm font-semibold text-nexus-accent uppercase tracking-wider mb-4">{cat.category}</h3>
                    <div className="space-y-3">
                        {cat.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                                <span className="text-sm text-slate-300">{item.label}</span>
                                <div className="flex gap-1">
                                    {item.keys.map(k => (
                                        <kbd key={k} className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono text-slate-400 min-w-[24px] text-center">
                                            {k}
                                        </kbd>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        
        <div className="p-4 bg-slate-800/50 border-t border-slate-700 rounded-b-xl text-center">
            <p className="text-xs text-slate-500">Most shortcuts work when the grid is focused.</p>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsModal;