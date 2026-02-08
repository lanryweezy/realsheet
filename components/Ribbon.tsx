import React from 'react';
import {
  Undo2, Redo2, PaintBucket, DatabaseZap, BarChart3, Table, Wand2, Eye,
  FileDown, Share2, Target, LayoutGrid, FileSpreadsheet, FunctionSquare, Filter,
  Layout, Printer, FileSpreadsheet as FileExcel, Square, SquareDot,
} from 'lucide-react';

export type RibbonTab = 'home' | 'insert' | 'formulas' | 'data' | 'view';

interface RibbonProps {
  activeTab: RibbonTab;
  onTabChange: (tab: RibbonTab) => void;
  sheetData: boolean;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onFormatting: () => void;
  onDataTools: () => void;
  onChart: () => void;
  onPivot: () => void;
  onSmartFill: () => void;
  onWatchWindow: () => void;
  isWatchOpen: boolean;
  onExport: () => void;
  onShare: () => void;
  onGoalSeek: () => void;
  /** View: page layout toggle */
  pageLayoutView?: boolean;
  onPageLayoutToggle?: () => void;
  /** Print area (from selection); clear when no selection */
  onSetPrintArea?: () => void;
  onClearPrintArea?: () => void;
  hasPrintArea?: boolean;
  /** Export Excel and Print (opens print dialog; user can Save as PDF) */
  onExportExcel?: () => void;
  onPrint?: () => void;
}

