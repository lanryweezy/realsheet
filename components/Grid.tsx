import React, { useState, useEffect, memo, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import { SheetData, CellValue, SelectionRange, FormattingRule, IconSetStyle } from '../types';
import { Hash, ArrowUp, ArrowDown, MoreVertical, Trash2, Sparkles, Copy, XCircle, PanelTopOpen, PanelLeftOpen, Scissors, Eraser, Filter, ArrowUpDown } from 'lucide-react';
import { evaluateCellValue, indexToExcelCol } from '../services/formulaService';
import { evaluateWithHF, syncWorkbook, getDependencies } from '../services/hyperformulaService';
import { NeuralLines } from "./NeuralLines";
import { Sparkline } from './Sparkline';
import { ToastType } from './Toast';
import { safeFilterEvaluate } from '../utils/safeFormulaParser';

const ROW_HEIGHT = 32;
const HEADER_HEIGHT = 28;
const VISIBLE_ROWS_BUFFER = 5;
const EXPANSION_THRESHOLD = 5;
const EMPTY_STYLE = {};


const COMMON_FUNCTIONS = [
  { name: 'SUM', description: 'Calculates the sum of a range of cells.', syntax: 'SUM(range)' },
  { name: 'AVERAGE', description: 'Calculates the average of a range of cells.', syntax: 'AVERAGE(range)' },
  { name: 'COUNT', description: 'Counts the number of cells that contain numbers.', syntax: 'COUNT(range)' },
  { name: 'MIN', description: 'Finds the minimum value in a range.', syntax: 'MIN(range)' },
  { name: 'MAX', description: 'Finds the maximum value in a range.', syntax: 'MAX(range)' },
  { name: 'IF', description: 'Returns one value if a condition is true and another if it is false.', syntax: 'IF(condition, value_if_true, value_if_false)' },
];

const FormulaCopilot = ({ query, onSelect, selectedIndex }: { query: string, onSelect: (func: string) => void, selectedIndex: number }) => {
  const searchTerm = query.replace('=', '').toUpperCase();
  const suggestions = useMemo(() => COMMON_FUNCTIONS.filter(f => f.name.startsWith(searchTerm)).slice(0, 5), [searchTerm]);
  if (suggestions.length === 0) return null;
  return (
    <div className="absolute top-full left-0 mt-1 w-64 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-1 shadow-black/50">
      <div className="bg-slate-800/50 px-3 py-1.5 border-b border-white/5">
        <span className="text-[9px] font-mono text-cyan-400/70 uppercase tracking-widest">Nexus Suggestions</span>
      </div>
      <div className="p-1">
        {suggestions.map((func, i) => (
          <div key={func.name} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSelect(func.name); }} className={`w-full text-left px-3 py-2 rounded-lg transition-all cursor-pointer ${i === selectedIndex ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30' : 'text-slate-400 hover:bg-white/5'}`}>
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

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
}

const interpolateColor = (color1: string, color2: string, factor: number) => {
  const c1 = hexToRgb(color1), c2 = hexToRgb(color2);
  const r = Math.round(c1.r + factor * (c2.r - c1.r)), g = Math.round(c1.g + factor * (c2.g - c1.g)), b = Math.round(c1.b + factor * (c2.b - c1.b));
  return `rgb(${r}, ${g}, ${b})`;
}

// ⚡ Bolt: Removed isHovered state to prevent O(N*M) re-renders during mouse movement. Using CSS hover instead.
const EnhancedCell = memo(({ rowIndex, colIndex, col, value, displayValue, isSelected, columnType, onCellEdit, onContextMenu, highlightedCells = new Set(), onFillStart, style = {} }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const combinedStyle = useMemo(() => ({
    ...style,
    fontWeight: style.fontWeight || 'inherit',
    fontStyle: style.fontStyle || 'inherit',
    textDecoration: style.textDecoration || 'inherit',
    color: style.color || 'inherit',
    backgroundColor: style.backgroundColor || 'transparent',
    textAlign: style.textAlign || 'inherit'
  }), [style]);

  const searchTerm = editValue.startsWith('=') ? editValue.replace('=', '').toUpperCase() : '';
  const filteredSuggestions = useMemo(() => searchTerm ? COMMON_FUNCTIONS.filter(f => f.name.startsWith(searchTerm)).slice(0, 5) : [], [searchTerm]);

  const handleSelectSuggestion = useCallback((funcName: string) => { setEditValue(`=${funcName}(`); setSelectedIndex(0); }, []);

  const handleDoubleClick = useCallback(() => { setIsEditing(true); setEditValue(String(value ?? '')); }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(prev => (prev + 1) % filteredSuggestions.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length); return; }
      if (e.key === 'Tab' || (e.key === 'Enter' && filteredSuggestions.length > 0)) { e.preventDefault(); handleSelectSuggestion(filteredSuggestions[selectedIndex].name); return; }
    }
    if (e.key === 'Enter') { onCellEdit(rowIndex, col, editValue); setIsEditing(false); }
    else if (e.key === 'Escape') setIsEditing(false);
  }, [rowIndex, col, editValue, onCellEdit, filteredSuggestions, selectedIndex, handleSelectSuggestion]);

  useEffect(() => { if (isEditing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [isEditing]);



  const isFormula = typeof value === 'string' && value.startsWith('=');

  // Sparkline detection
  const isSparkline = typeof value === 'string' && value.startsWith('=SPARKLINE(');
  const sparklineData = useMemo(() => {
    if (!isSparkline) return null;
    // Simple extraction for demo: =SPARKLINE(1,2,3,4,5)
    try {
      const content = value.match(/\((.*)\)/)?.[1];
      if (!content) return null;
      return content.split(',').map(Number).filter(n => !isNaN(n));
    } catch { return null; }
  }, [value, isSparkline]);

  if (isEditing) {
    return (
      <div className="w-full h-full relative z-20">
        <input ref={inputRef} type="text" value={editValue} onChange={(e) => { setEditValue(e.target.value); setSelectedIndex(0); }} onBlur={() => { setTimeout(() => { onCellEdit(rowIndex, col, editValue); setIsEditing(false); }, 150); }} onKeyDown={handleKeyDown} className="w-full h-full p-1 border-none outline-none bg-slate-800 text-white" />
        {editValue.startsWith('=') && <FormulaCopilot query={editValue} onSelect={handleSelectSuggestion} selectedIndex={selectedIndex} />}
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full flex flex-col justify-center px-1 text-xs relative hover:bg-white/5 ${isSelected ? 'ring-2 ring-cyan-400 bg-cyan-400/10' : ''} ${isFormula ? 'formula-glow' : ''}`}
      style={combinedStyle}
      onDoubleClick={handleDoubleClick}
      onContextMenu={onContextMenu}
    >
      {isSparkline && sparklineData ? (
        <div className="flex items-center justify-center w-full h-full">
          <Sparkline values={sparklineData} width={80} height={20} />
        </div>
      ) : (
        <div className={`truncate ${isFormula ? 'text-cyan-400 font-medium' : ''}`}>{displayValue}</div>
      )}
      {isSelected && <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-cyan-400 border border-slate-900 rounded-sm cursor-crosshair z-30" onMouseDown={onFillStart} />}
    </div>
  );
});

EnhancedCell.displayName = 'EnhancedCell';

const Grid = ({ data, selectedRange, onRangeSelect, onCellEdit, onColumnResize, onSheetExpand, onFillRange, onSortColumn, onFilterChange, activeFilters, highlightedCells, isFormatPainterActive, onFormatPainterApply, presences = [] }: any) => {
  const [scrollTop, setScrollTop] = useState(0), [scrollLeft, setScrollLeft] = useState(0);
  const [containerHeight, setContainerHeight] = useState(800), [containerWidth, setContainerWidth] = useState(1200);
  const [isDragging, setIsDragging] = useState(false);
  const [isFilling, setIsFilling] = useState(false), [fillRange, setFillRange] = useState<any>(null);
  const [precedents, setPrecedents] = useState<Set<string>>(new Set());
  const [neuralPoints, setNeuralPoints] = useState<any>({ source: null, targets: [] });
  const [contextMenu, setContextMenu] = useState<any>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  const selectedRangeRef = useRef(selectedRange);
  const onCellEditRef = useRef(onCellEdit);

  useLayoutEffect(() => {
    selectedRangeRef.current = selectedRange;
  }, [selectedRange]);

  useLayoutEffect(() => {
    onCellEditRef.current = onCellEdit;
  }, [onCellEdit]);

  const handleCellEditStable = useCallback((rowIndex: number, colKey: string, value: string) => {
    onCellEditRef.current(rowIndex, colKey, value);
  }, []);

  const handleFillStart = useCallback((e: any) => {
    e.preventDefault();
    setIsFilling(true);
    setFillRange(selectedRangeRef.current);
  }, []);

  useEffect(() => {
    if (!gridContainerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        setContainerHeight(entry.contentRect.height);
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(gridContainerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { if (data) syncWorkbook(data); }, [data]);

  useEffect(() => {
    if (selectedRange && !isDragging && gridContainerRef.current) {
      const { start } = selectedRange, colKey = data.columns[start.colIndex], cellValue = data.rows[start.rowIndex][colKey];
      if (typeof cellValue === "string" && cellValue.startsWith("=")) {
        const deps = getDependencies(start.rowIndex, colKey, data.name || "Sheet1");
        const newPrecedents = new Set<string>(), points: any[] = [];
        const sourceEl = document.querySelector(`td[data-row="${start.rowIndex}"][data-col="${start.colIndex}"]`);
        const sourceRect = sourceEl?.getBoundingClientRect(), gridRect = gridContainerRef.current.getBoundingClientRect();
        const sourcePoint = sourceRect ? { x: sourceRect.left - gridRect.left + sourceRect.width / 2 + scrollLeft, y: sourceRect.top - gridRect.top + sourceRect.height / 2 + scrollTop } : null;
        deps.forEach((dep: any) => {
          newPrecedents.add(`${dep.row}-${dep.col}`);
          const targetEl = document.querySelector(`td[data-row="${dep.row}"][data-col="${dep.col}"]`);
          const targetRect = targetEl?.getBoundingClientRect();
          if (targetRect) points.push({ x: targetRect.left - gridRect.left + targetRect.width / 2 + scrollLeft, y: targetRect.top - gridRect.top + targetRect.height / 2 + scrollTop });
        });
        setPrecedents(newPrecedents); setNeuralPoints({ source: sourcePoint, targets: points });
      } else { setPrecedents(new Set()); setNeuralPoints({ source: null, targets: [] }); }
    }
  }, [selectedRange, isDragging, data, scrollTop, scrollLeft]);

  const getCellWidth = useCallback((col: string) => data.columnWidths?.[col] || 100, [data.columnWidths]);
  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - VISIBLE_ROWS_BUFFER);
    const endRow = Math.min(data.rows.length, startRow + Math.ceil(containerHeight / ROW_HEIGHT) + VISIBLE_ROWS_BUFFER * 2);
    let startCol = 0, endCol = data.columns.length, acc = 0;
    for (let i = 0; i < data.columns.length; i++) {
      const w = getCellWidth(data.columns[i]);
      if (acc + w < scrollLeft) { startCol = i; }
      if (acc > scrollLeft + containerWidth) { endCol = i + 1; break; }
      acc += w;
    }
    const VISIBLE_COLS_BUFFER = 3;
    startCol = Math.max(0, startCol - VISIBLE_COLS_BUFFER);
    endCol = Math.min(data.columns.length, endCol + VISIBLE_COLS_BUFFER);
    return { startRow, endRow, startCol, endCol };
  }, [scrollTop, scrollLeft, containerHeight, containerWidth, data.rows.length, data.columns, getCellWidth]);

  useEffect(() => {
    if (data.rows.length - visibleRange.endRow <= EXPANSION_THRESHOLD && onSheetExpand) onSheetExpand(data.rows.length + 50, data.columns.length);
  }, [visibleRange.endRow, data.rows.length, onSheetExpand]);

  const handleTableMouseDown = useCallback((e: React.MouseEvent) => {
    const td = (e.target as HTMLElement).closest('td[data-row][data-col]');
    if (!td) return;
    const r = parseInt(td.getAttribute('data-row') || '-1', 10);
    const c = parseInt(td.getAttribute('data-col') || '-1', 10);
    if (r === -1 || c === -1) return;

    // Performance optimization: Event delegation for cell interaction
    if (isFormatPainterActive) { onFormatPainterApply(r, data.columns[c]); return; }
    setIsDragging(true); onRangeSelect({ start: { rowIndex: r, colIndex: c }, end: { rowIndex: r, colIndex: c } });
  }, [isFormatPainterActive, onFormatPainterApply, data.columns, onRangeSelect]);

  const handleTableMouseOver = useCallback((e: React.MouseEvent) => {
    const td = (e.target as HTMLElement).closest('td[data-row][data-col]');
    if (!td) return;
    const r = parseInt(td.getAttribute('data-row') || '-1', 10);
    const c = parseInt(td.getAttribute('data-col') || '-1', 10);
    if (r === -1 || c === -1) return;

    if (isDragging && selectedRange) {
      onRangeSelect({ ...selectedRange, end: { rowIndex: r, colIndex: c } });
    } else if (isFilling && selectedRange) {
      const s = selectedRange.start, e2 = selectedRange.end;
      setFillRange({
        start: { rowIndex: Math.min(s.rowIndex, e2.rowIndex, r), colIndex: Math.min(s.colIndex, e2.colIndex, c) },
        end: { rowIndex: Math.max(s.rowIndex, e2.rowIndex, r), colIndex: Math.max(s.colIndex, e2.colIndex, c) }
      });
    }
  }, [isDragging, isFilling, selectedRange, onRangeSelect]);

  const handleMouseUp = () => {
    if (isFilling && fillRange) onFillRange(selectedRange, fillRange);
    setIsDragging(false); setIsFilling(false); setFillRange(null);
  };

  const totalWidth = useMemo(() => data.columns.reduce((a: any, c: any) => a + getCellWidth(c), 0) + 50, [data.columns, getCellWidth]);

  // Pre-calculate selection bounds to avoid O(N*M) Math.min/max calls during render
  const selectionBounds = useMemo(() => {
    if (!selectedRange) return null;
    return {
      minRow: Math.min(selectedRange.start.rowIndex, selectedRange.end.rowIndex),
      maxRow: Math.max(selectedRange.start.rowIndex, selectedRange.end.rowIndex),
      minCol: Math.min(selectedRange.start.colIndex, selectedRange.end.colIndex),
      maxCol: Math.max(selectedRange.start.colIndex, selectedRange.end.colIndex)
    };
  }, [selectedRange]);

  // Pre-calculate presence bounds
  const presenceBounds = useMemo(() => {
    return presences.filter((p: any) => p.selection).map((p: any) => ({
      ...p,
      bounds: {
        minRow: Math.min(p.selection.start.rowIndex, p.selection.end.rowIndex),
        maxRow: Math.max(p.selection.start.rowIndex, p.selection.end.rowIndex),
        minCol: Math.min(p.selection.start.colIndex, p.selection.end.colIndex),
        maxCol: Math.max(p.selection.start.colIndex, p.selection.end.colIndex)
      }
    }));
  }, [presences]);

  return (
    <div ref={gridContainerRef} className={`w-full h-full overflow-auto relative grid-container bg-slate-950 ${isFormatPainterActive ? 'cursor-cell' : ''}`} onScroll={(e) => { setScrollTop(e.currentTarget.scrollTop); setScrollLeft(e.currentTarget.scrollLeft); }} onMouseUp={handleMouseUp}>
      <div style={{ height: data.rows.length * ROW_HEIGHT + HEADER_HEIGHT, width: totalWidth, position: 'relative' }}>
        <NeuralLines source={neuralPoints.source} targets={neuralPoints.targets} />
        <table className="data-grid-table border-collapse" style={{ tableLayout: 'fixed', width: totalWidth, position: 'sticky', top: 0 }} onMouseDown={handleTableMouseDown} onMouseOver={handleTableMouseOver}>
          <colgroup><col style={{ width: '50px' }} />{data.columns.map((c: any) => <col key={c} style={{ width: `${getCellWidth(c)}px` }} />)}</colgroup>
          <thead>
            <tr style={{ height: HEADER_HEIGHT }}>
              <th className="bg-slate-900 border-b border-r border-slate-700 text-center"><Hash className="w-3 h-3 mx-auto text-slate-500" /></th>
              {visibleRange.startCol > 0 && <th colSpan={visibleRange.startCol} />}
              {data.columns.slice(visibleRange.startCol, visibleRange.endCol).map((col: any, i: number) => {
                const ci = visibleRange.startCol + i;
                const isActive = selectionBounds && ci >= selectionBounds.minCol && ci <= selectionBounds.maxCol;
                return (
                  <th key={col} className={`border-b border-r border-slate-700 text-left px-2 text-xs font-bold transition-colors overflow-hidden truncate ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-900 text-slate-400'}`}>{col}</th>
                );
              })}
              {visibleRange.endCol < data.columns.length && <th colSpan={data.columns.length - visibleRange.endCol} />}
            </tr>
          </thead>
          <tbody>
            <tr style={{ height: visibleRange.startRow * ROW_HEIGHT }}><td colSpan={data.columns.length + 1} /></tr>
            {data.rows.slice(visibleRange.startRow, visibleRange.endRow).map((row: any, ri: number) => {
              const rowIndex = visibleRange.startRow + ri;
              return (
                <tr key={rowIndex} style={{ height: ROW_HEIGHT }}>
                  <td
                    className={`border-b border-r border-slate-700 text-center text-[10px] font-bold sticky left-0 z-10 cursor-pointer transition-colors ${
                      selectionBounds && rowIndex >= selectionBounds.minRow && rowIndex <= selectionBounds.maxRow
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'bg-slate-900 text-slate-500 hover:text-cyan-400'
                    }`}
                    onClick={() => (window as any).openRecordDetail?.(rowIndex)}
                  >
                    {rowIndex + 1}
                  </td>
                  {visibleRange.startCol > 0 && <td colSpan={visibleRange.startCol} />}
                  {data.columns.slice(visibleRange.startCol, visibleRange.endCol).map((col: any, i: number) => {
                    const ci = visibleRange.startCol + i;
                    const isSelected = selectionBounds && rowIndex >= selectionBounds.minRow && rowIndex <= selectionBounds.maxRow && ci >= selectionBounds.minCol && ci <= selectionBounds.maxCol;
                    const isPrecedent = precedents.has(`${rowIndex}-${ci}`);
                    const cellStyle = data.cellStyles?.[`${rowIndex}-${col}`] || EMPTY_STYLE;

                    // Presence check
                    const remotePresence = presenceBounds.find((p: any) =>
                      rowIndex >= p.bounds.minRow &&
                      rowIndex <= p.bounds.maxRow &&
                      ci >= p.bounds.minCol &&
                      ci <= p.bounds.maxCol
                    );

                    return (
                      <td
                        key={col}
                        data-row={rowIndex}
                        data-col={ci}
                        className="p-0 border-b border-r border-slate-800 relative"
                        style={{ border: isPrecedent ? '1px solid var(--nexus-accent)' : remotePresence ? `1px solid ${remotePresence.color}` : undefined }}
                      >
                        <EnhancedCell rowIndex={rowIndex} colIndex={ci} col={col} value={row[col]} displayValue={evaluateWithHF(row[col], rowIndex, col, data)} isSelected={isSelected} onCellEdit={handleCellEditStable} onFillStart={handleFillStart} style={cellStyle} />
                      </td>
                    );
                  })}
                  {visibleRange.endCol < data.columns.length && <td colSpan={data.columns.length - visibleRange.endCol} />}
                </tr>
              );
            })}
            <tr style={{ height: Math.max(0, (data.rows.length - visibleRange.endRow) * ROW_HEIGHT) }}><td colSpan={data.columns.length + 1} /></tr>
          </tbody>
        </table>
      </div>
      {isFilling && fillRange && <div className="absolute border-2 border-dashed border-cyan-400 pointer-events-none z-50" style={{ top: HEADER_HEIGHT + Math.min(fillRange.start.rowIndex, fillRange.end.rowIndex) * ROW_HEIGHT, left: 50 + data.columns.slice(0, Math.min(fillRange.start.colIndex, fillRange.end.colIndex)).reduce((a:any,b:any)=>a+getCellWidth(b),0), width: data.columns.slice(Math.min(fillRange.start.colIndex, fillRange.end.colIndex), Math.max(fillRange.start.colIndex, fillRange.end.colIndex)+1).reduce((a:any,b:any)=>a+getCellWidth(b),0), height: (Math.abs(fillRange.end.rowIndex - fillRange.start.rowIndex)+1)*ROW_HEIGHT }} />}
    </div>
  );
};

export default memo(Grid);
