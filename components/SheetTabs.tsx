import React from 'react';
import { Plus, X } from 'lucide-react';
import { Workbook, SheetData } from '../types';

interface SheetTabsProps {
  workbook: Workbook;
  onActiveSheetChange: (index: number) => void;
  onAddSheet: () => void;
  onRenameSheet: (index: number, newName: string) => void;
  onCloseSheet: (index: number) => void;
}

export const SheetTabs: React.FC<SheetTabsProps> = ({
  workbook,
  onActiveSheetChange,
  onAddSheet,
  onRenameSheet,
  onCloseSheet
}) => {
  const handleRename = (index: number, name: string) => {
    if (name.trim()) {
      onRenameSheet(index, name.trim());
    }
  };

  return (
    <div className="flex items-center gap-1 bg-slate-800/50 border-b border-slate-700/50 px-2 py-1 overflow-x-auto">
      {workbook.sheets.map((sheet, index) => (
        <div 
          key={sheet.id || index} 
          className={`flex items-center gap-1 px-3 py-2 text-sm border rounded-t ${
            workbook.activeSheetIndex === index
              ? 'bg-slate-900 border-slate-700 border-b-transparent text-white'
              : 'bg-slate-800 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
          }`}
        >
          <button
            onClick={() => onActiveSheetChange(index)}
            className="flex-1 text-left truncate max-w-[120px]"
            title={sheet.name}
          >
            {sheet.name}
          </button>
          {workbook.sheets.length > 1 && (
            <button
              onClick={() => onCloseSheet(index)}
              className="p-0.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
      <button
        onClick={onAddSheet}
        className="flex items-center gap-1 px-2 py-2 text-slate-400 hover:text-white"
        title="Add new sheet"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};