const Ribbon: React.FC<RibbonProps> = (p) => {
  const tabs: { id: RibbonTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'formulas', label: 'Formulas' },
    { id: 'data', label: 'Data' },
    { id: 'view', label: 'View' },
  ];

  const btn = (icon: React.ReactNode, label: string, onClick: () => void, disabled = false) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center min-w-[48px] py-1.5 px-1 rounded text-[11px] transition-colors disabled:opacity-40"
      style={{ color: 'var(--nexus-text-main)' }}
      title={label}
    >
      <span className="mb-0.5" style={{ color: 'var(--nexus-text-muted)' }}>{icon}</span>
      <span className="leading-tight truncate">{label}</span>
    </button>
  );

  const iconBtn = (icon: React.ReactNode, title: string, onClick: () => void, disabled = false) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded hover:bg-black/10 disabled:opacity-40"
      style={{ color: 'var(--nexus-text-main)' }}
      title={title}
    >
      {icon}
    </button>
  );

  return (
    <div className="border-b shrink-0" style={{ background: 'var(--ribbon-bg)', borderColor: 'var(--ribbon-border)' }}>
      <div className="flex items-center gap-0 px-2 border-b" style={{ borderColor: 'var(--ribbon-border)' }}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => p.onTabChange(id)}
            className={`px-4 py-2 text-sm font-medium ${
              p.activeTab === id ? 'border-b-2' : 'opacity-80 hover:opacity-100'
            }`}
            style={{
              color: p.activeTab === id ? 'var(--nexus-accent)' : 'var(--nexus-text-main)',
              borderBottomColor: p.activeTab === id ? 'var(--nexus-accent)' : 'transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="px-3 py-2 flex flex-wrap items-center gap-4 min-h-[68px]">
        {p.activeTab === 'home' && (
          <>
            <div className="flex items-center gap-1 pr-3 border-r" style={{ borderColor: 'var(--nexus-border)' }}>
              <span className="text-[10px] uppercase font-semibold px-1" style={{ color: 'var(--nexus-text-muted)' }}>Clipboard</span>
              <div className="flex gap-0.5">
                {iconBtn(<Undo2 className="w-4 h-4" />, 'Undo', p.onUndo, !p.canUndo)}
                {iconBtn(<Redo2 className="w-4 h-4" />, 'Redo', p.onRedo, !p.canRedo)}
              </div>
            </div>
            <div className="flex items-center gap-1 pr-3 border-r" style={{ borderColor: 'var(--nexus-border)' }}>
              <span className="text-[10px] uppercase font-semibold px-1" style={{ color: 'var(--nexus-text-muted)' }}>Formatting</span>
              {btn(<PaintBucket className="w-4 h-4" />, 'Conditional', p.onFormatting, !p.sheetData)}
            </div>
            <div className="flex items-center gap-1 pr-3 border-r" style={{ borderColor: 'var(--nexus-border)' }}>
              <span className="text-[10px] uppercase font-semibold px-1" style={{ color: 'var(--nexus-text-muted)' }}>Data</span>
              {btn(<DatabaseZap className="w-4 h-4" />, 'Data Tools', p.onDataTools, !p.sheetData)}
              {btn(<Wand2 className="w-4 h-4" />, 'Smart Fill', p.onSmartFill, !p.sheetData)}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-semibold px-1" style={{ color: 'var(--nexus-text-muted)' }}>Actions</span>
              {btn(<FileDown className="w-4 h-4" />, 'Export', p.onExport, !p.sheetData)}
              {btn(<Share2 className="w-4 h-4" />, 'Share', p.onShare, !p.sheetData)}
            </div>
          </>
        )}
        {p.activeTab === 'insert' && (
          <>
            <div className="flex items-center gap-1 pr-3 border-r" style={{ borderColor: 'var(--nexus-border)' }}>
              <span className="text-[10px] uppercase font-semibold px-1" style={{ color: 'var(--nexus-text-muted)' }}>Charts</span>
              {btn(<BarChart3 className="w-4 h-4" />, 'Chart', p.onChart, !p.sheetData)}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-semibold px-1" style={{ color: 'var(--nexus-text-muted)' }}>Tables</span>
              {btn(<Table className="w-4 h-4" />, 'Pivot Table', p.onPivot, !p.sheetData)}
            </div>
          </>
        )}
        {p.activeTab === 'formulas' && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase font-semibold px-1" style={{ color: 'var(--nexus-text-muted)' }}>Analysis</span>
            {btn(<Target className="w-4 h-4" />, 'Goal Seek', p.onGoalSeek, !p.sheetData)}
            {btn(<FunctionSquare className="w-4 h-4" />, 'Smart Fill', p.onSmartFill, !p.sheetData)}
          </div>
        )}
        {p.activeTab === 'data' && (
          <>
            <div className="flex items-center gap-1 pr-3 border-r" style={{ borderColor: 'var(--nexus-border)' }}>
              <span className="text-[10px] uppercase font-semibold px-1" style={{ color: 'var(--nexus-text-muted)' }}>Data Tools</span>
              {btn(<DatabaseZap className="w-4 h-4" />, 'Data Tools', p.onDataTools, !p.sheetData)}
              {btn(<Filter className="w-4 h-4" />, 'Dedup & Split', p.onDataTools, !p.sheetData)}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-semibold px-1" style={{ color: 'var(--nexus-text-muted)' }}>Tables</span>
              {btn(<Table className="w-4 h-4" />, 'Pivot Table', p.onPivot, !p.sheetData)}
            </div>
          </>
        )}
        {p.activeTab === 'view' && (
          <>
            <div className="flex items-center gap-1 pr-3 border-r" style={{ borderColor: 'var(--nexus-border)' }}>
              <span className="text-[10px] uppercase font-semibold px-1" style={{ color: 'var(--nexus-text-muted)' }}>Show</span>
              {btn(<Eye className="w-4 h-4" />, p.isWatchOpen ? 'Hide Watch' : 'Watch Window', p.onWatchWindow, !p.sheetData)}
              {p.onPageLayoutToggle && btn(<Layout className="w-4 h-4" />, p.pageLayoutView ? 'Normal View' : 'Page Layout', p.onPageLayoutToggle, !p.sheetData)}
            </div>
            <div className="flex items-center gap-1 pr-3 border-r" style={{ borderColor: 'var(--nexus-border)' }}>
              <span className="text-[10px] uppercase font-semibold px-1" style={{ color: 'var(--nexus-text-muted)' }}>Print area</span>
              {p.onSetPrintArea && btn(<Square className="w-4 h-4" />, 'Set print area', p.onSetPrintArea, !p.sheetData)}
              {p.onClearPrintArea && btn(<SquareDot className="w-4 h-4" />, 'Clear print area', p.onClearPrintArea, !p.sheetData || !p.hasPrintArea)}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase font-semibold px-1" style={{ color: 'var(--nexus-text-muted)' }}>Export &amp; print</span>
              {p.onExportExcel && btn(<FileExcel className="w-4 h-4" />, 'Export Excel', p.onExportExcel, !p.sheetData)}
              {p.onPrint && btn(<Printer className="w-4 h-4" />, 'Print / PDF', p.onPrint, !p.sheetData)}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Ribbon;
