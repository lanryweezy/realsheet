import React, { useState, useMemo } from 'react';
import { X, Check, Filter, Search } from 'lucide-react';
import { createSlicerOptions, applySlicerFilter } from '../services/advancedPivotService';
import { SheetData } from '../types';

interface SlicerProps {
  data: SheetData;
  field: string;
  title?: string;
  onFilterChange: (field: string, selectedValues: any[]) => void;
  onClose?: () => void;
}

const Slicer: React.FC<SlicerProps> = ({
  data,
  field,
  title = field,
  onFilterChange,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedValues, setSelectedValues] = useState<any[]>([]);

  // Get unique values for the field
  const options = useMemo(() => {
    const allOptions = createSlicerOptions(data, field);
    
    if (searchTerm) {
      return allOptions.filter(opt => 
        String(opt.value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return allOptions;
  }, [data, field, searchTerm]);

  const handleToggleValue = (value: any) => {
    const newSelected = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    
    setSelectedValues(newSelected);
    onFilterChange(field, newSelected);
  };

  const handleSelectAll = () => {
    const allValues = options.map(o => o.value);
    setSelectedValues(allValues);
    onFilterChange(field, allValues);
  };

  const handleClearAll = () => {
    setSelectedValues([]);
    onFilterChange(field, []);
  };

  const selectedCount = selectedValues.length;
  const totalCount = options.length;

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-lg w-64 max-h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-600">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">{selectedCount}/{totalCount}</span>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded" aria-label="Close Slicer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-slate-600">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full bg-slate-700 border border-slate-600 rounded pl-7 pr-2 py-1 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1 p-2 border-b border-slate-600">
        <button
          onClick={handleSelectAll}
          className="flex-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
        >
          Select All
        </button>
        <button
          onClick={handleClearAll}
          className="flex-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
        >
          Clear
        </button>
      </div>

      {/* Options List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {options.map((option, index) => {
          const isSelected = selectedValues.includes(option.value);
          
          return (
            <button
              key={index}
              onClick={() => handleToggleValue(option.value)}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                  isSelected ? 'bg-cyan-400 border-cyan-400' : 'border-slate-500'
                }`}>
                  {isSelected && <Check className="w-3 h-3 text-slate-900" />}
                </div>
                <span className="truncate max-w-[120px]">{String(option.value)}</span>
              </div>
              <span className="text-xs text-slate-500">{option.count}</span>
            </button>
          );
        })}

        {options.length === 0 && (
          <div className="text-center py-4 text-slate-400 text-sm">
            No results found
          </div>
        )}
      </div>
    </div>
  );
};

export default Slicer;
