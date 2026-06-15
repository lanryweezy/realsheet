import React, { useState } from 'react';
import { X, Save, ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';
import { Row } from '../types';

interface RecordDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  row: Row;
  columns: string[];
  rowIndex: number;
  onSave: (rowIndex: number, updatedRow: Row) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

const RecordDetailView: React.FC<RecordDetailViewProps> = ({
  isOpen,
  onClose,
  row,
  columns,
  rowIndex,
  onSave,
  onNext,
  onPrev
}) => {
  const [editRow, setEditRow] = useState<Row>({ ...row });

  const handleChange = (col: string, value: string) => {
    let finalValue: string | number = value;
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && String(num) === value.trim()) {
      finalValue = num;
    }
    setEditRow({ ...editRow, [col]: finalValue });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex flex-col bg-slate-950 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg focus-visible:ring-2 focus-visible:outline-none" aria-label="Close">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-white">Record Details</h2>
            <p className="text-xs text-slate-500 font-mono uppercase tracking-widest">Row {rowIndex + 1}</p>
          </div>
        </div>
        <button
          onClick={() => { onSave(rowIndex, editRow); onClose(); }}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-cyan-500"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {columns.map(col => (
            <div key={col} className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{col}</label>
              <input
                type="text"
                value={String(editRow[col] ?? '')}
                onChange={(e) => handleChange(col, e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between gap-4">
        <button
          onClick={onPrev}
          disabled={!onPrev}
          aria-label="Previous Record"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold disabled:opacity-30 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-cyan-500"
        >
          <ArrowLeft className="w-4 h-4" /> Previous
        </button>
        <button
          onClick={onNext}
          disabled={!onNext}
          aria-label="Next Record"
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 text-slate-300 rounded-xl font-bold disabled:opacity-30 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-cyan-500"
        >
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default RecordDetailView;
