import React from 'react';
import { DollarSign, Percent, Calendar, Hash, Type, Check, X } from 'lucide-react';

export interface CellStyle {
  id: string;
  name: string;
  icon: React.ElementType;
  format: 'currency' | 'percentage' | 'date' | 'number' | 'text' | 'boolean';
  description: string;
  example: string;
}

const PRESET_STYLES: CellStyle[] = [
  {
    id: 'currency',
    name: 'Currency',
    icon: DollarSign,
    format: 'currency',
    description: '$1,234.56',
    example: '$1,234.56'
  },
  {
    id: 'currency-eur',
    name: 'Currency (EUR)',
    icon: DollarSign,
    format: 'currency',
    description: '€1.234,56',
    example: '€1.234,56'
  },
  {
    id: 'percentage',
    name: 'Percentage',
    icon: Percent,
    format: 'percentage',
    description: '12.34%',
    example: '12.34%'
  },
  {
    id: 'date-short',
    name: 'Date (Short)',
    icon: Calendar,
    format: 'date',
    description: 'MM/DD/YYYY',
    example: '02/24/2026'
  },
  {
    id: 'date-long',
    name: 'Date (Long)',
    icon: Calendar,
    format: 'date',
    description: 'MMMM D, YYYY',
    example: 'February 24, 2026'
  },
  {
    id: 'number',
    name: 'Number',
    icon: Hash,
    format: 'number',
    description: '1,234.56',
    example: '1,234.56'
  },
  {
    id: 'number-decimal',
    name: 'Number (2 decimals)',
    icon: Hash,
    format: 'number',
    description: '1,234.56',
    example: '1,234.56'
  },
  {
    id: 'text',
    name: 'Text',
    icon: Type,
    format: 'text',
    description: 'Plain text',
    example: 'Hello World'
  },
  {
    id: 'boolean',
    name: 'Boolean',
    icon: Check,
    format: 'boolean',
    description: 'TRUE / FALSE',
    example: 'TRUE'
  }
];

interface CellStylesGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStyle: (style: CellStyle) => void;
  anchorEl?: HTMLElement | null;
}

const CellStylesGallery: React.FC<CellStylesGalleryProps> = ({
  isOpen,
  onClose,
  onSelectStyle,
  anchorEl
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
          <div>
            <h3 className="text-sm font-semibold text-white">Cell Styles</h3>
            <p className="text-xs text-slate-400 mt-0.5">Apply preset formatting to selected cells</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Styles Grid */}
        <div className="p-4 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto">
          {PRESET_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => {
                onSelectStyle(style);
                onClose();
              }}
              className="group flex flex-col items-center p-3 rounded-lg border border-slate-700 hover:border-nexus-accent hover:bg-nexus-accent/10 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-slate-800 group-hover:bg-nexus-accent/20 flex items-center justify-center mb-2 transition-colors">
                <style.icon className="w-5 h-5 text-slate-400 group-hover:text-nexus-accent transition-colors" />
              </div>
              <span className="text-xs font-medium text-slate-300 group-hover:text-white text-center">
                {style.name}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 font-mono">
                {style.example}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-800/30 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Click a style to apply to selected cells
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Tip: Use</span>
            <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300">Ctrl+1</kbd>
            <span>to open</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export { PRESET_STYLES };
export default CellStylesGallery;
