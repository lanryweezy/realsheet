import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { FormattingRule, ConditionType } from '../types';

interface FormattingModalProps {
  columns: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: FormattingRule) => void;
}

const FormattingModal: React.FC<FormattingModalProps> = ({ columns, isOpen, onClose, onSave }) => {
  const [column, setColumn] = useState(columns[0] || '');
  const [type, setType] = useState<ConditionType>('greaterThan');
  const [value1, setValue1] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#dcfce7'); // Light green default
  const [textColor, setTextColor] = useState('#166534'); // Dark green default

  if (!isOpen) return null;

  const handleSave = () => {
      const rule: FormattingRule = {
          id: Date.now().toString(),
          type,
          column,
          value1,
          style: {
              backgroundColor,
              textColor
          }
      };
      
      if (type === 'colorScale') {
          rule.scaleColors = ['#ffffff', backgroundColor];
      }
      if (type === 'dataBar') {
          rule.barColor = backgroundColor; // Reuse bg picker for bar color
      }

      onSave(rule);
      onClose();
  };

  // Pre-sets for style
  const stylePresets = [
      { bg: '#fee2e2', text: '#b91c1c', label: 'Red' },
      { bg: '#dcfce7', text: '#15803d', label: 'Green' },
      { bg: '#dbeafe', text: '#1d4ed8', label: 'Blue' },
      { bg: '#fef9c3', text: '#a16207', label: 'Yellow' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Add Conditional Formatting</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Column</label>
            <select 
                value={column} 
                onChange={(e) => setColumn(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
            >
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Rule Type</label>
            <select 
                value={type} 
                onChange={(e) => setType(e.target.value as ConditionType)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
            >
                <option value="greaterThan">Greater Than</option>
                <option value="lessThan">Less Than</option>
                <option value="equals">Equals</option>
                <option value="containsText">Contains Text</option>
                <option value="colorScale">Color Scale (Gradient)</option>
                <option value="dataBar">Data Bar</option>
            </select>
          </div>

          {type !== 'colorScale' && type !== 'dataBar' && (
             <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Value</label>
                <input 
                    type="text" 
                    value={value1} 
                    onChange={(e) => setValue1(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
                    placeholder="Enter value..."
                />
             </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Style</label>
            
            {/* Presets */}
            <div className="flex gap-2 mb-3">
                {stylePresets.map((preset, idx) => (
                    <button
                        key={idx}
                        type="button"
                        onClick={() => { setBackgroundColor(preset.bg); setTextColor(preset.text); }}
                        className="w-8 h-8 rounded-full border border-slate-600 transition-transform hover:scale-110 focus:ring-2 ring-white"
                        style={{ backgroundColor: preset.bg }}
                        title={preset.label}
                    />
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <span className="text-xs text-slate-500 block mb-1">Background / Bar Color</span>
                    <div className="flex items-center gap-2">
                         <input 
                            type="color" 
                            value={backgroundColor} 
                            onChange={(e) => setBackgroundColor(e.target.value)} 
                            className="h-8 w-12 bg-transparent border-0 cursor-pointer"
                        />
                         <input 
                            type="text" 
                            value={backgroundColor} 
                            onChange={(e) => setBackgroundColor(e.target.value)} 
                            className="w-full bg-slate-800 text-xs p-1 rounded border border-slate-600"
                        />
                    </div>
                </div>
                {(type !== 'colorScale' && type !== 'dataBar') && (
                    <div>
                        <span className="text-xs text-slate-500 block mb-1">Text Color</span>
                        <div className="flex items-center gap-2">
                            <input 
                                type="color" 
                                value={textColor} 
                                onChange={(e) => setTextColor(e.target.value)} 
                                className="h-8 w-12 bg-transparent border-0 cursor-pointer"
                            />
                            <input 
                                type="text" 
                                value={textColor} 
                                onChange={(e) => setTextColor(e.target.value)} 
                                className="w-full bg-slate-800 text-xs p-1 rounded border border-slate-600"
                            />
                        </div>
                    </div>
                )}
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
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-nexus-accent text-white hover:bg-cyan-600 transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Apply Rule
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormattingModal;