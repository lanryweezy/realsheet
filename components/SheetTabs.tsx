import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  X,
  Copy,
  Edit2,
  Trash2,
  Palette,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
} from 'lucide-react';
import { Workbook, SheetData } from '../types';

interface SheetTabsProps {
  workbook: Workbook;
  onActiveSheetChange: (index: number) => void;
  onAddSheet: () => void;
  onRenameSheet: (index: number, newName: string) => void;
  onCloseSheet: (index: number) => void;
  onDuplicateSheet: (index: number) => void;
  onMoveSheet: (fromIndex: number, toIndex: number) => void;
  onSetColor: (index: number, color?: string) => void;
}

export const SheetTabs: React.FC<SheetTabsProps> = React.memo(function SheetTabs({
  workbook,
  onActiveSheetChange,
  onAddSheet,
  onRenameSheet,
  onCloseSheet,
  onDuplicateSheet,
  onMoveSheet,
  onSetColor,
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(
    null
  );
  const [colorPickerIndex, setColorPickerIndex] = useState<number | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingIndex !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingIndex]);

  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      setColorPickerIndex(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleStartRename = (index: number, currentName: string) => {
    setEditingIndex(index);
    setEditValue(currentName);
  };

  const handleCompleteRename = () => {
    if (editingIndex !== null) {
      if (editValue.trim() && editValue.trim() !== workbook.sheets[editingIndex].name) {
        onRenameSheet(editingIndex, editValue.trim());
      }
      setEditingIndex(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, index });
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const tabColors = [
    '#ef4444',
    '#f97316',
    '#f59e0b',
    '#10b981',
    '#06b6d4',
    '#3b82f6',
    '#6366f1',
    '#a855f7',
    '#ec4899',
    '#64748b',
  ];

  return (
    <div className="flex items-center bg-slate-900 border-t border-white/10 h-10 select-none relative z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      {/* Scroll Controls */}
      <button
        onClick={() => scroll('left')}
        className="h-full px-1 hover:bg-white/5 text-slate-500 hover:text-white transition-colors focus-visible:ring-2 focus-visible:outline-none"
        aria-label="Scroll tabs left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {/* Tabs Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 flex items-end h-full overflow-x-auto no-scrollbar scroll-smooth px-1 gap-0.5"
      >
        {workbook.sheets.map((sheet, index) => {
          const isActive = workbook.activeSheetIndex === index;
          return (
            <div
              key={sheet.id || index}
              onContextMenu={(e) => handleContextMenu(e, index)}
              onClick={() => onActiveSheetChange(index)}
              onDoubleClick={() => handleStartRename(index, sheet.name)}
              className={`
                group relative flex items-center h-full px-4 min-w-[120px] max-w-[200px]
                transition-all cursor-pointer border-r border-white/5
                ${
                  isActive
                    ? 'bg-slate-800 text-white z-20 shadow-[inset_0_-2px_0_var(--nexus-accent)]'
                    : 'bg-slate-900/50 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }
              `}
            >
              {/* Tab Color Indicator */}
              {sheet.tabColor && (
                <div
                  className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full"
                  style={{ backgroundColor: sheet.tabColor }}
                />
              )}

              {/* Active Marker */}
              {isActive && !sheet.tabColor && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]" />
              )}

              {editingIndex === index ? (
                <input
                  ref={editInputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleCompleteRename}
                  onKeyDown={(e) => e.key === 'Enter' && handleCompleteRename()}
                  className="bg-slate-700 text-white text-xs px-1 rounded border border-cyan-500 outline-none w-full h-6"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-xs font-medium truncate flex-1">{sheet.name}</span>
              )}

              {/* Close Button (Hidden by default, shown on hover or if active) */}
              {workbook.sheets.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseSheet(index);
                  }}
                  className={`
                    ml-2 p-0.5 rounded-md hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-all focus-visible:ring-2 focus-visible:outline-none focus-visible:opacity-100
                    ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                  `}
                  aria-label={`Close sheet ${sheet.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Sheet */}
      <div className="flex items-center px-1 border-l border-white/10 h-full">
        <button
          onClick={onAddSheet}
          className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-cyan-400 transition-all active:scale-95 focus-visible:ring-2 focus-visible:outline-none"
          title="Add new sheet"
          aria-label="Add new sheet"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="h-full px-1 hover:bg-white/5 text-slate-500 hover:text-white transition-colors focus-visible:ring-2 focus-visible:outline-none"
          aria-label="Scroll tabs right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-[100] bg-slate-800 border border-white/10 rounded-lg shadow-2xl py-1 w-48 animate-in fade-in zoom-in-95 duration-100 shadow-black"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              handleStartRename(contextMenu.index, workbook.sheets[contextMenu.index].name);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" /> Rename
          </button>
          <button
            onClick={() => {
              onDuplicateSheet(contextMenu.index);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Copy className="w-3.5 h-3.5" /> Duplicate
          </button>
          <div className="relative group/color">
            <button
              onMouseEnter={() => setColorPickerIndex(contextMenu.index)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Palette className="w-3.5 h-3.5" /> Tab Color
              </span>
              <ChevronRight className="w-3 h-3" />
            </button>

            {colorPickerIndex === contextMenu.index && (
              <div className="absolute left-full top-0 ml-1 p-2 bg-slate-800 border border-white/10 rounded-lg shadow-2xl w-40 grid grid-cols-5 gap-1 animate-in fade-in slide-in-from-left-1">
                <button
                  onClick={() => {
                    onSetColor(contextMenu.index, undefined);
                    setColorPickerIndex(null);
                    setContextMenu(null);
                  }}
                  className="col-span-5 text-[10px] text-slate-400 hover:text-white py-1 mb-1 border-b border-white/5"
                >
                  Reset Color
                </button>
                {tabColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onSetColor(contextMenu.index, color);
                      setColorPickerIndex(null);
                      setContextMenu(null);
                    }}
                    className="w-6 h-6 rounded-md border border-white/10 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-white/5 my-1" />

          <button
            onClick={() => {
              onCloseSheet(contextMenu.index);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
});
