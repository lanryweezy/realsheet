import React, { useState } from 'react';
import { X, BarChart3, LineChart, PieChart, AreaChart, TrendingUp, CircleDot, Layers, ArrowDownWideNarrow, Gauge, Grid3X3, Activity, Plus, Gauge as Speedometer } from 'lucide-react';
import { ChartConfig } from '../types';

interface ChartWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: string[];
  onAddChart: (config: ChartConfig) => void;
}

const ChartWizardModal: React.FC<ChartWizardModalProps> = ({ isOpen, onClose, columns, onAddChart }) => {
  const [type, setType] = useState<ChartConfig['type']>('bar');
  const [xAxis, setXAxis] = useState(columns[0] || '');
  const [dataKey, setDataKey] = useState(columns.length > 1 ? columns[1] : columns[0] || '');
  const [secondDataKey, setSecondDataKey] = useState(columns.length > 2 ? columns[2] : '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetValue, setTargetValue] = useState(100);

  if (!isOpen) return null;

  const handleAdd = () => {
    onAddChart({
      type,
      dataKey,
      xAxisKey: xAxis,
      secondDataKey: type === 'combo' || type === 'bubble' ? secondDataKey : undefined,
      targetValue: type === 'gauge' ? targetValue : undefined,
      title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Chart of ${dataKey}`,
      description: description || `Chart showing ${dataKey} by ${xAxis}`
    });
    onClose();
  };

  const chartTypes = [
    { id: 'bar' as const, icon: BarChart3, label: 'Bar' },
    { id: 'line' as const, icon: LineChart, label: 'Line' },
    { id: 'area' as const, icon: AreaChart, label: 'Area' },
    { id: 'pie' as const, icon: PieChart, label: 'Pie' },
    { id: 'scatter' as const, icon: TrendingUp, label: 'Scatter' },
    { id: 'bubble' as const, icon: CircleDot, label: 'Bubble' },
    { id: 'combo' as const, icon: Layers, label: 'Combo' },
    { id: 'waterfall' as const, icon: Activity, label: 'Waterfall' },
    { id: 'funnel' as const, icon: ArrowDownWideNarrow, label: 'Funnel' },
    { id: 'gauge' as const, icon: Speedometer, label: 'Gauge' },
    { id: 'heatmap' as const, icon: Grid3X3, label: 'Heatmap' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200 m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Chart Builder</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Chart Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Chart Type</label>
            <div className="grid grid-cols-5 gap-2">
              {chartTypes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                    type === t.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <t.icon className="w-5 h-5 mb-1" />
                  <span className="text-[9px] font-medium">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Chart Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Monthly Sales Analysis"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this chart shows"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">X-Axis (Category)</label>
              <select
                value={xAxis}
                onChange={(e) => setXAxis(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
              >
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Data Series</label>
              <select
                value={dataKey}
                onChange={(e) => setDataKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
              >
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </div>

          {(type === 'combo' || type === 'bubble') && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {type === 'combo' ? 'Second Data Series' : 'Bubble Size'}
              </label>
              <select
                value={secondDataKey}
                onChange={(e) => setSecondDataKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
              >
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          )}

          {type === 'gauge' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Target Value</label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
              />
            </div>
          )}

          <div className="pt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Chart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartWizardModal;
