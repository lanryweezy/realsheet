import React, { useState } from 'react';
import { X, Table, Check, Calculator } from 'lucide-react';

interface PivotModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: string[];
  onCreatePivot: (groupCol: string, valueCol: string, operation: 'sum' | 'avg' | 'count' | 'min' | 'max') => void;
}

const PivotModal: React.FC<PivotModalProps> = ({ isOpen, onClose, columns, onCreatePivot }) => {
  const [groupCol, setGroupCol] = useState(columns[0] || '');
  const [valueCol, setValueCol] = useState(columns.length > 1 ? columns[1] : columns[0] || '');
  const [operation, setOperation] = useState<'sum' | 'avg' | 'count' | 'min' | 'max'>('sum');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                <Table className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-bold text-white">Create Pivot Table</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          <p className="text-sm text-slate-400">
            Summarize your data by grouping rows and aggregating values. This will create a new view of your data.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Group By (Rows)</label>
            <select 
              value={groupCol}
              onChange={(e) => setGroupCol(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
            >
              {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Summarize Value</label>
                <select 
                  value={valueCol}
                  onChange={(e) => setValueCol(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
                >
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Function</label>
                <select 
                  value={operation}
                  onChange={(e) => setOperation(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
                >
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="count">Count</option>
                  <option value="min">Min</option>
                  <option value="max">Max</option>
                </select>
             </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onCreatePivot(groupCol, valueCol, operation); onClose(); }}
            className="px-4 py-2 rounded-lg bg-nexus-accent text-white hover:bg-cyan-600 transition-colors flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" /> Generate Pivot
          </button>
        </div>
      </div>
    </div>
  );
};

export default PivotModal;