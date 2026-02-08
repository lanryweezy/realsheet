import React, { useState } from 'react';
import { X, Table, Calculator, GripVertical, Rows3, Columns3, Hash } from 'lucide-react';

type Aggregation = 'sum' | 'avg' | 'count' | 'min' | 'max';

interface ValueField {
  field: string;
  operation: Aggregation;
}

interface PivotModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: string[];
  onCreatePivot: (groupCol: string, valueCol: string, operation: Aggregation) => void;
}

const WELL_TYPES = ['rows', 'columns', 'values'] as const;
type WellType = typeof WELL_TYPES[number];

const PivotModal: React.FC<PivotModalProps> = ({ isOpen, onClose, columns, onCreatePivot }) => {
  const [rowFields, setRowFields] = useState<string[]>([]);
  const [columnFields, setColumnFields] = useState<string[]>([]);
  const [valueFields, setValueFields] = useState<ValueField[]>([]);
  const [dragSource, setDragSource] = useState<{ type: 'field' | WellType; field?: string; valueIndex?: number } | null>(null);
  const [dropTarget, setDropTarget] = useState<WellType | null>(null);

  if (!isOpen) return null;

  const usedInWells = new Set([...rowFields, ...columnFields, ...valueFields.map(v => v.field)]);
  const availableFields = columns.filter(c => !usedInWells.has(c));

  const handleDragStart = (e: React.DragEvent, source: { type: 'field' | WellType; field?: string; valueIndex?: number }) => {
    setDragSource(source);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', source.field ?? '');
  };

  const handleDragEnd = () => {
    setDragSource(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, well: WellType) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(well);
  };

  const handleDragLeave = () => setDropTarget(null);

  const handleDrop = (e: React.DragEvent, well: WellType) => {
    e.preventDefault();
    setDropTarget(null);
    const field = e.dataTransfer.getData('text/plain') || dragSource?.field;
    if (!field || !columns.includes(field)) return;

    const removeFrom = (arr: string[], key: string) => arr.filter(x => x !== key);
    const removeValue = (arr: ValueField[], key: string) => arr.filter(x => x.field !== key);

    if (dragSource?.type === 'rows') setRowFields(removeFrom(rowFields, field));
    if (dragSource?.type === 'columns') setColumnFields(removeFrom(columnFields, field));
    if (dragSource?.type === 'values') setValueFields(removeValue(valueFields, field));

    if (well === 'rows' && !rowFields.includes(field)) setRowFields([...rowFields, field]);
    if (well === 'columns' && !columnFields.includes(field)) setColumnFields([...columnFields, field]);
    if (well === 'values') {
      if (dragSource?.type === 'values' && dragSource.valueIndex != null) {
        const next = [...valueFields];
        next.splice(dragSource.valueIndex, 1);
        next.push({ field, operation: valueFields[dragSource.valueIndex].operation });
        setValueFields(next);
      } else if (!valueFields.some(v => v.field === field)) {
        setValueFields([...valueFields, { field, operation: 'sum' }]);
      }
    }
    setDragSource(null);
  };

  const setValueOperation = (index: number, operation: Aggregation) => {
    const next = [...valueFields];
    next[index] = { ...next[index], operation };
    setValueFields(next);
  };

  const removeFromWell = (well: WellType, field: string) => {
    if (well === 'rows') setRowFields(rowFields.filter(f => f !== field));
    if (well === 'columns') setColumnFields(columnFields.filter(f => f !== field));
    if (well === 'values') setValueFields(valueFields.filter(v => v.field !== field));
  };

  const wellClass = (well: WellType) =>
    `min-h-[44px] rounded-lg border-2 border-dashed p-2 transition-colors ${
      dropTarget === well ? 'border-nexus-accent bg-nexus-accent/10' : 'border-slate-600 bg-slate-800/50'
    }`;

  const createPivot = () => {
    const groupCol = rowFields[0] || columns[0];
    const firstValue = valueFields[0];
    const valueCol = firstValue ? firstValue.field : (columns[1] || columns[0]);
    const operation = firstValue ? firstValue.operation : 'sum';
    onCreatePivot(groupCol, valueCol, operation);
    onClose();
  };

  const canCreate = rowFields.length > 0 && valueFields.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              <Table className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white">Pivot Table Builder</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-400 px-6 pt-4">
          Drag fields from the list into Rows, Columns, or Values. Values use the selected aggregation.
        </p>

        <div className="flex-1 overflow-auto p-6 flex gap-6">
          <div className="w-48 shrink-0">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Fields</h3>
            <div className="flex flex-wrap gap-1.5">
              {availableFields.map(col => (
                <span
                  key={col}
                  draggable
                  onDragStart={(e) => handleDragStart(e, { type: 'field', field: col })}
                  onDragEnd={handleDragEnd}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded bg-slate-700 text-slate-200 text-sm cursor-grab active:cursor-grabbing border border-slate-600 hover:border-slate-500"
                >
                  <GripVertical className="w-3.5 h-3.5 text-slate-500" />
                  {col}
                </span>
              ))}
              {availableFields.length === 0 && (
                <span className="text-slate-500 text-sm">All fields in use</span>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Rows3 className="w-4 h-4" /> Rows
              </label>
              <div
                className={wellClass('rows')}
                onDragOver={(e) => handleDragOver(e, 'rows')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'rows')}
              >
                {rowFields.map(f => (
                  <span
                    key={f}
                    draggable
                    onDragStart={(e) => handleDragStart(e, { type: 'rows', field: f })}
                    onDragEnd={handleDragEnd}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-700 text-slate-200 text-sm cursor-grab mb-1 mr-1"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                    {f}
                    <button type="button" onClick={() => removeFromWell('rows', f)} className="text-slate-400 hover:text-white ml-0.5">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Columns3 className="w-4 h-4" /> Columns
              </label>
              <div
                className={wellClass('columns')}
                onDragOver={(e) => handleDragOver(e, 'columns')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'columns')}
              >
                {columnFields.map(f => (
                  <span
                    key={f}
                    draggable
                    onDragStart={(e) => handleDragStart(e, { type: 'columns', field: f })}
                    onDragEnd={handleDragEnd}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-700 text-slate-200 text-sm cursor-grab mb-1 mr-1"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                    {f}
                    <button type="button" onClick={() => removeFromWell('columns', f)} className="text-slate-400 hover:text-white ml-0.5">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <Hash className="w-4 h-4" /> Values
              </label>
              <div
                className={wellClass('values')}
                onDragOver={(e) => handleDragOver(e, 'values')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'values')}
              >
                {valueFields.map((v, i) => (
                  <span
                    key={`${v.field}-${i}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, { type: 'values', field: v.field, valueIndex: i })}
                    onDragEnd={handleDragEnd}
                    className="inline-flex items-center gap-2 px-2 py-1 rounded bg-slate-700 text-slate-200 text-sm cursor-grab mb-1 mr-1"
                  >
                    <GripVertical className="w-3.5 h-3.5" />
                    {v.field}
                    <select
                      value={v.operation}
                      onChange={(e) => setValueOperation(i, e.target.value as Aggregation)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-slate-800 border border-slate-600 rounded text-xs text-white py-0.5"
                    >
                      <option value="sum">Sum</option>
                      <option value="avg">Average</option>
                      <option value="count">Count</option>
                      <option value="min">Min</option>
                      <option value="max">Max</option>
                    </select>
                    <button type="button" onClick={() => removeFromWell('values', v.field)} className="text-slate-400 hover:text-white ml-0.5">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={createPivot}
            disabled={!canCreate}
            className="px-4 py-2 rounded-lg bg-nexus-accent text-white hover:bg-cyan-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Calculator className="w-4 h-4" /> Generate Pivot
          </button>
        </div>
      </div>
    </div>
  );
};

export default PivotModal;
