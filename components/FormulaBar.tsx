import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SquareFunction as FunctionSquare, Sparkles, Send, X } from 'lucide-react';
import { generateFormulaFromDescription } from '../services/geminiService';
import { getFormulaSuggestions } from '../utils/formulaFunctions';

interface FormulaBarProps {
  selectedCell: { rowIndex: number; colKey: string } | null;
  value: string | number | null;
  columns: string[];
  onChange: (value: string) => void;
  /** Excel-style address (e.g. A1) for Name Box; if not provided, uses colKey + row */
  cellAddress?: string;
}

const FormulaBar: React.FC<FormulaBarProps> = ({ selectedCell, value, columns, onChange, cellAddress: propAddress }) => {
  const [localValue, setLocalValue] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const formulaInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when the selected cell's value changes from the outside
  useEffect(() => {
    setLocalValue(value === null ? '' : String(value));
  }, [value, selectedCell]);

  const showSuggestions = !aiMode && localValue.startsWith('=');
  const wordBeingTyped = showSuggestions ? (localValue.match(/=[A-Za-z0-9_]*$/)?.[0]?.slice(1) ?? '') : '';
  const suggestions = useMemo(
    () => getFormulaSuggestions(wordBeingTyped),
    [wordBeingTyped]
  );
  const hasSuggestions = showSuggestions && suggestions.length > 0;

  useEffect(() => {
    setSuggestionIndex(0);
  }, [wordBeingTyped]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const insertSuggestion = (functionName: string) => {
    const beforeWord = localValue.slice(0, localValue.length - wordBeingTyped.length);
    const after = functionName + '(';
    setLocalValue(beforeWord + after);
    setSuggestionIndex(0);
    formulaInputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (hasSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex((i) => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' && suggestions[suggestionIndex]) {
        e.preventDefault();
        insertSuggestion(suggestions[suggestionIndex].name);
        return;
      }
      if (e.key === 'Escape') {
        setSuggestionIndex(0);
      }
    }
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

  const cellAddress = propAddress ?? (selectedCell
    ? `${selectedCell.colKey}${selectedCell.rowIndex + 1}`
    : '');

  return (
    <div className="h-8 flex items-center px-2 gap-1.5 backdrop-blur-md z-20 border-b" style={{ background: 'var(--ribbon-bg)', borderColor: 'var(--ribbon-border)' }}>
      {/* Name Box */}
      <div className="w-16 h-6 rounded flex items-center justify-center text-[10px] font-mono font-bold shadow-inner" style={{ background: 'var(--nexus-surface)', border: '1px solid var(--nexus-border)', color: 'var(--nexus-accent)' }}>
        {cellAddress}
      </div>

      <div className="h-6 w-px bg-slate-700 mx-1"></div>

      {/* Function Icon / AI Toggle */}
      <button
        onClick={() => { if (selectedCell) setAiMode(!aiMode); }}
        disabled={!selectedCell}
        className={`p-0.5 rounded hover:bg-slate-700 transition-colors ${aiMode ? 'text-purple-400 bg-purple-400/10' : 'text-slate-500'}`}
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
              onKeyDown={(e) => { if (e.key === 'Enter') handleAiSubmit(); else if (e.key === 'Escape') setAiMode(false); }}
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
          <div className="flex-1 relative">
            <input
              ref={formulaInputRef}
              type="text"
              value={localValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              disabled={!selectedCell}
              placeholder={selectedCell ? "Enter value or formula (e.g. =SUM(A1:A10))..." : "Select a cell"}
              className="w-full h-6.5 bg-[var(--nexus-surface)] border border-[var(--nexus-border)] outline-none focus:ring-1 focus:ring-[var(--nexus-accent)] text-xs font-mono rounded-md px-2.5 transition-colors shadow-inner"
              style={{ color: 'var(--nexus-text-main)' }}
              spellCheck={false}
            />
            <AnimatePresence>
            {hasSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 top-full mt-1 py-1 min-w-[280px] max-h-[320px] overflow-y-auto rounded-xl border border-[var(--nexus-border)] shadow-2xl z-50 backdrop-blur-xl bg-[var(--nexus-surface)]/95"
              >
                <div className="px-2 py-1 text-[10px] uppercase font-semibold" style={{ color: 'var(--nexus-text-muted)' }}>
                  Functions
                </div>
                {suggestions.map((fn, idx) => (
                  <button
                    key={fn.name}
                    type="button"
                    onClick={() => insertSuggestion(fn.name)}
                    className={`w-full text-left px-3 py-2 text-sm flex flex-col gap-0.5 transition-colors ${
                       idx === suggestionIndex ? 'bg-nexus-accent/20 border-l-4 border-nexus-accent' : 'hover:bg-white/5 border-l-4 border-transparent'
                      }`}
                    style={{ color: 'var(--nexus-text-main)' }}
                  >
                    <div className="flex items-center justify-between">
                       <span className="font-mono font-bold text-nexus-accent">{fn.name}</span>
                       <span className="text-[10px] opacity-40 font-mono italic">{fn.syntax}</span>
                    </div>
                    <span className="text-xs leading-tight opacity-70" style={{ color: 'var(--nexus-text-muted)' }}>{fn.description}</span>
                  </button>
                ))}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormulaBar;