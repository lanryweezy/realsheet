import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowRight, Save, Play } from 'lucide-react';

interface VisualFormulaBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (formula: string) => void;
  columns: string[];
}

interface FormulaBlock {
  id: string;
  type: 'function' | 'reference' | 'value' | 'operator';
  value: string;
}

const VisualFormulaBuilder: React.FC<VisualFormulaBuilderProps> = ({
  isOpen,
  onClose,
  onApply,
  columns
}) => {
  const [blocks, setBlocks] = useState<FormulaBlock[]>([]);

  const addBlock = (type: FormulaBlock['type'], value: string) => {
    setBlocks([...blocks, { id: Date.now().toString(), type, value }]);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const constructFormula = () => {
    let formula = '=';
    blocks.forEach(block => {
      if (block.type === 'function') {
        formula += `${block.value}(`;
      } else if (block.type === 'operator' && block.value === ')') {
          formula += ')';
      } else {
        formula += block.value;
      }
    });
    // Basic auto-close parentheses
    const openCount = (formula.match(/\(/g) || []).length;
    const closeCount = (formula.match(/\)/g) || []).length;
    for(let i=0; i < openCount - closeCount; i++) formula += ')';

    return formula;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-cyan-400" />
            Visual Formula Builder
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:outline-none rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-slate-950 border border-slate-800 rounded-xl min-h-[100px] flex flex-wrap gap-2 items-center">
            {blocks.length === 0 && <span className="text-slate-600 italic">Add blocks to build your formula...</span>}
            {blocks.map((block) => (
              <div
                key={block.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm animate-in fade-in zoom-in ${
                  block.type === 'function' ? 'bg-blue-500/20 border-blue-500 text-blue-400' :
                  block.type === 'reference' ? 'bg-purple-500/20 border-purple-500 text-purple-400' :
                  block.type === 'operator' ? 'bg-slate-700 border-slate-600 text-slate-300' :
                  'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                }`}
              >
                <span className="text-sm font-mono font-bold">{block.value}</span>
                <button onClick={() => removeBlock(block.id)} className="text-white/40 hover:text-white focus-visible:ring-2 focus-visible:outline-none rounded" aria-label={`Remove ${block.value} block`}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Functions</h3>
              <div className="flex flex-wrap gap-2">
                {['SUM', 'AVERAGE', 'COUNT', 'IF', 'VLOOKUP', 'CONCATENATE'].map(fn => (
                  <button
                    key={fn}
                    onClick={() => addBlock('function', fn)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-white"
                  >
                    {fn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Columns</h3>
              <div className="flex flex-wrap gap-2">
                {columns.slice(0, 10).map(col => (
                  <button
                    key={col}
                    onClick={() => addBlock('reference', col)}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-white"
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Operators</h3>
             <div className="flex flex-wrap gap-2">
                {['+', '-', '*', '/', '(', ')', ',', '>', '<', '=', '&'].map(op => (
                  <button
                    key={op}
                    onClick={() => addBlock('operator', op)}
                    className="px-4 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-white font-bold"
                  >
                    {op}
                  </button>
                ))}
              </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
            <div className="text-sm">
              <span className="text-slate-500">Preview: </span>
              <span className="font-mono text-cyan-400 font-bold">{constructFormula()}</span>
            </div>
            <button
              onClick={() => {
                onApply(constructFormula());
                onClose();
              }}
              className="flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-bold transition-all shadow-lg shadow-cyan-500/20"
            >
              <Save className="w-4 h-4" />
              Apply Formula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualFormulaBuilder;
