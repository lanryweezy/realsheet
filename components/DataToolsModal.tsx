import React, { useState, useEffect } from 'react';
import { X, CopyMinus, SplitSquareHorizontal, Search, Check, ArrowRight, RefreshCcw, Sparkles } from 'lucide-react';

export type ToolMode = 'duplicates' | 'split' | 'find' | 'clean';

interface DataToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: string[];
  onRemoveDuplicates: (selectedColumns: string[]) => void;
  onTextToColumns: (column: string, delimiter: string) => void;
  onFindReplace: (findText: string, replaceText: string, column: string, matchCase: boolean) => void;
  onMagicClean?: (column: string, instruction: string) => void;
  initialMode?: ToolMode;
  initialColumn?: string;
}

const DataToolsModal: React.FC<DataToolsModalProps> = ({ 
  isOpen, 
  onClose, 
  columns, 
  onRemoveDuplicates,
  onTextToColumns,
  onFindReplace,
  onMagicClean,
  initialMode = 'duplicates',
  initialColumn
}) => {
  const [activeMode, setActiveMode] = useState<ToolMode>(initialMode);
  
  // Remove Duplicates State
  const [dupColumns, setDupColumns] = useState<Set<string>>(new Set(columns));
  
  // Split State
  const [splitColumn, setSplitColumn] = useState(columns[0] || '');
  const [delimiter, setDelimiter] = useState(',');
  const [customDelimiter, setCustomDelimiter] = useState('');

  // Find Replace State
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findColumn, setFindColumn] = useState('All Columns');
  const [matchCase, setMatchCase] = useState(false);

  // Magic Clean State
  const [cleanColumn, setCleanColumn] = useState(columns[0] || '');
  const [cleanInstruction, setCleanInstruction] = useState('Standardize date formats');

  // Sync state when opening
  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode);
      
      if (initialColumn) {
        setSplitColumn(initialColumn);
        setCleanColumn(initialColumn);
        // For duplicates, we might want to default to just this column if opened from context menu,
        // but typically users want to dedup based on a key. 
        // Let's set duplicates to ALL columns by default unless specifically requested, 
        // but finding/replacing usually defaults to specific column if context aware.
        if (initialMode === 'find') {
            setFindColumn(initialColumn);
        }
      } else {
          setFindColumn('All Columns');
      }
      
      // Reset validation states if needed
      setDupColumns(new Set(columns));
    }
  }, [isOpen, initialMode, initialColumn, columns]);

  if (!isOpen) return null;

  const toggleDupColumn = (col: string) => {
    const newSet = new Set(dupColumns);
    if (newSet.has(col)) newSet.delete(col);
    else newSet.add(col);
    setDupColumns(newSet);
  };

  const handleApply = () => {
    if (activeMode === 'duplicates') {
      onRemoveDuplicates(Array.from(dupColumns));
    } else if (activeMode === 'split') {
      const actualDelimiter = delimiter === 'custom' ? customDelimiter : delimiter;
      onTextToColumns(splitColumn, actualDelimiter);
    } else if (activeMode === 'find') {
      onFindReplace(findText, replaceText, findColumn, matchCase);
    } else if (activeMode === 'clean' && onMagicClean) {
        onMagicClean(cleanColumn, cleanInstruction);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row overflow-hidden max-h-[90vh]">
        
        {/* Sidebar */}
        <div className="w-full md:w-48 bg-slate-800/50 border-b md:border-b-0 md:border-r border-slate-700 p-4 flex flex-row md:flex-col gap-2">
          <button 
            onClick={() => setActiveMode('duplicates')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeMode === 'duplicates' ? 'bg-nexus-accent text-white shadow-lg shadow-cyan-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <CopyMinus className="w-4 h-4" />
            <span className="hidden md:inline">Remove Duplicates</span>
            <span className="md:hidden">Dedup</span>
          </button>
          <button 
            onClick={() => setActiveMode('split')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeMode === 'split' ? 'bg-nexus-accent text-white shadow-lg shadow-cyan-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <SplitSquareHorizontal className="w-4 h-4" />
            <span className="hidden md:inline">Text to Columns</span>
            <span className="md:hidden">Split</span>
          </button>
          <button 
            onClick={() => setActiveMode('find')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeMode === 'find' ? 'bg-nexus-accent text-white shadow-lg shadow-cyan-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Find & Replace</span>
            <span className="md:hidden">Find</span>
          </button>
          <button 
            onClick={() => setActiveMode('clean')}
            className={`flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeMode === 'clean' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-800'}`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">AI Magic Clean</span>
            <span className="md:hidden">AI</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              {activeMode === 'duplicates' && 'Remove Duplicates'}
              {activeMode === 'split' && 'Text to Columns'}
              {activeMode === 'find' && 'Find & Replace'}
              {activeMode === 'clean' && 'AI Magic Clean'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[300px]">
            {activeMode === 'duplicates' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">Select columns to analyze for duplicate values. Rows with identical values in ALL selected columns will be removed.</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Columns</span>
                  <div className="space-x-2">
                     <button onClick={() => setDupColumns(new Set(columns))} className="text-xs text-nexus-accent hover:underline">Select All</button>
                     <button onClick={() => setDupColumns(new Set())} className="text-xs text-slate-400 hover:underline">Clear</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto p-2 border border-slate-700 rounded-lg bg-slate-800/30">
                  {columns.map(col => (
                    <label key={col} className="flex items-center gap-2 p-2 rounded hover:bg-slate-700/50 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={dupColumns.has(col)}
                        onChange={() => toggleDupColumn(col)}
                        className="rounded border-slate-600 bg-slate-800 text-nexus-accent focus:ring-nexus-accent"
                      />
                      <span className="text-sm text-slate-200 truncate">{col}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeMode === 'split' && (
              <div className="space-y-6">
                <p className="text-sm text-slate-400">Split the contents of a single column into multiple columns based on a delimiter.</p>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Column to Split</label>
                  <select 
                    value={splitColumn}
                    onChange={(e) => setSplitColumn(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
                  >
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Delimiter</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Comma', 'Space', 'Tab', 'Semicolon'].map(d => {
                      const val = d === 'Tab' ? '\t' : d === 'Space' ? ' ' : d === 'Semicolon' ? ';' : ',';
                      return (
                        <button
                          key={d}
                          onClick={() => setDelimiter(val)}
                          className={`p-3 rounded-lg border text-sm transition-all ${delimiter === val ? 'border-nexus-accent bg-nexus-accent/10 text-white' : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'}`}
                        >
                          {d}
                        </button>
                      );
                    })}
                    <button
                       onClick={() => setDelimiter('custom')}
                       className={`col-span-2 p-3 rounded-lg border text-sm transition-all ${delimiter === 'custom' ? 'border-nexus-accent bg-nexus-accent/10 text-white' : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'}`}
                    >
                      Custom
                    </button>
                  </div>
                  {delimiter === 'custom' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                      <input 
                        type="text" 
                        placeholder="Enter character"
                        maxLength={1}
                        value={customDelimiter}
                        onChange={(e) => setCustomDelimiter(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeMode === 'find' && (
               <div className="space-y-6">
                  <p className="text-sm text-slate-400">Search for text within your data and replace it with new content.</p>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Find</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={findText}
                          onChange={(e) => setFindText(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 pl-10 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
                          placeholder="Text to find..."
                        />
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <ArrowRight className="w-5 h-5 text-slate-600 rotate-90 md:rotate-0" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Replace With</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={replaceText}
                          onChange={(e) => setReplaceText(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 pl-10 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
                          placeholder="New text..."
                        />
                        <RefreshCcw className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                    <div>
                       <label className="block text-sm font-medium text-slate-300 mb-2">Look In</label>
                       <select 
                        value={findColumn}
                        onChange={(e) => setFindColumn(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
                      >
                        <option value="All Columns">All Columns</option>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex items-end pb-2">
                       <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={matchCase}
                            onChange={(e) => setMatchCase(e.target.checked)}
                            className="rounded border-slate-600 bg-slate-800 text-nexus-accent focus:ring-nexus-accent" 
                          />
                          <span className="text-sm text-slate-300">Match Case</span>
                       </label>
                    </div>
                  </div>
               </div>
            )}

            {activeMode === 'clean' && (
               <div className="space-y-6">
                  <p className="text-sm text-slate-400">Use AI to automatically clean, format, or standardize a column.</p>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Column to Clean</label>
                    <select 
                      value={cleanColumn}
                      onChange={(e) => setCleanColumn(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
                    >
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                     <label className="block text-sm font-medium text-slate-300 mb-2">Cleaning Instruction</label>
                     <div className="space-y-2">
                        {['Standardize date formats to YYYY-MM-DD', 'Capitalize first letter of each word', 'Remove special characters', 'Fix common typos'].map(inst => (
                            <button
                                key={inst}
                                onClick={() => setCleanInstruction(inst)}
                                className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${cleanInstruction === inst ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500'}`}
                            >
                                {inst}
                            </button>
                        ))}
                        <input
                            type="text"
                            value={cleanInstruction}
                            onChange={(e) => setCleanInstruction(e.target.value)}
                            placeholder="Or type custom instruction..."
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none mt-2"
                        />
                     </div>
                  </div>
               </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-700 flex justify-end gap-3">
             <button 
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleApply}
                disabled={
                    (activeMode === 'duplicates' && dupColumns.size === 0) || 
                    (activeMode === 'split' && !splitColumn) || 
                    (activeMode === 'find' && !findText) ||
                    (activeMode === 'clean' && (!cleanColumn || !cleanInstruction))
                }
                className={`px-6 py-2 rounded-lg text-white transition-colors flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed ${activeMode === 'clean' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-nexus-accent hover:bg-cyan-600'}`}
              >
                {activeMode === 'clean' ? <Sparkles className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                {activeMode === 'duplicates' ? 'Remove Duplicates' : activeMode === 'split' ? 'Split Column' : activeMode === 'clean' ? 'Start Cleaning' : 'Replace All'}
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataToolsModal;