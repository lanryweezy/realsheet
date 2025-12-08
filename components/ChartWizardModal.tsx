import React, { useState } from 'react';
import { X, BarChart3, LineChart, PieChart, AreaChart, Plus } from 'lucide-react';
import { ChartConfig } from '../types';

interface ChartWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: string[];
  onAddChart: (config: ChartConfig) => void;
}

const ChartWizardModal: React.FC<ChartWizardModalProps> = ({ isOpen, onClose, columns, onAddChart }) => {
  const [type, setType] = useState<'bar'|'line'|'area'|'pie'>('bar');
  const [xAxis, setXAxis] = useState(columns[0] || '');
  const [dataKey, setDataKey] = useState(columns.length > 1 ? columns[1] : columns[0] || '');
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    onAddChart({
        type,
        dataKey,
        xAxisKey: xAxis,
        title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart of ${dataKey} by ${xAxis}`,
        description: `Manual chart created by user`
    });
    onClose();
  };

  const chartTypes = [
      { id: 'bar', icon: BarChart3, label: 'Bar Chart' },
      { id: 'line', icon: LineChart, label: 'Line Chart' },
      { id: 'area', icon: AreaChart, label: 'Area Chart' },
      { id: 'pie', icon: PieChart, label: 'Pie Chart' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Chart Builder</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
            {/* Chart Type Selection */}
            <div className="grid grid-cols-4 gap-2">
                {chartTypes.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setType(t.id as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${type === t.id ? 'bg-nexus-accent/20 border-nexus-accent text-nexus-accent' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                    >
                        <t.icon className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-medium">{t.label}</span>
                    </button>
                ))}
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Chart Title</label>
                <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Monthly Sales Analysis"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">X-Axis (Category)</label>
                    <select 
                        value={xAxis}
                        onChange={(e) => setXAxis(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
                    >
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Data Series (Value)</label>
                    <select 
                        value={dataKey}
                        onChange={(e) => setDataKey(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
                    >
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
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
            onClick={handleAdd}
            className="px-4 py-2 rounded-lg bg-nexus-accent text-white hover:bg-cyan-600 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartWizardModal;