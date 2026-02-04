import React, { useState, useEffect } from 'react';
import { X, Search, Replace, RotateCcw, ChevronDown, ChevronUp, Play } from 'lucide-react';
import { FindReplaceOptions, SearchResult, SheetData } from '../types';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetData: SheetData;
  onFind: (options: FindReplaceOptions) => SearchResult[];
  onReplace: (options: FindReplaceOptions) => number;
  onReplaceAll: (options: FindReplaceOptions) => number;
  onSelectResult: (result: SearchResult) => void;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  sheetData,
  onFind,
  onReplace,
  onReplaceAll,
  onSelectResult
}) => {
  const [mode, setMode] = useState<'find' | 'replace'>('find');
  const [options, setOptions] = useState<FindReplaceOptions>({
    findText: '',
    replaceText: '',
    matchCase: false,
    matchWholeCell: false,
    searchDirection: 'forward',
    searchScope: 'current-sheet',
    searchWithin: 'values'
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof FindReplaceOptions, value: any) => {
    setOptions(prev => ({ ...prev, [field]: value }));
  };

  const handleFind = () => {
    const searchResults = onFind(options);
    setResults(searchResults);
    setCurrentResultIndex(searchResults.length > 0 ? 0 : -1);
    if (searchResults.length > 0) {
      onSelectResult(searchResults[0]);
    }
  };

  const handleReplace = () => {
    if (currentResultIndex >= 0 && currentResultIndex < results.length) {
      const currentResult = results[currentResultIndex];
      const newOptions = {
        ...options,
        findText: currentResult.oldValue,
        replaceText: options.replaceText
      };
      onReplace(newOptions);
      
      // Refresh results after replacement
      setTimeout(() => {
        const newResults = onFind(options);
        setResults(newResults);
        if (newResults.length > 0) {
          const newIndex = Math.min(currentResultIndex, newResults.length - 1);
          setCurrentResultIndex(newIndex);
          onSelectResult(newResults[newIndex]);
        }
      }, 100);
    }
  };

  const handleReplaceAll = () => {
    const count = onReplaceAll(options);
    setResults([]);
    setCurrentResultIndex(-1);
  };

  const goToNextResult = () => {
    if (results.length === 0) return;
    const nextIndex = (currentResultIndex + 1) % results.length;
    setCurrentResultIndex(nextIndex);
    onSelectResult(results[nextIndex]);
  };

  const goToPrevResult = () => {
    if (results.length === 0) return;
    const prevIndex = currentResultIndex <= 0 ? results.length - 1 : currentResultIndex - 1;
    setCurrentResultIndex(prevIndex);
    onSelectResult(results[prevIndex]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 border-b border-slate-700 pb-2">
            <button
              className={`px-3 py-1 rounded-t ${mode === 'find' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              onClick={() => setMode('find')}
            >
              Find
            </button>
            <button
              className={`px-3 py-1 rounded-t ${mode === 'replace' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              onClick={() => setMode('replace')}
            >
              Replace
            </button>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Find what</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={options.findText}
                onChange={(e) => handleInputChange('findText', e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                placeholder="Enter text to find..."
              />
              <button
                onClick={handleFind}
                className="p-2 bg-nexus-accent hover:bg-cyan-600 rounded"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>

          {mode === 'replace' && (
            <div>
              <label className="block text-sm text-slate-300 mb-1">Replace with</label>
              <input
                type="text"
                value={options.replaceText || ''}
                onChange={(e) => handleInputChange('replaceText', e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                placeholder="Enter replacement text..."
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="match-case"
                checked={options.matchCase}
                onChange={(e) => handleInputChange('matchCase', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="match-case" className="text-sm text-slate-300">Match case</label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="match-whole-cell"
                checked={options.matchWholeCell}
                onChange={(e) => handleInputChange('matchWholeCell', e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="match-whole-cell" className="text-sm text-slate-300">Match entire cell</label>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleFind}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
            >
              <Search className="w-4 h-4" />
              Find All
            </button>
            {mode === 'replace' && (
              <>
                <button
                  onClick={handleReplace}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                >
                  <Replace className="w-4 h-4" />
                  Replace
                </button>
                <button
                  onClick={handleReplaceAll}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  Replace All
                </button>
              </>
            )}
          </div>

          {results.length > 0 && (
            <div className="border-t border-slate-700 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">
                  {currentResultIndex + 1} of {results.length} results
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={goToPrevResult}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToNextResult}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="max-h-32 overflow-y-auto bg-slate-900/50 rounded border border-slate-700">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-2 border-b border-slate-800 last:border-b-0 cursor-pointer ${
                      index === currentResultIndex ? 'bg-slate-700' : 'hover:bg-slate-800'
                    }`}
                    onClick={() => {
                      setCurrentResultIndex(index);
                      onSelectResult(result);
                    }}
                  >
                    <div className="text-xs text-slate-300">
                      Row {result.rowIndex + 1}, Col {String.fromCharCode(65 + result.colIndex)}
                    </div>
                    <div className="text-sm truncate">{result.oldValue}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};