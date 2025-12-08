import React, { useEffect, useState } from 'react';
import { FunctionSquare, Sparkles, Send } from 'lucide-react';
import { generateFormulaFromDescription } from '../services/geminiService';

interface FormulaBarProps {
  selectedCell: { rowIndex: number; colKey: string } | null;
  value: string | number | null;
  columns: string[];
  onChange: (value: string) => void;
}

const FormulaBar: React.FC<FormulaBarProps> = ({ selectedCell, value, columns, onChange }) => {
  const [localValue, setLocalValue] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync local state when the selected cell's value changes from the outside
  useEffect(() => {
    setLocalValue(value === null ? '' : String(value));
  }, [value, selectedCell]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onChange(localValue);
      e.currentTarget.blur();
    }
  };

  const handleBlur = () => {
    if (localValue !== String(value ?? '')) {
      onChange(localValue);
    }
  };

  const handleAiSubmit = async () => {
      if (!aiPrompt.trim()) return;
      setIsGenerating(true);
      const formula = await generateFormulaFromDescription(aiPrompt, columns);
      setIsGenerating(false);
      if (formula) {
          setLocalValue(formula);
          onChange(formula);
          setAiMode(false);
          setAiPrompt('');
      }
  };

  const cellAddress = selectedCell 
    ? `${selectedCell.colKey}${selectedCell.rowIndex + 1}` 
    : '';

  return (
    <div className="h-10 bg-slate-800/80 border-b border-slate-700/50 flex items-center px-2 gap-2 backdrop-blur-md z-20">
      {/* Name Box */}
      <div className="w-16 h-7 bg-slate-900/50 border border-slate-700 rounded flex items-center justify-center text-xs font-mono text-nexus-accent font-bold shadow-inner">
        {cellAddress}
      </div>

      <div className="h-6 w-px bg-slate-700 mx-1"></div>

      {/* Function Icon / AI Toggle */}
      <button 
        onClick={() => { if(selectedCell) setAiMode(!aiMode); }}
        disabled={!selectedCell}
        className={`p-1 rounded hover:bg-slate-700 transition-colors ${aiMode ? 'text-purple-400 bg-purple-400/10' : 'text-slate-500'}`}
        title="AI Formula Assistant"
      >
        {aiMode ? <Sparkles className="w-4 h-4" /> : <FunctionSquare className="w-4 h-4" />}
      </button>

      {/* Formula Input */}
      <div className="flex-1 relative h-full flex items-center">
        {aiMode ? (
            <div className="w-full flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAiSubmit(); else if(e.key === 'Escape') setAiMode(false); }}
                    autoFocus
                    placeholder="Describe formula (e.g., 'Sum of Cost column')"
                    className="flex-1 h-7 bg-purple-900/20 border border-purple-500/30 outline-none text-sm text-purple-100 placeholder:text-purple-300/50 rounded px-2"
                />
                 <button 
                    onClick={handleAiSubmit}
                    disabled={isGenerating}
                    className="p-1 rounded bg-purple-600 text-white hover:bg-purple-500 transition-colors"
                 >
                    {isGenerating ? <Sparkles className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                 </button>
            </div>
        ) : (
            <input
                type="text"
                value={localValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                disabled={!selectedCell}
                placeholder={selectedCell ? "Enter value or formula..." : "Select a cell"}
                className="w-full h-7 bg-transparent border-none outline-none text-sm text-white font-mono placeholder:text-slate-600 focus:bg-slate-700/30 rounded px-2 transition-colors"
                spellCheck={false}
            />
        )}
      </div>
    </div>
  );
};

export default FormulaBar;