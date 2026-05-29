import React, { useState, useEffect } from 'react';
import {
  GitMerge, Check, X, AlertTriangle, ArrowRight,
  ArrowLeft, Layers, FileSpreadsheet, ChevronRight
} from 'lucide-react';
import { Workbook, Branch, SheetData } from '../types';
import { calculateDiff } from '../services/versionControlService';

interface MergeConflictViewProps {
  sourceBranch: Branch;
  targetBranch: Branch;
  onResolve: (finalWorkbook: Workbook) => void;
  onCancel: () => void;
}

interface Conflict {
  id: string;
  sheetId: string;
  sheetName: string;
  row: number;
  col: string;
  sourceValue: any;
  targetValue: any;
  resolution: 'source' | 'target' | 'manual' | null;
}

const MergeConflictView: React.FC<MergeConflictViewProps> = ({
  sourceBranch,
  targetBranch,
  onResolve,
  onCancel
}) => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Identify conflicts
    const identifiedConflicts: Conflict[] = [];
    const sourceWb = sourceBranch.workbook;
    const targetWb = targetBranch.workbook;

    sourceWb.sheets.forEach(sourceSheet => {
      const targetSheet = targetWb.sheets.find(s => s.id === sourceSheet.id);
      if (!targetSheet) return;

      sourceSheet.rows.forEach((sourceRow, ri) => {
        const targetRow = targetSheet.rows[ri];
        if (!targetRow) return;

        sourceSheet.columns.forEach(col => {
          if (sourceRow[col] !== targetRow[col]) {
            identifiedConflicts.push({
              id: `${sourceSheet.id}-${ri}-${col}`,
              sheetId: sourceSheet.id || '',
              sheetName: sourceSheet.name,
              row: ri,
              col,
              sourceValue: sourceRow[col],
              targetValue: targetRow[col],
              resolution: null
            });
          }
        });
      });
    });

    setConflicts(identifiedConflicts);
    setLoading(false);
  }, [sourceBranch, targetBranch]);

  const resolveConflict = (id: string, resolution: 'source' | 'target') => {
    setConflicts(prev => prev.map(c => c.id === id ? { ...c, resolution } : c));
  };

  const resolveAll = (resolution: 'source' | 'target') => {
    setConflicts(prev => prev.map(c => ({ ...c, resolution })));
  };

  const handleFinalMerge = () => {
    // Create final workbook based on resolutions
    const finalWorkbook = JSON.parse(JSON.stringify(targetBranch.workbook)) as Workbook;

    conflicts.forEach(conflict => {
      const sheet = finalWorkbook.sheets.find(s => s.id === conflict.sheetId);
      if (sheet && sheet.rows[conflict.row]) {
        sheet.rows[conflict.row][conflict.col] =
          conflict.resolution === 'source' ? conflict.sourceValue : conflict.targetValue;
      }
    });

    onResolve(finalWorkbook);
  };

  const pendingCount = conflicts.filter(c => c.resolution === null).length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-900 text-slate-100">
      <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <GitMerge className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Merge Conflicts</h3>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              Merging <span className="text-purple-400">{sourceBranch.name}</span> into <span className="text-cyan-400">{targetBranch.name}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => resolveAll('target')}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-slate-700 hover:bg-slate-800 rounded-lg transition-all"
          >
            Keep Target
          </button>
          <button
            onClick={() => resolveAll('source')}
            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-purple-600 hover:bg-purple-500 rounded-lg transition-all"
          >
            Take Source
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
          </div>
        ) : conflicts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
            <Check className="w-12 h-12 text-emerald-500/20" />
            <p className="font-medium italic">No conflicts detected. Smooth sailing!</p>
          </div>
        ) : (
          conflicts.map(conflict => (
            <div key={conflict.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="px-3 py-2 bg-slate-800 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                  <FileSpreadsheet className="w-3 h-3" />
                  {conflict.sheetName}
                  <ChevronRight className="w-2.5 h-2.5" />
                  Cell {conflict.col}{conflict.row + 1}
                </div>
                {conflict.resolution && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                    Resolved
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 divide-x divide-slate-700">
                <button
                  onClick={() => resolveConflict(conflict.id, 'target')}
                  className={`p-4 text-left transition-all hover:bg-cyan-500/5 ${conflict.resolution === 'target' ? 'bg-cyan-500/10 ring-1 ring-inset ring-cyan-500/50' : ''}`}
                >
                  <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> {targetBranch.name}
                  </div>
                  <div className="text-sm font-mono text-white bg-slate-950 p-2 rounded border border-slate-700/50">
                    {String(conflict.targetValue || '(Empty)')}
                  </div>
                </button>
                <button
                  onClick={() => resolveConflict(conflict.id, 'source')}
                  className={`p-4 text-left transition-all hover:bg-purple-500/5 ${conflict.resolution === 'source' ? 'bg-purple-500/10 ring-1 ring-inset ring-purple-500/50' : ''}`}
                >
                  <div className="text-[10px] text-purple-400 font-bold uppercase mb-1 flex items-center gap-1 justify-end">
                    {sourceBranch.name} <ArrowRight className="w-3 h-3" />
                  </div>
                  <div className="text-sm font-mono text-white bg-slate-950 p-2 rounded border border-slate-700/50 text-right">
                    {String(conflict.sourceValue || '(Empty)')}
                  </div>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-800/80 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
        >
          Cancel Merge
        </button>
        <div className="flex items-center gap-4">
          <p className="text-[11px] text-slate-400">
            {pendingCount === 0 ? (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <Check className="w-4 h-4" /> All conflicts resolved
              </span>
            ) : (
              <span>{pendingCount} conflicts remaining</span>
            )}
          </p>
          <button
            disabled={pendingCount > 0}
            onClick={handleFinalMerge}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-sm font-bold shadow-xl shadow-purple-900/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            Complete Merge
          </button>
        </div>
      </div>
    </div>
  );
};

export default MergeConflictView;
