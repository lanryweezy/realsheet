import React, { useState, useEffect, memo, useMemo, useRef, useCallback } from 'react';
import { SheetData, CellValue, SelectionRange, FormattingRule } from '../types';
import { AlertCircle, Hash, Calendar, Type as TypeIcon, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical, Trash2, Edit2, Sparkles, Copy, XCircle, Calculator, MoveRight, MoveDown, PlusSquare, MinusSquare, MessageSquare, Eye, SplitSquareHorizontal, CopyMinus } from 'lucide-react';
import { evaluateCellValue, indexToExcelCol } from '../services/formulaService';
import { ToastType } from './Toast';

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
  value: CellValue;
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

  const displayValue = useMemo(() => {
    if (isHeader) return col;
    return evaluateCellValue(value, [], []);
  }, [isHeader, col, value]);

  const handleDoubleClick = useCallback(() => {
    if (!isHeader) {
      setIsEditing(true);
      setEditValue(String(displayValue));
    }
    onDoubleClick(rowIndex, colIndex);
  }, [isHeader, displayValue, rowIndex, colIndex, onDoubleClick]);

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
  onColumnResize 
}) => {
  const isMobile = window.innerWidth < 768;
  
  // Optimize cell sizing for mobile
  const getCellWidth = (col: string) => {
    const defaultWidth = isMobile ? 100 : 120;
    return data.columnWidths?.[col] || defaultWidth;
  };

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

  // Resizing State
  const [resizingCol, setResizingCol] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

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
      }
  };

  const handleMouseUp = () => {
      setIsDragging(false);
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


  // Add global mouse up to stop dragging if mouse leaves grid
  useEffect(() => {
      const handleGlobalMouseUp = () => setIsDragging(false);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

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
            // Safe filter execution
            // eslint-disable-next-line no-new-func
            const filterFn = new Function('row', `return ${data.filter.code}`);
            rows = rows.filter(({ row }) => {
                try { return filterFn(row); } catch { return false; }
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

  const getFormattingStyle = (col: string, value: CellValue) => {
     const rules = rulesByColumn[col];
     if (!rules || value === null || value === '') return {};
     
     let computedStyle: React.CSSProperties = {};
      let barWidth: number | undefined = undefined;
      let barColor: string | undefined = undefined;

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
                        barWidth = ((numValue - Math.min(0, min)) / range) * 100;
                        barColor = rule.barColor || '#22d3ee';
                   }
              } else if (rule.type === 'greaterThan' && !isNaN(numValue) && numValue > Number(rule.value1)) {
                  computedStyle = { ...computedStyle, backgroundColor: rule.style?.backgroundColor, color: rule.style?.textColor };
              } else if (rule.type === 'lessThan' && !isNaN(numValue) && numValue < Number(rule.value1)) {
                  computedStyle = { ...computedStyle, backgroundColor: rule.style?.backgroundColor, color: rule.style?.textColor };
              } else if (rule.type === 'equals' && String(value) === String(rule.value1)) {
                   computedStyle = { ...computedStyle, backgroundColor: rule.style?.backgroundColor, color: rule.style?.textColor };
              } else if (rule.type === 'containsText' && strValue.includes(String(rule.value1).toLowerCase())) {
                   computedStyle = { ...computedStyle, backgroundColor: rule.style?.backgroundColor, color: rule.style?.textColor };
              }
          } catch (e) {}
      });
      return { style: computedStyle, dataBarWidth: barWidth, dataBarColor: barColor };
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
      return selectedRange?.start.rowIndex === rowIdx && selectedRange?.start.colIndex === colIdx;
  };
  
  // Highlight Headers logic
  const isColSelected = (colIdx: number) => {
      if (!selectedRange) return false;
      const minCol = Math.min(selectedRange.start.colIndex, selectedRange.end.colIndex);
      const maxCol = Math.max(selectedRange.start.colIndex, selectedRange.end.colIndex);
      return colIdx >= minCol && colIdx <= maxCol;
  };

   const isRowSelected = (rowIdx: number) => {
      if (!selectedRange) return false;
      const minRow = Math.min(selectedRange.start.rowIndex, selectedRange.end.rowIndex);
      const maxRow = Math.max(selectedRange.start.rowIndex, selectedRange.end.rowIndex);
      return rowIdx >= minRow && rowIdx <= maxRow;
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
  
  const handleCopy = () => {
      if(!selectedRange) return;
      
      // Simple copy implementation - constructing TSV string
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
          tsv += rowValues.join('\t') + '\n';
      }

      navigator.clipboard.writeText(tsv).then(() => {
          onNotify('success', 'Copied to clipboard', `${maxRow - minRow + 1} rows x ${maxCol - minCol + 1} columns copied.`);
      }).catch(() => {
          onNotify('error', 'Copy failed', 'Could not access clipboard.');
      });
      setContextMenu(null);
  };

  const handleCellDoubleClick = useCallback((rowIndex: number, colIndex: number) => {
    // Handle cell double click logic here
    // This could be used for cell selection or other actions
    console.log('Cell double clicked:', rowIndex, colIndex);
  }, []);

  return (
    <div className="w-full h-full overflow-auto relative select-none grid-container">
      <table 
        ref={tableRef}
        className="data-grid-table w-full border-collapse"
        style={{ minWidth: '100%', tableLayout: 'fixed' }}
      >
        <thead>
          <tr>
            {/* Index Column */}
            <th className="index-col sticky left-0 z-20" style={{ width: isMobile ? '40px' : '50px' }}>
              <div className="flex items-center justify-center h-8">
                <Hash className="w-4 h-4" />
              </div>
            </th>
            
            {/* Data Columns */}
            {data.columns.map((col, colIdx) => {
              const width = getCellWidth(col);
              return (
                <th 
                  key={col} 
                  className="cell-header sticky top-0 z-10 text-left"
                  style={{ 
                    width: `${width}px`, 
                    maxWidth: `${width}px`, 
                    minWidth: `${width}px`,
                    fontSize: isMobile ? '11px' : '13px'
                  }}
                >
                  {/* Column Header Content */}
                  <div className="flex items-center justify-between h-8 px-2">
                    <span className="truncate flex-1" title={col}>
                      {col}
                    </span>
                    {/* Mobile-friendly column actions */}
                    <div className="flex items-center gap-1">
                      {!isMobile && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuColumn(col);
                          }}
                          className="p-1 hover:bg-slate-700 rounded"
                        >
                          <MoreVertical className="w-3 h-3" />
                        </button>
                      )}
                      {isMobile && (
                        <button 
                          onClick={() => onSmartFillTrigger(col)}
                          className="p-1 text-indigo-400 hover:text-indigo-300"
                          title="Smart Fill"
                        >
                          <Sparkles className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        
        <tbody>
          {data.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {/* Row Index */}
              <td 
                className={`index-col sticky left-0 z-10 ${isRowSelected(rowIndex) ? 'bg-nexus-accent/20 text-nexus-accent' : ''}`}
                style={{ fontSize: isMobile ? '10px' : '12px' }}
              >
                {rowIndex + 1}
              </td>
              
              {/* Data Cells */}
              {data.columns.map((col, colIdx) => {
                const rawVal = row[col];
                const displayVal = evaluateCellValue(rawVal, data.rows, data.columns);
                const { style, dataBarWidth, dataBarColor } = getFormattingStyle(col, displayVal);
                const isSelected = isCellSelected(rowIndex, colIdx);
                const isInRange = isCellInRange(rowIndex, colIdx);
                const selectionBorders = {
                  top: false,
                  bottom: false,
                  left: false,
                  right: false
                };
                
                const width = getCellWidth(col);
                
                return (
                  <td 
                    key={`${rowIndex}-${colIdx}`} 
                    className="p-0 border-b border-r border-slate-700/50 overflow-hidden relative"
                    style={{ 
                      width: `${width}px`, 
                      maxWidth: `${width}px`, 
                      minWidth: `${width}px`,
                      fontSize: isMobile ? '11px' : '13px'
                    }}
                  >
                    <Cell 
                      rowIndex={rowIndex}
                      colIndex={colIdx}
                      col={col}
                      value={rawVal}
                      isSelected={isSelected}
                      isHeader={false}
                      columnType={columnTypes[col] || 'string'}
                      onCellEdit={onCellEdit}
                      onContextMenu={handleContextMenu}
                      onDoubleClick={handleCellDoubleClick}
                    />
                    
                    {/* Mobile touch targets */}
                    {isMobile && isSelected && (
                      <div className="absolute inset-0 bg-nexus-accent/10 pointer-events-none rounded-sm"></div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Grid;