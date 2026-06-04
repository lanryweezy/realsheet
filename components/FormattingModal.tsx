import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { FormattingRule, ConditionType, IconSetStyle } from '../types';

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
  const [backgroundColor, setBackgroundColor] = useState('#dcfce7');
  const [textColor, setTextColor] = useState('#166534');
  const [iconSetStyle, setIconSetStyle] = useState<IconSetStyle>('arrows');

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
          rule.barColor = backgroundColor;
      }
      if (type === 'iconSet') {
          rule.iconSetStyle = iconSetStyle;
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

  // Rule presets gallery (Excel-like) including data bar & icon set variants
  const rulePresets: { type: ConditionType; label: string; value1?: string; bg: string; text: string; iconSetStyle?: IconSetStyle }[] = [
      { type: 'greaterThan', label: 'Greater than...', value1: '0', bg: '#dcfce7', text: '#166534' },
      { type: 'lessThan', label: 'Less than...', value1: '0', bg: '#fee2e2', text: '#b91c1c' },
      { type: 'colorScale', label: 'Color scale (cyan)', bg: '#06b6d4', text: '#0e7490' },
      { type: 'colorScale', label: 'Color scale (green)', bg: '#22c55e', text: '#15803d' },
      { type: 'colorScale', label: 'Color scale (red-yellow)', bg: '#ef4444', text: '#7f1d1d' },
      { type: 'dataBar', label: 'Data bar (blue)', bg: '#22d3ee', text: '#0e7490' },
      { type: 'dataBar', label: 'Data bar (green)', bg: '#4ade80', text: '#166534' },
      { type: 'dataBar', label: 'Data bar (orange)', bg: '#fb923c', text: '#9a3412' },
      { type: 'iconSet', label: 'Icon set (arrows)', bg: '#94a3b8', text: '#1e293b', iconSetStyle: 'arrows' },
      { type: 'iconSet', label: 'Icon set (traffic)', bg: '#94a3b8', text: '#1e293b', iconSetStyle: 'traffic' },
      { type: 'iconSet', label: 'Icon set (flags)', bg: '#94a3b8', text: '#1e293b', iconSetStyle: 'flags' },
      { type: 'equals', label: 'Equals...', value1: '', bg: '#e0e7ff', text: '#3730a3' },
      { type: 'containsText', label: 'Contains...', value1: '', bg: '#fef3c7', text: '#92400e' },
  ];

  const applyPreset = (preset: typeof rulePresets[0]) => {
      setType(preset.type);
      if (preset.value1 !== undefined) setValue1(preset.value1);
      setBackgroundColor(preset.bg);
      setTextColor(preset.text);
      if (preset.iconSetStyle) setIconSetStyle(preset.iconSetStyle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Conditional Formatting</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded" aria-label="Close Conditional Formatting">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Preset rules</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {rulePresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                  type === preset.type ? 'ring-2 ring-nexus-accent border-nexus-accent' : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <span className="inline-block w-6 h-4 rounded mb-1.5" style={{ backgroundColor: preset.bg }} />
                <span className="text-xs font-medium text-white truncate w-full">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-700 pt-4">
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
                <option value="iconSet">Icon Set</option>
            </select>
          </div>

          {type === 'iconSet' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Icon style</label>
              <select 
                value={iconSetStyle} 
                onChange={(e) => setIconSetStyle(e.target.value as IconSetStyle)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-nexus-accent outline-none"
              >
                <option value="arrows">Arrows (↑ → ↓)</option>
                <option value="arrows3">3 Arrows</option>
                <option value="traffic">Traffic lights</option>
                <option value="flags">Flags</option>
                <option value="dots">Dots</option>
              </select>
            </div>
          )}

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