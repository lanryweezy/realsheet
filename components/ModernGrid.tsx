import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SheetData, SelectionRange } from '../types';
import { evaluateCellValue, indexToExcelCol } from '../services/formulaService';
import { evaluateWithHF, syncWorkbook } from '../services/hyperformulaService';
import { Sparkles, Eye, MessageSquare, Calculator } from 'lucide-react';

interface ModernGridProps {
  data: SheetData;
  selectedRange: SelectionRange | null;
  onRangeSelect: (range: SelectionRange | null) => void;
  onCellEdit: (rowIndex: number, colKey: string, value: string) => void;
  onSmartFillTrigger: (colKey: string) => void;
  onAddWatch: (cellRef: string) => void;
  onAddComment: (rowIndex: number, colIndex: number, text: string) => void;
}

const ModernGrid: React.FC<ModernGridProps> = ({
  data,
  selectedRange,
  onRangeSelect,
  onCellEdit,
  onSmartFillTrigger,
  onAddWatch,
  onAddComment
}) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Sync with HyperFormula Core
  useEffect(() => {
    if (data) {
      syncWorkbook(data);
    }
  }, [data]);

  const handleCellClick = (rowIndex: number, colIndex: number, e: React.MouseEvent) => {
    if (e.shiftKey && selectedRange) {
      onRangeSelect({
        start: selectedRange.start,
        end: { rowIndex, colIndex }
      });
    } else {
      onRangeSelect({
        start: { rowIndex, colIndex },
        end: { rowIndex, colIndex }
      });
    }
  };

  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    const colKey = data.columns[colIndex];
    setEditValue(String(data.rows[rowIndex][colKey] || ''));
  };

  const handleEditComplete = () => {
    if (editingCell) {
      const colKey = data.columns[editingCell.col];
      onCellEdit(editingCell.row, colKey, editValue);
      setEditingCell(null);
    }
  };

  const isCellSelected = (rowIndex: number, colIndex: number) => {
    if (!selectedRange) return false;
    const { start, end } = selectedRange;
    const minRow = Math.min(start.rowIndex, end.rowIndex);
    const maxRow = Math.max(start.rowIndex, end.rowIndex);
    const minCol = Math.min(start.colIndex, end.colIndex);
    const maxCol = Math.max(start.colIndex, end.colIndex);
    return rowIndex >= minRow && rowIndex <= maxRow && colIndex >= minCol && colIndex <= maxCol;
  };

  return (
    <div ref={gridRef} className="modern-grid-container">
      <div className="modern-grid-wrapper">
        <table className="modern-grid-table">
          <thead>
            <tr>
              <th className="modern-grid-index-header">#</th>
              {data.columns.map((col, colIndex) => (
                <th key={col} className="modern-grid-header">
                  <div className="modern-grid-header-content">
                    <span className="modern-grid-header-text">{col}</span>
                    <button
                      onClick={() => onSmartFillTrigger(col)}
                      className="modern-grid-header-action"
                      title="Smart Fill"
                    >
                      <Sparkles className="w-3 h-3" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="modern-grid-row">
                <td className="modern-grid-index-cell">{rowIndex + 1}</td>
                {data.columns.map((col, colIndex) => {
                  const value = row[col];
                  const displayValue = evaluateWithHF(value, rowIndex, col, data);
                  const isSelected = isCellSelected(rowIndex, colIndex);
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                  const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex;

                  return (
                    <td
                      key={col}
                      className={`modern-grid-cell ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
                      onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                      onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                      onMouseEnter={() => setHoveredCell({ row: rowIndex, col: colIndex })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={handleEditComplete}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditComplete();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                          className="modern-grid-cell-input"
                          autoFocus
                        />
                      ) : (
                        <div className="modern-grid-cell-content">
                          <span className="modern-grid-cell-value">{displayValue}</span>
                          {isHovered && (
                            <div className="modern-grid-cell-actions">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const cellRef = `${indexToExcelCol(colIndex)}${rowIndex + 1}`;
                                  onAddWatch(cellRef);
                                }}
                                title="Add to Watch"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const comment = prompt('Enter comment:');
                                  if (comment) onAddComment(rowIndex, colIndex, comment);
                                }}
                                title="Add Comment"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModernGrid;
