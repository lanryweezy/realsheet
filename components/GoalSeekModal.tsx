import React, { useState, useEffect } from 'react';
import { X, Target, Play, AlertCircle, CheckCircle2 } from 'lucide-react';

interface GoalSeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTargetCell?: string;
  onSolve: (targetCell: string, toValue: number, changingCell: string) => Promise<{ success: boolean; newValue: number; error?: string }>;
}

const GoalSeekModal: React.FC<GoalSeekModalProps> = ({ isOpen, onClose, initialTargetCell = '', onSolve }) => {
  const [targetCell, setTargetCell] = useState(initialTargetCell);
  const [toValue, setToValue] = useState('');
  const [changingCell, setChangingCell] = useState('');
  const [status, setStatus] = useState<'idle' | 'solving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTargetCell(initialTargetCell);
      setToValue('');
      setChangingCell('');
      setStatus('idle');
      setMessage('');
    }
  }, [isOpen, initialTargetCell]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCell || !toValue || !changingCell) return;

    setStatus('solving');
    setMessage('Calculating...');

    // Small delay to allow UI to update
    setTimeout(async () => {
        const result = await onSolve(targetCell, parseFloat(toValue), changingCell);
        if (result.success) {
            setStatus('success');
            setMessage(`Solution found: ${Math.round(result.newValue * 100) / 100}`);
        } else {
            setStatus('error');
            setMessage(result.error || 'Could not find a solution.');
        }
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400">
                <Target className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-bold text-white">Goal Seek</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Set Cell</label>
                <input 
                    type="text" 
                    value={targetCell}
                    onChange={(e) => setTargetCell(e.target.value.toUpperCase())}
                    placeholder="e.g. E10"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-nexus-accent outline-none font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Must contain a formula.</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">To Value</label>
                <input 
                    type="number" 
                    value={toValue}
                    onChange={(e) => setToValue(e.target.value)}
                    placeholder="e.g. 1000"
                    step="any"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-nexus-accent outline-none font-mono"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">By Changing Cell</label>
                <input 
                    type="text" 
                    value={changingCell}
                    onChange={(e) => setChangingCell(e.target.value.toUpperCase())}
                    placeholder="e.g. C5"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-nexus-accent outline-none font-mono"
                />
            </div>

            {/* Status Message */}
            {status !== 'idle' && (
                <div className={`p-3 rounded-lg border flex items-center gap-2 text-sm ${
                    status === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                    status === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                    {status === 'success' && <CheckCircle2 className="w-4 h-4" />}
                    {status === 'error' && <AlertCircle className="w-4 h-4" />}
                    {status === 'solving' && <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />}
                    <span>{message}</span>
                </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
                 <button 
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
                >
                    {status === 'success' ? 'Close' : 'Cancel'}
                </button>
                <button 
                    type="submit"
                    disabled={status === 'solving' || !targetCell || !toValue || !changingCell}
                    className="px-5 py-2 rounded-lg bg-nexus-accent text-white hover:bg-cyan-600 transition-colors flex items-center gap-2 font-medium disabled:opacity-50"
                >
                    <Play className="w-4 h-4" /> Start
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default GoalSeekModal;