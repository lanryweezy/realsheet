import React, { useState, useEffect, memo, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import { SheetData, CellValue, SelectionRange, FormattingRule, IconSetStyle } from '../types';
import { AlertCircle, Hash, Calendar, Type as TypeIcon, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical, Trash2, Edit2, Sparkles, Copy, XCircle, Calculator, MoveRight, MoveDown, PlusSquare, MinusSquare, MessageSquare, Eye, SplitSquareHorizontal, CopyMinus, PanelTopOpen, PanelLeftOpen, Scissors, Plus, Eraser, Filter } from 'lucide-react';
import { evaluateCellValue, indexToExcelCol } from '../services/formulaService';
import { evaluateWithHF, syncWorkbook } from '../services/hyperformulaService';
import { ToastType } from './Toast';
import { safeFilterEvaluate } from '../utils/safeFormulaParser';

// Virtual scrolling constants
const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 28;
const VISIBLE_ROWS_BUFFER = 5;
const EXPANSION_THRESHOLD = 5;

const COMMON_FUNCTIONS = [
  { name: 'SUM', description: 'Calculates the sum of a range of cells.', syntax: 'SUM(range)' },
  { name: 'AVERAGE', description: 'Calculates the average of a range of cells.', syntax: 'AVERAGE(range)' },
  { name: 'COUNT', description: 'Counts the number of cells that contain numbers.', syntax: 'COUNT(range)' },
  { name: 'MIN', description: 'Finds the minimum value in a range.', syntax: 'MIN(range)' },
  { name: 'MAX', description: 'Finds the maximum value in a range.', syntax: 'MAX(range)' },
  { name: 'IF', description: 'Returns one value if a condition is true and another if it is false.', syntax: 'IF(condition, value_if_true, value_if_false)' },
  { name: 'VLOOKUP', description: 'Looks for a value in the first column of a table.', syntax: 'VLOOKUP(value, table, col_index, [range_lookup])' },
  { name: 'CONCAT', description: 'Concatenates a list of strings.', syntax: 'CONCAT(text1, text2, ...)' },
  { name: 'UPPER', description: 'Converts text to uppercase.', syntax: 'UPPER(text)' },
  { name: 'LOWER', description: 'Converts text to lowercase.', syntax: 'LOWER(text)' },
  { name: 'LEN', description: 'Returns the number of characters in a string.', syntax: 'LEN(text)' },
  { name: 'ROUND', description: 'Rounds a number to a specified number of digits.', syntax: 'ROUND(number, num_digits)' },
  { name: 'TODAY', description: 'Returns the current date.', syntax: 'TODAY()' },
  { name: 'NOW', description: 'Returns the current date and time.', syntax: 'NOW()' },
];

const FormulaCopilot = ({
  query,
  onSelect,
  selectedIndex
}: {
  query: string,
  onSelect: (func: string) => void,
  selectedIndex: number
}) => {
  const searchTerm = query.replace('=', '').toUpperCase();
  const suggestions = useMemo(() => {
    return COMMON_FUNCTIONS.filter(f => f.name.startsWith(searchTerm)).slice(0, 5);
  }, [searchTerm]);

  if (suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-1 shadow-black/50">
      <div className="bg-slate-800/50 px-3 py-1.5 border-b border-white/5">
        <span className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest">Nexus Suggestions</span>
      </div>
      <div className="p-1">
        {suggestions.map((func, i) => (
          <div
            key={func.name}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect(func.name);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg transition-all cursor-pointer ${i === selectedIndex ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30' : 'text-slate-400 hover:bg-white/5'}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">{func.name}</span>
              <span className="text-[10px] opacity-40 font-mono italic">{func.syntax}</span>
            </div>
            <p className="text-[10px] leading-tight mt-0.5 opacity-60 line-clamp-1">{func.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

interface GridProps {
  data: SheetData;
  selectedRange: SelectionRange | null;
  onRangeSelect: (range: SelectionRange | null) => void;
  onCellEdit: (rowIndex: number, colKey: string, value: string) => void;
  onDeleteColumn: (colKey: string) => void;
  onRenameColumn: (oldKey: string, newKey: string) => void;
  onSmartFillTrigger: (colKey: string) => void;
  onAnalyzeRange: (range: SelectionRange) => void;
  onInsertRow: (index: number) => void;
  onDeleteRow: (index: number) => void;
  onInsertColumn: (index: number) => void;
  onClearRange: (range: SelectionRange) => void;
  onAddComment: (rowIndex: number, colIndex: number, text: string) => void;
  onAddWatch: (cellRef: string) => void;
  onNotify: (type: ToastType, title: string, message?: string) => void;
  onOpenDataTool: (mode: 'duplicates' | 'split' | 'find' | 'clean', colKey?: string) => void;
  onColumnResize: (colKey: string, width: number) => void;
  onSheetExpand: (rows: number, cols: number) => void;
  frozenPanes?: { rows: number, cols: number };
  isFormatPainterActive?: boolean;
  onFormatPainterApply?: (rowIndex: number, colKey: string) => void;
  highlightedCells?: Set<string>; // "row-col"
  onFillRange?: (sourceRange: SelectionRange, targetRange: SelectionRange) => void;
  onSortColumn?: (colKey: string, direction: 'asc' | 'desc') => void;
  onFilterChange?: (colKey: string, selectedValues: any[]) => void;
  activeFilters?: Record<string, any[]>;
  onUndo?: () => void;
  onRedo?: () => void;
}

type ColumnType = 'string' | 'number' | 'date';
type SortDirection = 'asc' | 'desc' | null;
interface SortConfig {
  key: string;
  direction: SortDirection;
}

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

const interpolateColor = (color1: string, color2: string, factor: number) => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + factor * (c2.r - c1.r));
  const g = Math.round(c1.g + factor * (c2.g - c1.g));
  const b = Math.round(c1.b + factor * (c2.b - c1.b));
  return `rgb(${r}, ${g}, ${b})`;
}

const inferColumnTypes = (data: SheetData): Record<string, ColumnType> => {
  const types: Record<string, ColumnType> = {};
  data.columns.forEach(col => {
    let isNumber = true;
    let nonEmptyCount = 0;
    for (let i = 0; i < data.rows.length; i++) {
      if (nonEmptyCount > 50) break;
      const val = data.rows[i][col];
      if (val === null || val === undefined || String(val).trim() === '') continue;
      nonEmptyCount++;
      const strVal = String(val).trim();
      if (isNumber) {
        if (isNaN(Number(strVal)) || strVal === '') isNumber = false;
      }
    }
    types[col] = nonEmptyCount === 0 ? 'string' : isNumber ? 'number' : 'string';
  });
  return types;
};

// Memoize the Cell component for better performance
const Cell = memo(({
  rowIndex,
  colIndex,
  col,
  value,
  displayValue,
  isSelected,
  isHeader,
  columnType,
  onCellEdit,
  onContextMenu,
  onDoubleClick
}: {
  rowIndex: number;
  colIndex: number;
  col: string;
  value: any;
  displayValue: any;
  isSelected: boolean;
  isHeader: boolean;
  columnType: string;
  onCellEdit: (rowIndex: number, col: string, value: string) => void;
  onContextMenu: (e: React.MouseEvent, rowIndex: number, colIndex: number, isHeader: boolean) => void;
  onDoubleClick: (rowIndex: number, colIndex: number) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDoubleClick = useCallback(() => {
    if (!isHeader) {
      setIsEditing(true);
      setEditValue(String(value ?? ''));
    }
    onDoubleClick(rowIndex, colIndex);
  }, [isHeader, value, rowIndex, colIndex, onDoubleClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (isEditing) {
        onCellEdit(rowIndex, col, editValue);
        setIsEditing(false);
      } else if (!isHeader) {
        setIsEditing(true);
        setEditValue(String(displayValue));
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }, [isEditing, isHeader, displayValue, rowIndex, col, editValue, onCellEdit]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing && !isHeader) {
    return (
      <td className={`border border-gray-300 p-0 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => {
            onCellEdit(rowIndex, col, editValue);
            setIsEditing(false);
          }}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-1 border-none outline-none"
        />
      </td>
    );
  }

  return (
    <td
      className={`border border-gray-300 p-1 text-xs relative ${isHeader ? 'bg-gray-100 font-semibold' : ''} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => onContextMenu(e, rowIndex, colIndex, isHeader)}
    >
      <div className="truncate" title={String(displayValue)}>
        {displayValue}
      </div>
      {columnType !== 'string' && !isHeader && (
        <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full opacity-60"></div>
      )}
    </td>
  );
});

Cell.displayName = 'Cell';

// Enhanced Cell component with better hover and selection states
const EnhancedCell = memo(({
  rowIndex,
  colIndex,
  col,
  value,
  displayValue,
  isSelected,
  isHeader,
  columnType,
  onCellEdit,
  onContextMenu,
  onDoubleClick,
  isInHoverRange,
  highlightedCells = new Set(),
  onFillStart,
}: {
  rowIndex: number;
  colIndex: number;
  col: string;
  value: any;
  displayValue: any;
  isSelected: boolean;
  isHeader: boolean;
  columnType: string;
  onCellEdit: (rowIndex: number, col: string, value: string) => void;
  onContextMenu: (e: React.MouseEvent, rowIndex: number, colIndex: number, isHeader: boolean) => void;
  onDoubleClick: (rowIndex: number, colIndex: number) => void;
  isInHoverRange?: boolean;
  highlightedCells?: Set<string>;
  onFillStart?: (e: React.MouseEvent) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Use pre-evaluated displayValue passed from parent

  const searchTerm = editValue.startsWith('=') ? editValue.replace('=', '').toUpperCase() : '';
  const filteredSuggestions = useMemo(() => {
    if (!searchTerm) return [];
    return COMMON_FUNCTIONS.filter(f => f.name.startsWith(searchTerm)).slice(0, 5);
  }, [searchTerm]);

  const handleSelectSuggestion = useCallback((funcName: string) => {
    setEditValue(`=${funcName}(`);
    setSelectedIndex(0);
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (!isHeader) {
      setIsEditing(true);
      setEditValue(String(value ?? ''));
    }
    onDoubleClick(rowIndex, colIndex);
  }, [isHeader, value, rowIndex, colIndex, onDoubleClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && filteredSuggestions.length > 0)) {
        e.preventDefault();
        handleSelectSuggestion(filteredSuggestions[selectedIndex].name);
        return;
      }
    }

    if (e.key === 'Enter') {
      if (isEditing) {
        onCellEdit(rowIndex, col, editValue);
        setIsEditing(false);
      } else if (!isHeader) {
        setIsEditing(true);
        setEditValue(String(value ?? ''));
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  }, [isEditing, isHeader, value, rowIndex, col, editValue, onCellEdit, filteredSuggestions, selectedIndex, handleSelectSuggestion]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing && !isHeader) {
    return (
      <div className={`w-full h-full flex items-center justify-center p-0 ${isSelected ? 'ring-2 ring-[var(--cell-selected-border)] relative z-20' : ''}`}>
        <div className="relative w-full h-full">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              setSelectedIndex(0);
            }}
            onBlur={() => {
              // Delay blur to allow suggestion clicking if possible
              setTimeout(() => {
                onCellEdit(rowIndex, col, editValue);
                setIsEditing(false);
              }, 150);
            }}
            onKeyDown={handleKeyDown}
            className="w-full h-full p-1 border-none outline-none focus:ring-1 focus:ring-nexus-accent rounded-sm bg-slate-800 text-white"
          />
          {editValue.startsWith('=') && (
            <FormulaCopilot
              query={editValue}
              onSelect={handleSelectSuggestion}
              selectedIndex={selectedIndex}
            />
          )}
        </div>
      </div>
    );
  }

  const isFormula = typeof value === 'string' && value.startsWith('=');
  const isError = typeof displayValue === 'string' && displayValue.startsWith('#');

  return (
    <div
      className={`
        w-full h-full flex flex-col justify-center border-none px-1 text-xs relative transition-all duration-150
        ${isHeader ? 'font-semibold bg-[var(--ribbon-bg)]' : ''}
        ${isSelected ? 'ring-2 ring-[var(--cell-selected-border)] bg-[var(--cell-hover-bg)]' : ''}
        ${!isSelected && !isHeader && isHovered ? 'bg-[var(--cell-hover-bg)]' : ''}
        ${!isSelected && !isHeader && isInHoverRange ? 'bg-[var(--cell-hover-bg)]' : ''}
        ${isFormula && !isEditing ? 'formula-glow' : ''}
        ${isError ? 'error-pulse' : ''}
        ${!isSelected && !isHeader && highlightedCells.has(`${rowIndex}-${colIndex}`) ? 'ring-2 ring-cyan-400/50 bg-cyan-400/10 animate-pulse' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => onContextMenu(e, rowIndex, colIndex, isHeader)}
      style={{
        color: isError ? 'var(--nexus-error, #ef4444)' : (isHeader ? 'var(--nexus-text-main)' : 'var(--nexus-text-main)'),
      }}
    >
      <div className={`truncate w-full ${isFormula && !isEditing ? 'text-cyan-400' : ''}`} title={String(displayValue)}>
        {displayValue}
      </div>
      {columnType !== 'string' && !isHeader && !isSelected && (
        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[var(--nexus-accent)] rounded-full opacity-60 m-0.5"></div>
      )}
      {isSelected && !isHeader && (
        <div
          className="absolute -bottom-[4px] -right-[4px] w-2 h-2 bg-cyan-400 border border-slate-900 rounded-sm z-30 cursor-crosshair ring-2 ring-cyan-500/30 hover:scale-120 transition-transform shadow-[0_0_10px_rgba(34,211,238,0.5)] pointer-events-auto"
          onMouseDown={onFillStart}
        />
      )}
    </div>
  );
});

EnhancedCell.displayName = 'EnhancedCell';

const Grid: React.FC<GridProps> = ({
  data,
  selectedRange,
  onRangeSelect,
  onCellEdit,
  onDeleteColumn,
  onRenameColumn,
  onSmartFillTrigger,
  onAnalyzeRange,
  onInsertRow,
  onDeleteRow,
  onInsertColumn,
  onClearRange,
  onAddComment,
  onAddWatch,
  onNotify,
  onOpenDataTool,
  onColumnResize,
  onSheetExpand,
  frozenPanes,
  onFormatPainterApply,
  highlightedCells,
  onFillRange,
  onSortColumn,
  onFilterChange,
  activeFilters,
  onUndo,
  onRedo,
  isFormatPainterActive = false,
}) => {
  const isMobile = window.innerWidth < 768;
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [containerWidth, setContainerWidth] = useState(800);
  const [hoverCell, setHoverCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);

  // Sync with HyperFormula Core
  useEffect(() => {
    if (data) {
      syncWorkbook(data);
    }
  }, [data]);

  // Use frozen panes from props or default to 0
  const frozenRows = frozenPanes?.rows || 0;
  const frozenCols = frozenPanes?.cols || 0;

  // Optimize cell sizing for mobile (moved before it's used)
  const getCellWidth = (col: string) => {
    const defaultWidth = 100;
    return data.columnWidths?.[col] || defaultWidth;
  };

  // Calculate visible range for virtual scrolling
  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - VISIBLE_ROWS_BUFFER);
    const endRow = Math.min(
      data.rows.length,
      startRow + Math.ceil(containerHeight / ROW_HEIGHT) + VISIBLE_ROWS_BUFFER * 2
    );

    // Calculate visible columns
    let startCol = 0;
    let accumulatedWidth = 0;
    const colWidths = data.columns.map(col => getCellWidth(col));

    // Find starting column
    for (let i = 0; i < colWidths.length; i++) {
      if (accumulatedWidth + colWidths[i] > scrollLeft) {
        startCol = Math.max(0, i - 2); // Buffer of 2 columns
        break;
      }
      accumulatedWidth += colWidths[i];
    }

    // Find ending column
    let endCol = colWidths.length;
    accumulatedWidth = 0;
    for (let i = 0; i < colWidths.length; i++) {
      accumulatedWidth += colWidths[i];
      if (accumulatedWidth > scrollLeft + containerWidth) {
        endCol = Math.min(colWidths.length, i + 2); // Buffer of 2 columns
        break;
      }
    }

    return {
      startRow,
      endRow,
      startCol,
      endCol,
      colWidths
    };
  }, [scrollTop, scrollLeft, containerHeight, containerWidth, data.rows.length, data.columns, getCellWidth]);

  // Check if we need to expand the sheet
  useEffect(() => {
    const { startRow, endRow, startCol, endCol } = visibleRange;
    const totalRows = data.rows.length;
    const totalCols = data.columns.length;

    let shouldExpand = false;
    let targetRows = totalRows;
    let targetCols = totalCols;

    // Check if we're near the bottom
    if (totalRows - endRow <= EXPANSION_THRESHOLD) {
      targetRows = Math.min(totalRows + 100, 10000); // Expand by 100, max 10000
      shouldExpand = true;
    }

    // Check if we're near the right edge
    if (totalCols - endCol <= EXPANSION_THRESHOLD) {
      targetCols = Math.min(totalCols + 26, 17576); // Expand by 26 columns, max AAA
      shouldExpand = true;
    }

    if (shouldExpand && onSheetExpand) {
      onSheetExpand(targetRows, targetCols);
    }
  }, [visibleRange, data.rows.length, data.columns.length, onSheetExpand]);

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
    setScrollLeft(e.currentTarget.scrollLeft);
  }, []);

  // Measure container dimensions
  useLayoutEffect(() => {
    if (gridContainerRef.current) {
      setContainerHeight(gridContainerRef.current.clientHeight);
      setContainerWidth(gridContainerRef.current.clientWidth);
    }
  }, []);

  // Update container dimensions dynamically using ResizeObserver
  useEffect(() => {
    if (!gridContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect) {
          setContainerHeight(entry.contentRect.height);
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(gridContainerRef.current);
    return () => observer.disconnect();
  }, []);

  const columnTypes = useMemo(() => inferColumnTypes(data), [data]);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [activeMenuColumn, setActiveMenuColumn] = useState<string | null>(null);
  const [editingColumnName, setEditingColumnName] = useState<string | null>(null);
  const [tempColName, setTempColName] = useState('');

  // Selection & Editing State
  const [isDragging, setIsDragging] = useState(false);
  const [editingCell, setEditingCell] = useState<{ r: number, c: number } | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'cell' | 'header', target?: any } | null>(null);

  // Floating Quick Action Bar State
  const [quickActionCoords, setQuickActionCoords] = useState<{ x: number, y: number } | null>(null);

  // Resizing State
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  // Fill Handle State
  const [isFilling, setIsFilling] = useState(false);
  const [fillRange, setFillRange] = useState<SelectionRange | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuColumn(null);
      }
      if (contextMenu && !(event.target as HTMLElement).closest('.context-menu')) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingCell) return; // Don't navigate if editing
      if (editingColumnName) return; // Don't navigate if renaming column
      if (!selectedRange) return;

      const { start, end } = selectedRange;

      let newRow = end.rowIndex;
      let newCol = end.colIndex;
      let isShift = e.shiftKey;

      if (e.key === 'ArrowUp') newRow--;
      else if (e.key === 'ArrowDown') newRow++;
      else if (e.key === 'ArrowLeft') newCol--;
      else if (e.key === 'ArrowRight') newCol++;
      else if (e.key === 'Tab') {
        e.preventDefault();
        newCol++;
        isShift = false; // Tab always moves start/end together for this simple impl
      } else if (e.key === 'Enter') {
        e.preventDefault();
        newRow++;
        isShift = false;
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        onClearRange(selectedRange);
        return;
      } else {
        return; // Not a navigation key
      }

      // Bounds check
      newRow = Math.max(0, Math.min(newRow, data.rows.length - 1));
      newCol = Math.max(0, Math.min(newCol, data.columns.length - 1));

      if (isShift) {
        onRangeSelect({ start, end: { rowIndex: newRow, colIndex: newCol } });
      } else {
        onRangeSelect({ start: { rowIndex: newRow, colIndex: newCol }, end: { rowIndex: newRow, colIndex: newCol } });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRange, editingCell, editingColumnName, data.rows.length, data.columns.length, onRangeSelect, onClearRange]);

  // --- Logic for Drag Selection ---
  const handleMouseDown = (rowIndex: number, colIndex: number) => {
    if (contextMenu) setContextMenu(null);
    if (editingCell) setEditingCell(null);

    if (isFormatPainterActive && onFormatPainterApply) {
      onFormatPainterApply(rowIndex, data.columns[colIndex]);
      onRangeSelect({
        start: { rowIndex, colIndex },
        end: { rowIndex, colIndex }
      });
      return;
    }

    setIsDragging(true);
    onRangeSelect({
      start: { rowIndex, colIndex },
      end: { rowIndex, colIndex }
    });
  };

  const handleMouseEnter = (rowIndex: number, colIndex: number) => {
    if (isDragging && selectedRange) {
      onRangeSelect({
        ...selectedRange,
        end: { rowIndex, colIndex }
      });
    } else if (isFilling && selectedRange) {
      // Determine the bounding box that includes original selection and current cell
      const s = selectedRange.start;
      const e = selectedRange.end;

      const rMin = Math.min(s.rowIndex, e.rowIndex, rowIndex);
      const rMax = Math.max(s.rowIndex, e.rowIndex, rowIndex);
      const cMin = Math.min(s.colIndex, e.colIndex, colIndex);
      const cMax = Math.max(s.colIndex, e.colIndex, colIndex);

      setFillRange({
        start: { rowIndex: rMin, colIndex: cMin },
        end: { rowIndex: rMax, colIndex: cMax }
      });
    }
  };

  const handleMouseUp = () => {
    // If not handled by global listener, this acts as a failsafe
    if (isFilling && selectedRange && fillRange && onFillRange) {
      onFillRange(selectedRange, fillRange);
    }
    setIsDragging(false);
    setIsFilling(false);
    setFillRange(null);
  };

  const handleFillStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedRange) return;
    setIsFilling(true);
    setFillRange(selectedRange);
  };

  // --- Resizing Logic ---
  const handleResizeStart = (e: React.MouseEvent, col: string) => {
    e.preventDefault();
    e.stopPropagation();
    const currentWidth = data.columnWidths?.[col] || 120;
    setResizingCol(col);
    setResizeStartX(e.clientX);
    setResizeStartWidth(currentWidth);
  };

  useEffect(() => {
    if (!resizingCol) return;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientX - resizeStartX;
      const newWidth = Math.max(50, resizeStartWidth + diff);
      onColumnResize(resizingCol, newWidth);
    };

    const handleMouseUp = () => {
      setResizingCol(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingCol, resizeStartX, resizeStartWidth, onColumnResize]);


  // Add global mouse up to stop dragging/filling if mouse leaves grid
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) setIsDragging(false);

      if (isFilling) {
        if (selectedRange && fillRange && onFillRange) {
          onFillRange(selectedRange, fillRange);
        }
        setIsFilling(false);
        setFillRange(null);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDragging, isFilling, selectedRange, fillRange, onFillRange]);

  // Floating AI Quick Action Bar Positioning
  useEffect(() => {
    if (!selectedRange || isDragging || editingCell || contextMenu || editingColumnName) {
      setQuickActionCoords(null);
      return;
    }

    const updateCoords = () => {
      const tr = Math.max(selectedRange.start.rowIndex, selectedRange.end.rowIndex);
      const tc = Math.max(selectedRange.start.colIndex, selectedRange.end.colIndex);

      const el = document.querySelector(`td[data-row="${tr}"][data-col="${tc}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setQuickActionCoords({
          x: rect.right,
          y: rect.bottom
        });
      } else {
        setQuickActionCoords(null);
      }
    };

    // Fast timeout to allow DOM to commit
    const timer = setTimeout(updateCoords, 10);
    return () => clearTimeout(timer);
  }, [selectedRange, isDragging, editingCell, contextMenu, editingColumnName, scrollTop, scrollLeft]);

  const getRangeRect = (range: SelectionRange) => {
    const s = range.start;
    const e = range.end;
    const rStart = Math.min(s.rowIndex, e.rowIndex);
    const rEnd = Math.max(s.rowIndex, e.rowIndex);
    const cStart = Math.min(s.colIndex, e.colIndex);
    const cEnd = Math.max(s.colIndex, e.colIndex);

    let top = HEADER_HEIGHT + rStart * ROW_HEIGHT;
    let height = (rEnd - rStart + 1) * ROW_HEIGHT;
    let left = isMobile ? 40 : 50;
    for (let c = 0; c < cStart; c++) {
      left += getCellWidth(data.columns[c]);
    }
    let width = 0;
    for (let c = cStart; c <= cEnd; c++) {
      width += getCellWidth(data.columns[c]);
    }
    return { top, left, width, height };
  };

  const handleContextMenu = (e: React.MouseEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    const isInRange = selectedRange &&
      rowIndex >= Math.min(selectedRange.start.rowIndex, selectedRange.end.rowIndex) &&
      rowIndex <= Math.max(selectedRange.start.rowIndex, selectedRange.end.rowIndex) &&
      colIndex >= Math.min(selectedRange.start.colIndex, selectedRange.end.colIndex) &&
      colIndex <= Math.max(selectedRange.start.colIndex, selectedRange.end.colIndex);

    if (!isInRange) {
      onRangeSelect({
        start: { rowIndex, colIndex },
        end: { rowIndex, colIndex }
      });
    }
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'cell' });
  };

  const handleHeaderContextMenu = (e: React.MouseEvent, col: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, type: 'header', target: col });
  }

  // --- Sorting & Filtering ---

  const visibleRows = useMemo(() => {
    let rows = data.rows.map((row, index) => ({ row, index }));

    // Apply Filter if exists
    if (data.filter && data.filter.code) {
      try {
        // Safe filter execution using safeFilterEvaluate
        rows = rows.filter(({ row }) => {
          try {
            // Extract the first value from the row for simple evaluation
            const firstValue = Object.values(row)[0] as number | string;
            return safeFilterEvaluate(data.filter!.code, firstValue);
          } catch {
            return false;
          }
        });
      } catch (e) {
        console.error("Filter error", e);
      }
    }

    // Apply Sort
    if (!sortConfig || !sortConfig.direction) {
      return rows;
    }
    const { key, direction } = sortConfig;
    const type = columnTypes[key];

    return rows.sort((a, b) => {
      const valA = a.row[key];
      const valB = b.row[key];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      let comparison = 0;
      if (type === 'number') {
        comparison = Number(valA) - Number(valB);
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }
      return direction === 'asc' ? comparison : -comparison;
    });
  }, [data.rows, data.filter, sortConfig, columnTypes]);

  // --- Formatting ---
  const columnStats = useMemo(() => {
    const stats: Record<string, { min: number, max: number }> = {};
    data.columns.forEach(col => {
      let min = Infinity;
      let max = -Infinity;
      data.rows.forEach(row => {
        const val = Number(row[col]);
        if (!isNaN(val) && row[col] !== null && row[col] !== "") {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      });
      if (min !== Infinity) stats[col] = { min, max };
    });
    return stats;
  }, [data]);

  // Optimization: Group rules by column
  const rulesByColumn = useMemo(() => {
    const map: Record<string, FormattingRule[]> = {};
    if (data.formattingRules) {
      data.formattingRules.forEach(rule => {
        if (!map[rule.column]) map[rule.column] = [];
        map[rule.column].push(rule);
      });
    }
    return map;
  }, [data.formattingRules]);

  const getIconForValue = (percentile: number, style: IconSetStyle): string => {
    if (percentile >= 2 / 3) return style === 'traffic' ? '🟢' : style === 'flags' ? '🔴' : style === 'dots' ? '●' : '↑';
    if (percentile >= 1 / 3) return style === 'traffic' ? '🟡' : style === 'flags' ? '🟡' : style === 'dots' ? '●' : '→';
    return style === 'traffic' ? '🔴' : style === 'flags' ? '🟢' : style === 'dots' ? '○' : '↓';
  };

  const getFormattingStyle = (col: string, value: CellValue) => {
    const rules = rulesByColumn[col];
    if (!rules || value === null || value === '') return {};

    let computedStyle: React.CSSProperties = {};
    let barWidth: number | undefined = undefined;
    let barColor: string | undefined = undefined;
    let iconSet: string | undefined = undefined;

    const numValue = Number(value);
    const strValue = String(value).toLowerCase();
    const stats = columnStats[col];

    rules.forEach(rule => {
      try {
        if (rule.type === 'colorScale' && stats) {
          const { min, max } = stats;
          if (min !== max) {
            const factor = Math.min(1, Math.max(0, (numValue - min) / (max - min)));
            const colors = rule.scaleColors || ['#ffffff', '#22d3ee'];
            computedStyle.backgroundColor = interpolateColor(colors[0], colors[1], factor);
          }
        } else if (rule.type === 'dataBar' && stats) {
          const { min, max } = stats;
          const range = max - Math.min(0, min);
          if (range !== 0) {
            barWidth = Math.min(100, Math.max(0, ((numValue - Math.min(0, min)) / range) * 100));
            barColor = rule.barColor || '#22d3ee';
          }
        } else if (rule.type === 'iconSet' && stats && !isNaN(numValue)) {
          const { min, max } = stats;
          const range = max - min;
          const percentile = range === 0 ? 1 : (numValue - min) / range;
          iconSet = getIconForValue(percentile, rule.iconSetStyle || 'arrows');
        } else if (rule.type === 'greaterThan' && !isNaN(numValue) && numValue > Number(rule.value1)) {
          computedStyle = { ...computedStyle, backgroundColor: rule.style?.backgroundColor, color: rule.style?.textColor };
        } else if (rule.type === 'lessThan' && !isNaN(numValue) && numValue < Number(rule.value1)) {
          computedStyle = { ...computedStyle, backgroundColor: rule.style?.backgroundColor, color: rule.style?.textColor };
        } else if (rule.type === 'equals' && String(value) === String(rule.value1)) {
          computedStyle = { ...computedStyle, backgroundColor: rule.style?.backgroundColor, color: rule.style?.textColor };
        } else if (rule.type === 'containsText' && strValue.includes(String(rule.value1).toLowerCase())) {
          computedStyle = { ...computedStyle, backgroundColor: rule.style?.backgroundColor, color: rule.style?.textColor };
        }
      } catch (e) { }
    });
    return { style: computedStyle, dataBarWidth: barWidth, dataBarColor: barColor, iconSet };
  };

  const handleHeaderClick = (col: string) => {
    setSortConfig(current => {
      if (!current || current.key !== col) return { key: col, direction: 'asc' };
      if (current.direction === 'asc') return { key: col, direction: 'desc' };
      return null;
    });
  };

  const handleColumnRenameSubmit = () => {
    if (editingColumnName && tempColName.trim() && tempColName !== editingColumnName) {
      onRenameColumn(editingColumnName, tempColName);
    }
    setEditingColumnName(null);
  };

  // Determine if a cell is in the selected range
  const isCellInRange = (rowIdx: number, colIdx: number) => {
    if (!selectedRange) return false;
    const { start, end } = selectedRange;
    const minRow = Math.min(start.rowIndex, end.rowIndex);
    const maxRow = Math.max(start.rowIndex, end.rowIndex);
    const minCol = Math.min(start.colIndex, end.colIndex);
    const maxCol = Math.max(start.colIndex, end.colIndex);
    return rowIdx >= minRow && rowIdx <= maxRow && colIdx >= minCol && colIdx <= maxCol;
  };

  const isCellSelected = (rowIdx: number, colIdx: number) => {
    if (!selectedRange) return false;
    if (selectedRange.start.rowIndex === selectedRange.end.rowIndex &&
      selectedRange.start.colIndex === selectedRange.end.colIndex) {
      // Single cell selection
      return selectedRange.start.rowIndex === rowIdx && selectedRange.start.colIndex === colIdx;
    }
    return isCellInRange(rowIdx, colIdx);
  };

  const isRowSelected = (rowIdx: number) => {
    if (!selectedRange) return false;
    const { start, end } = selectedRange;
    return rowIdx >= Math.min(start.rowIndex, end.rowIndex) &&
      rowIdx <= Math.max(start.rowIndex, end.rowIndex);
  };

  const isColSelected = (colIdx: number) => {
    if (!selectedRange) return false;
    const { start, end } = selectedRange;
    return colIdx >= Math.min(start.colIndex, end.colIndex) &&
      colIdx <= Math.max(start.colIndex, end.colIndex);
  };

  const handleAddCommentAction = () => {
    if (!selectedRange) return;
    const comment = prompt("Enter comment:");
    if (comment) {
      onAddComment(selectedRange.start.rowIndex, selectedRange.start.colIndex, comment);
    }
    setContextMenu(null);
  };

  const handleAddWatchAction = () => {
    if (!selectedRange) return;
    // Convert to reference string e.g. A1
    const cellRef = `${indexToExcelCol(selectedRange.start.colIndex)}${selectedRange.start.rowIndex + 1}`;
    onAddWatch(cellRef);
    setContextMenu(null);
  };

  const handleCopy = useCallback(() => {
    if (!selectedRange) return;
    const { start, end } = selectedRange;
    const minRow = Math.min(start.rowIndex, end.rowIndex);
    const maxRow = Math.max(start.rowIndex, end.rowIndex);
    const minCol = Math.min(start.colIndex, end.colIndex);
    const maxCol = Math.max(start.colIndex, end.colIndex);

    let tsv = '';
    for (let r = minRow; r <= maxRow; r++) {
      const rowValues = [];
      for (let c = minCol; c <= maxCol; c++) {
        const colKey = data.columns[c];
        rowValues.push(data.rows[r][colKey] ?? '');
      }
      tsv += rowValues.join('\t') + (r === maxRow ? '' : '\n');
    }

    navigator.clipboard.writeText(tsv);
    onNotify?.('Copied to clipboard', 'info');
    setContextMenu(null);
  }, [selectedRange, data, onNotify]);

  const handleCut = useCallback(() => {
    handleCopy();
    if (selectedRange) onClearRange(selectedRange);
    onNotify?.('Cut to clipboard', 'info');
    setContextMenu(null);
  }, [handleCopy, selectedRange, onClearRange, onNotify]);

  const handlePaste = useCallback(async () => {
    if (!selectedRange) return;
    try {
      const text = await navigator.clipboard.readText();
      const lines = text.trim().split(/\r?\n/);
      const startRow = Math.min(selectedRange.start.rowIndex, selectedRange.end.rowIndex);
      const startCol = Math.min(selectedRange.start.colIndex, selectedRange.end.colIndex);

      lines.forEach((line, rIdx) => {
        const cells = line.split('\t');
        cells.forEach((cell, cIdx) => {
          const targetRow = startRow + rIdx;
          const targetColIdx = startCol + cIdx;
          if (targetRow < data.rows.length && targetColIdx < data.columns.length) {
            onCellEdit(targetRow, data.columns[targetColIdx], cell);
          }
        });
      });
      onNotify?.('Pasted from clipboard', 'info');
    } catch (err) {
      onNotify?.('Failed to paste', 'error');
    }
    setContextMenu(null);
  }, [selectedRange, data, onCellEdit, onNotify]);

  const handleClear = useCallback(() => {
    if (selectedRange) onClearRange(selectedRange);
    setContextMenu(null);
  }, [selectedRange, onClearRange]);

  const handleInsertRowAction = useCallback(() => {
    if (selectedRange) onInsertRow(Math.min(selectedRange.start.rowIndex, selectedRange.end.rowIndex));
    setContextMenu(null);
  }, [selectedRange, onInsertRow]);

  const handleDeleteRowAction = useCallback(() => {
    if (selectedRange) onDeleteRow(Math.min(selectedRange.start.rowIndex, selectedRange.end.rowIndex));
    setContextMenu(null);
  }, [selectedRange, onDeleteRow]);

  const handleInsertColAction = useCallback(() => {
    if (selectedRange) onInsertColumn(Math.min(selectedRange.start.colIndex, selectedRange.end.colIndex));
    setContextMenu(null);
  }, [selectedRange, onInsertColumn]);

  const handleDeleteColAction = useCallback(() => {
    if (selectedRange) onDeleteColumn(data.columns[Math.min(selectedRange.start.colIndex, selectedRange.end.colIndex)]);
    setContextMenu(null);
  }, [selectedRange, data.columns, onDeleteColumn]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if editing a cell
      if (editingCell) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'c':
            if (selectedRange) {
              e.preventDefault();
              handleCopy();
            }
            break;
          case 'x':
            if (selectedRange) {
              e.preventDefault();
              handleCut();
            }
            break;
          case 'v':
            e.preventDefault();
            handlePaste();
            break;
          case 'y':
            e.preventDefault();
            onRedo?.();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) onRedo?.();
            else onUndo?.();
            break;
          case 'a':
            e.preventDefault();
            onRangeSelect({ start: { rowIndex: 0, colIndex: 0 }, end: { rowIndex: data.rows.length - 1, colIndex: data.columns.length - 1 } });
            break;
          case 'plus':
          case '=':
            if (selectedRange) {
              e.preventDefault();
              handleInsertRowAction();
            }
            break;
          case '-':
            if (selectedRange) {
              e.preventDefault();
              handleDeleteRowAction();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedRange, editingCell, handleCopy, handleCut, handlePaste, handleInsertRowAction, handleDeleteRowAction]);

  const handleCellDoubleClick = useCallback((rowIndex: number, colIndex: number) => {
    // Handle cell double click logic here
    // This could be used for cell selection or other actions
    console.log('Cell double clicked:', rowIndex, colIndex);
  }, []);

  // Extract trend data for Sparkline
  const selectionTrendData = useMemo(() => {
    if (!selectedRange) return null;
    const { start, end } = selectedRange;
    const minRow = Math.min(start.rowIndex, end.rowIndex);
    const maxRow = Math.max(start.rowIndex, end.rowIndex);
    const minCol = Math.min(start.colIndex, end.colIndex);
    const maxCol = Math.max(start.colIndex, end.colIndex);

    const dataPoints: number[] = [];
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const val = Number(evaluateCellValue(data.rows[r][data.columns[c]], data.rows, data.columns));
        if (!isNaN(val)) dataPoints.push(val);
      }
    }
    return dataPoints.length > 1 ? dataPoints : null;
  }, [selectedRange, data]);

  // Total width of all columns for the spacer
  const totalContentWidth = useMemo(() => {
    return data.columns.reduce((acc, col) => acc + getCellWidth(col), 0) + (isMobile ? 40 : 50);
  }, [data.columns, getCellWidth, isMobile]);

  return (
    <div
      ref={gridContainerRef}
      className="w-full h-full overflow-auto relative select-none grid-container"
      onScroll={handleScroll}
    >
      {/* Spacer div to maintain scroll height for virtual row scrolling */}
      <div
        style={{
          height: data.rows.length * ROW_HEIGHT + HEADER_HEIGHT,
          width: totalContentWidth,
          position: 'relative'
        }}
      >
        {/* Table with sticky header — NO absolute positioning */}
        <table
          className="data-grid-table border-collapse"
          style={{
            tableLayout: 'fixed',
            width: totalContentWidth,
            position: 'sticky',
            top: 0,
          }}
        >
          {/* Column widths via colgroup */}
          <colgroup>
            <col style={{ width: isMobile ? '40px' : '50px' }} />
            {data.columns.map(col => (
              <col key={col} style={{ width: `${getCellWidth(col)}px` }} />
            ))}
          </colgroup>

          {/* Sticky Header Row */}
          <thead className="sticky top-0 z-20">
            <tr>
              {/* Row Number Header */}
              <th
                className="index-col bg-slate-900 border-b border-r border-slate-600/50 text-center cursor-pointer hover:bg-slate-800 transition-colors"
                style={{ height: HEADER_HEIGHT }}
                onClick={() => onRangeSelect({ start: { rowIndex: 0, colIndex: 0 }, end: { rowIndex: data.rows.length - 1, colIndex: data.columns.length - 1 } })}
              >
                <div className="flex items-center justify-center h-full">
                  <Hash className="w-3.5 h-3.5 text-slate-500" />
                </div>
              </th>

              {/* All Column Headers */}
              {data.columns.map((col, colIdx) => {
                const width = getCellWidth(col);
                return (
                  <th
                    key={col}
                    className={`bg-slate-900 border-b border-r border-slate-600/50 text-left whitespace-nowrap overflow-hidden transition-colors group cursor-pointer ${isColSelected(colIdx) ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'hover:bg-slate-800/80 text-slate-400'}`}
                    style={{
                      height: HEADER_HEIGHT,
                      fontSize: isMobile ? '11px' : '12px',
                    }}
                    onClick={() => onRangeSelect({ start: { rowIndex: 0, colIndex: colIdx }, end: { rowIndex: data.rows.length - 1, colIndex: colIdx } })}
                  >
                    <div className="flex items-center justify-between h-full px-2">
                      <span className="truncate flex-1 font-semibold" title={col}>
                        {col}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {activeFilters?.[col] ? (
                          <Filter className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <div className="header-icon-dimmed p-1 rounded hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div
                          className="absolute inset-0 cursor-pointer"
                          onClick={() => onRangeSelect({ start: { rowIndex: 0, colIndex: colIdx }, end: { rowIndex: data.rows.length - 1, colIndex: colIdx } })}
                        />
                        <div
                          className="relative z-10 p-0.5 hover:bg-slate-700 rounded transition-all opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setContextMenu({ x: rect.left, y: rect.bottom + 4, type: 'header' });
                            setActiveMenuColumn(col);
                          }}
                        >
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </div>
                      {/* Resize Handle */}
                      <div
                        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-cyan-400/50 transition-colors z-20"
                        onMouseDown={(e) => handleResizeStart(e, col)}
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Data Rows — only render visible rows for performance */}
          <tbody>
            {/* Top spacer to account for rows above the visible window */}
            {visibleRange.startRow > 0 && (
              <tr style={{ height: visibleRange.startRow * ROW_HEIGHT }}>
                <td colSpan={data.columns.length + 1} />
              </tr>
            )}

            {data.rows.slice(visibleRange.startRow, visibleRange.endRow).map((row, rowIndexInSlice) => {
              const rowIndex = visibleRange.startRow + rowIndexInSlice;

              return (
                <tr key={rowIndex} style={{ height: ROW_HEIGHT }} className="group/row">
                  {/* Row Number */}
                  <td
                    className={`index-col sticky left-0 z-10 bg-slate-900 border-b border-r border-slate-700/50 text-center cursor-pointer transition-colors ${isRowSelected(rowIndex) ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'hover:bg-slate-800 text-slate-500'}`}
                    style={{ fontSize: isMobile ? '10px' : '11px', height: ROW_HEIGHT }}
                    onClick={() => onRangeSelect({ start: { rowIndex, colIndex: 0 }, end: { rowIndex, colIndex: data.columns.length - 1 } })}
                  >
                    {rowIndex + 1}
                  </td>

                  {/* ALL Data Cells — no column slicing */}
                  {data.columns.map((col, colIdx) => {
                    const rawVal = row[col];
                    const displayVal = evaluateWithHF(rawVal, rowIndex, col, data);

                    // Visionary Ghost Value Logic
                    const isNextToFill = !rawVal && rowIndex > 0 && data.rows[rowIndex - 1][col];
                    const ghostValue = isNextToFill ? "Predicting..." : null;

                    const { style: conditionalStyle, dataBarWidth, dataBarColor, iconSet } = getFormattingStyle(col, displayVal);
                    const cellStyle = data.cellStyles?.[`${rowIndex}-${col}`] || {};
                    const style = { ...conditionalStyle, ...cellStyle };
                    const isSelected = isCellSelected(rowIndex, colIdx);

                    const isInHoverRange = hoverCell && (
                      hoverCell.rowIndex === rowIndex || hoverCell.colIndex === colIdx
                    );

                    const handleCellClick = () => {
                      if (isFormatPainterActive && onFormatPainterApply) {
                        onFormatPainterApply(rowIndex, col);
                      }
                    };

                    return (
                      <td
                        key={`${rowIndex}-${colIdx}`}
                        data-row={rowIndex}
                        data-col={colIdx}
                        className={`p-0 border-b border-r border-slate-700/30 overflow-hidden relative ${isFormatPainterActive ? 'cursor-crosshair hover:bg-nexus-accent/10' : ''}`}
                        onClick={handleCellClick}
                        onMouseDown={() => handleMouseDown(rowIndex, colIdx)}
                        onMouseEnter={() => {
                          handleMouseEnter(rowIndex, colIdx);
                          setHoverCell({ rowIndex, colIndex: colIdx });
                        }}
                        onMouseLeave={() => setHoverCell(null)}
                        onMouseUp={handleMouseUp}
                        style={{
                          fontSize: isMobile ? '11px' : '13px',
                          height: ROW_HEIGHT,
                          ...style
                        }}
                      >
                        {dataBarWidth != null && dataBarColor && (
                          <div className="absolute inset-y-0 left-0 flex items-center px-1 z-0" style={{ width: '100%' }}>
                            <div className="h-4 rounded-full overflow-hidden" style={{ width: `${dataBarWidth}%`, backgroundColor: dataBarColor, opacity: 0.35, minWidth: 2 }} />
                          </div>
                        )}
                        <div className="relative z-10 flex items-center gap-1 min-h-full">
                          {iconSet && <span className="text-sm shrink-0">{iconSet}</span>}
                          {ghostValue && <span className="ghost-value text-xs pl-2">{ghostValue}</span>}
                          <EnhancedCell
                            rowIndex={rowIndex}
                            colIndex={colIdx}
                            col={col}
                            value={rawVal}
                            displayValue={displayVal}
                            isSelected={isSelected}
                            isHeader={false}
                            columnType={columnTypes[col] || 'string'}
                            onCellEdit={onCellEdit}
                            onContextMenu={handleContextMenu}
                            onDoubleClick={handleCellDoubleClick}
                            isInHoverRange={isInHoverRange}
                            highlightedCells={highlightedCells}
                            onFillStart={handleFillStart}
                          />
                        </div>
                        {isMobile && isSelected && (
                          <div className="absolute inset-0 bg-nexus-accent/10 pointer-events-none rounded-sm" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Bottom spacer for rows below the visible window */}
            {visibleRange.endRow < data.rows.length && (
              <tr style={{ height: (data.rows.length - visibleRange.endRow) * ROW_HEIGHT }}>
                <td colSpan={data.columns.length + 1} />
              </tr>
            )}
          </tbody>
        </table>
      </div>


      {/* Header Context Menu */}
      {activeMenuColumn && (
        <div
          className="fixed z-[100] bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden p-1 min-w-[220px] animate-in fade-in zoom-in-95"
          style={{
            top: contextMenu?.y ?? 100,
            left: contextMenu?.x ?? 200,
          }}
          ref={menuRef}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-white/5 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-mono text-cyan-400/70 uppercase tracking-widest">Column Options</span>
            <button onClick={() => setActiveMenuColumn(null)} className="text-slate-500 hover:text-white transition-colors"><XCircle className="w-3.5 h-3.5" /></button>
          </div>
          <button
            onClick={() => { onSortColumn?.(activeMenuColumn, 'asc'); setActiveMenuColumn(null); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5 hover:text-white rounded-lg transition-all group/item"
          >
            <ArrowUp className="w-4 h-4 text-emerald-400 group-hover/item:scale-110 transition-transform" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Sort A to Z</span>
              <span className="text-[10px] text-slate-500">Ascending order</span>
            </div>
          </button>
          <button
            onClick={() => { onSortColumn?.(activeMenuColumn, 'desc'); setActiveMenuColumn(null); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-200 hover:bg-white/5 hover:text-white rounded-lg transition-all group/item"
          >
            <ArrowDown className="w-4 h-4 text-amber-400 group-hover/item:scale-110 transition-transform" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Sort Z to A</span>
              <span className="text-[10px] text-slate-500">Descending order</span>
            </div>
          </button>
          <div className="h-px bg-white/5 my-1.5 mx-2" />

          {/* Filtering Section */}
          <div className="px-3 py-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
              <span>Filter Values</span>
              {activeFilters?.[activeMenuColumn] !== undefined && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterChange?.(activeMenuColumn, null);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 transition-colors text-[9px]"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1 pr-1">
              {Array.from(new Set(data.rows.map(r => r[activeMenuColumn])))
                .filter(val => val !== undefined && val !== null)
                .sort()
                .map(val => {
                  const valStr = String(val);
                  const isSelected = activeFilters?.[activeMenuColumn] !== undefined
                    ? activeFilters[activeMenuColumn].includes(val)
                    : true;

                  return (
                    <label
                      key={valStr}
                      className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-white/5 rounded-lg cursor-pointer group/filter transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          const allVals = Array.from(new Set(data.rows.map(r => r[activeMenuColumn])));
                          const current = activeFilters?.[activeMenuColumn] ?? allVals;
                          let next;
                          if (e.target.checked) {
                            next = [...current, val];
                          } else {
                            next = current.filter(v => v !== val);
                          }
                          onFilterChange?.(activeMenuColumn, next);
                        }}
                        className="w-3.5 h-3.5 rounded border-white/20 bg-transparent text-cyan-500 focus:ring-0 transition-all pointer-events-auto"
                      />
                      <span className="text-xs text-slate-300 group-hover/filter:text-white truncate">
                        {valStr || '(Empty)'}
                      </span>
                    </label>
                  );
                })}
            </div>
          </div>

          <div className="h-px bg-white/5 my-1.5 mx-2" />

          <div className="h-px bg-white/5 my-1.5 mx-2" />

          <button
            onClick={() => { onDeleteColumn(activeMenuColumn); setActiveMenuColumn(null); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400/80 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all group/item"
          >
            <Trash2 className="w-4 h-4 opacity-70 group-hover/item:opacity-100" />
            <div className="flex flex-col items-start">
              <span className="font-medium">Delete Column</span>
              <span className="text-[10px] opacity-60">Irreversible action</span>
            </div>
          </button>
        </div >
      )}

      {/* Glassmorphic Context Menu */}
      {
        contextMenu && (
          <div
            className="fixed z-50 bg-slate-900/70 backdrop-blur-2xl border border-slate-700/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] rounded-xl w-64 overflow-hidden context-menu ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-100 p-1"
            style={{
              top: contextMenu.y,
              left: contextMenu.x
            }}
          >
            <div className="space-y-0.5">
              {/* Clipboard Section */}
              <button onClick={handleCut} className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
                <span className="flex items-center gap-2"><Scissors className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" /> Cut</span>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+X</span>
              </button>
              <button onClick={handleCopy} className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
                <span className="flex items-center gap-2"><Copy className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" /> Copy</span>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+C</span>
              </button>
              <button onClick={handlePaste} className="w-full flex items-center justify-between px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group">
                <span className="flex items-center gap-2"><PlusSquare className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" /> Paste</span>
                <span className="text-[10px] text-slate-500 font-mono">Ctrl+V</span>
              </button>

              <div className="h-px bg-white/5 my-1 mx-2" />

              <div className="h-px bg-white/5 my-1 mx-2" />

              {/* Row/Col Operations */}
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/2">Modify Grid</div>
              <button
                onClick={() => { if (contextMenu.type === 'cell' && contextMenu.target?.r !== undefined) onInsertRow(contextMenu.target.r); setContextMenu(null); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group"
              >
                <PanelTopOpen className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" /> Insert Row Above
              </button>
              <button
                onClick={() => { if (contextMenu.type === 'cell' && contextMenu.target?.r !== undefined) onDeleteRow(contextMenu.target.r); setContextMenu(null); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group"
              >
                <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-400" /> Delete Row
              </button>
              <button
                onClick={() => { if (contextMenu.type === 'cell' && contextMenu.target?.c !== undefined) onInsertColumn(contextMenu.target.c); setContextMenu(null); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group"
              >
                <PanelLeftOpen className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" /> Insert Column
              </button>
              <button
                onClick={() => { if (contextMenu.type === 'cell' && contextMenu.target?.colKey) onDeleteColumn(contextMenu.target.colKey); setContextMenu(null); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg transition-colors group"
              >
                <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-400" /> Delete Column
              </button>

              <div className="h-px bg-white/5 my-1 mx-2" />

              {/* Editing Section */}
              <button onClick={handleClear} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg group">
                <Eraser className="w-4 h-4 text-slate-400 group-hover:text-amber-400" /> Clear Selected Range
              </button>
              <button onClick={handleAddCommentAction} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800 hover:text-white rounded-lg group">
                <MessageSquare className="w-4 h-4 text-slate-400 group-hover:text-indigo-400" /> Add Comment
              </button>

              <div className="h-px bg-white/5 my-1 mx-2" />

              {/* AI Action */}
              <button onClick={() => { if (selectedRange) onAnalyzeRange(selectedRange); setContextMenu(null); }} className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold text-cyan-50 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg transition-all group">
                <span className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-cyan-400 group-hover:animate-pulse" /> Ask NexAgent</span>
                <span className="flex items-center justify-center w-5 h-5 rounded bg-cyan-950 border border-cyan-800 text-[10px] text-cyan-400 font-mono">⌘J</span>
              </button>
            </div>
          </div>
        )
      }

      {/* Floating Quick Action AI Bar */}
      {
        quickActionCoords && (
          <div
            className="fixed z-40 animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
            style={{
              top: quickActionCoords.y + 4,
              left: quickActionCoords.x - 70 // Offset so it's aligned roughly near the cell edge
            }}
          >
            <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] rounded-full p-1 ring-1 ring-white/5">
              <button
                onClick={() => selectedRange && onAnalyzeRange(selectedRange)}
                className="p-1.5 rounded-full bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 transition-all shadow-sm group"
                title="Ask AI about this cell/range"
              >
                <Sparkles className="w-3.5 h-3.5 group-hover:animate-pulse" />
              </button>
              {selectionTrendData && (
                <>
                  <div className="w-px h-4 bg-slate-600/50 mx-0.5" />
                  <div className="flex items-center px-1 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" title="Selection Trend">
                    <svg width="40" height="16" className="overflow-visible">
                      <polyline
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={selectionTrendData.map((v, i) => {
                          const min = Math.min(...selectionTrendData);
                          const max = Math.max(...selectionTrendData);
                          const range = max - min || 1;
                          const x = (40 / (selectionTrendData.length - 1)) * i;
                          const y = 16 - ((v - min) / range) * 14 - 1;
                          return `${x},${y}`;
                        }).join(' ')}
                      />
                    </svg>
                  </div>
                </>
              )}
              <div className="w-px h-4 bg-slate-600/50 mx-0.5" />
              <button
                onClick={() => isFormatPainterActive && onFormatPainterApply ? null : onOpenDataTool("clean")}
                className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                title="Tools & Formats"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )
      }
      {/* Fill Range Border */}
      {
        isFilling && fillRange && (
          <div
            className="absolute border-2 border-dashed border-cyan-400 pointer-events-none z-50 animate-pulse"
            style={{
              ...getRangeRect(fillRange),
              boxShadow: '0 0 15px rgba(34, 211, 238, 0.3)',
              transition: 'none'
            }}
          />
        )
      }
    </div >
  );
};

export default Grid;