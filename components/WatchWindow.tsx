import React from 'react';
import { X, Eye, Trash2, Hash, FunctionSquare, Plus } from 'lucide-react';
import { SheetData } from '../types';
import { evaluateCellValue, parseCellReference } from '../services/formulaService';

interface WatchWindowProps {
  isOpen: boolean;
  onClose: () => void;
  data: SheetData;
  onRemoveWatch: (cellRef: string) => void;
  onAddWatch: (cellRef: string) => void;
}

const WatchWindow: React.FC<WatchWindowProps> = ({ isOpen, onClose, data, onRemoveWatch, onAddWatch }) => {
  const [newCellInput, setNewCellInput] = React.useState('');

  if (!isOpen) return null;

  const watchedCells = data.watchedCells || [];

  const handleAddSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(newCellInput.trim()) {
          onAddWatch(newCellInput.trim().toUpperCase());
          setNewCellInput('');
      }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700 cursor-move">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Eye className="w-4 h-4 text-nexus-accent" />
          Watch Window
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 max-h-[300px] overflow-y-auto bg-slate-900/95">
        {watchedCells.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500">
            <p>No cells being watched.</p>
            <p className="mt-1">Add cells to monitor their values across sheets.</p>
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="text-slate-500 bg-slate-800/50 sticky top-0">
              <tr>
                <th className="p-2 font-medium">Cell</th>
                <th className="p-2 font-medium">Value</th>
                <th className="p-2 font-medium">Formula</th>
                <th className="p-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {watchedCells.map((cellRef) => {
                const parsed = parseCellReference(cellRef);
                let displayValue: string | number | null = '#REF!';
                let rawValue: string | number | null = '';

                if (parsed && parsed.rowIndex < data.rows.length && parsed.colIndex < data.columns.length) {
                    const colKey = data.columns[parsed.colIndex];
                    rawValue = data.rows[parsed.rowIndex][colKey];
                    displayValue = evaluateCellValue(rawValue, data.rows, data.columns);
                }

                return (
                  <tr key={cellRef} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="p-2 font-mono text-nexus-accent">{cellRef}</td>
                    <td className="p-2 font-medium text-white truncate max-w-[80px]">
                        {displayValue}
                    </td>
                    <td className="p-2 text-slate-400 truncate max-w-[100px] font-mono" title={String(rawValue)}>
                        {String(rawValue).startsWith('=') ? String(rawValue) : ''}
                    </td>
                    <td className="p-2 text-right">
                      <button 
                        onClick={() => onRemoveWatch(cellRef)}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer / Add */}
      <div className="p-2 border-t border-slate-700 bg-slate-800/50">
        <form onSubmit={handleAddSubmit} className="flex gap-2">
            <input 
                type="text" 
                value={newCellInput}
                onChange={(e) => setNewCellInput(e.target.value)}
                placeholder="Add cell (e.g. A1)..."
                className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-nexus-accent"
            />
            <button 
                type="submit"
                disabled={!newCellInput}
                className="p-1.5 bg-slate-700 text-slate-300 rounded hover:bg-nexus-accent hover:text-white transition-colors disabled:opacity-50"
            >
                <Plus className="w-3.5 h-3.5" />
            </button>
        </form>
      </div>
    </div>
  );
};

export default WatchWindow;