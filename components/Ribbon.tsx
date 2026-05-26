import React from 'react';
import {
  Undo2, Redo2, PaintBucket, DatabaseZap, BarChart3, Table, Wand2, Eye,
  FileDown, Share2, Target, LayoutGrid, FileSpreadsheet, SquareFunction as FunctionSquare, Filter,
  Layout, Printer, FileSpreadsheet as FileExcel, Square, SquareDot, Copy, Eraser,
  DollarSign, Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  ChevronDown, Percent, Hash, Binary, FileJson, Save, Info, Settings, LogOut, Search,
  GitBranch
} from 'lucide-react';

export type RibbonTab = 'file' | 'home' | 'insert' | 'formulas' | 'data' | 'view';

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
  onFormatPainter: () => void;
  isFormatPainterActive?: boolean;
  onCellStyles?: () => void;
  /** View: page layout toggle */
  pageLayoutView?: boolean;
  onPageLayoutToggle?: () => void;
  /** Print area (from selection); clear when no selection */
  onSetPrintArea?: () => void;
  onClearPrintArea?: () => void;
  hasPrintArea?: boolean;
  onCellFormat?: (style: any) => void;
  /** Export Excel and Print (opens print dialog; user can Save as PDF) */
  onExportExcel?: () => void;
  onPrint?: () => void;
}

const Ribbon: React.FC<RibbonProps> = (p) => {
  const tabs: { id: RibbonTab; label: string }[] = [
    { id: 'file', label: 'File' },
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'formulas', label: 'Formulas' },
    { id: 'data', label: 'Data' },
    { id: 'view', label: 'View' },
  ];

  const groupLabel = (label: string) => (
    <div className="absolute bottom-0 left-0 right-0 text-[8px] text-center font-bold uppercase tracking-widest text-slate-500 py-0 border-t border-white/5 bg-slate-900/40">
      {label}
    </div>
  );

  const btn = (icon: React.ReactNode, label: string, onClick: () => void, disabled = false) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center min-w-[48px] py-1 px-1 rounded-xl hover:bg-white/5 transition-all duration-200 disabled:opacity-20 group"
      title={label}
    >
      <div className="mb-1 text-slate-400 group-hover:text-cyan-400 transition-colors">{icon}</div>
      <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 leading-tight truncate px-1 uppercase tracking-tighter transition-colors">{label}</span>
    </button>
  );

  const iconBtn = (icon: React.ReactNode, title: string, onClick: () => void, disabled = false) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="p-2 rounded-xl hover:bg-cyan-500/10 hover:text-cyan-400 text-slate-400 transition-all duration-200 disabled:opacity-20"
      title={title}
    >
      {icon}
    </button>
  );

  return (
    <div
      className="shrink-0 mx-4 my-0.5 rounded-2xl shadow-xl shadow-black/40 border border-slate-800/40 overflow-x-auto relative"
      style={{ background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(20px)' }}
      role="toolbar"
      aria-label="Professional Spreadsheet Ribbon"
    >
      <div
        className="flex items-center gap-0.5 px-3 bg-slate-900/60 border-b border-white/5"
        role="tablist"
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => p.onTabChange(id)}
            className={`px-5 py-1.5 text-[12px] font-bold transition-all duration-200 relative ${p.activeTab === id
              ? 'text-cyan-400'
              : id === 'file' ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            {label}
            {p.activeTab === id && (
              <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
            )}
          </button>
        ))}
      </div>

      <div
        className="px-4 py-1 flex items-stretch gap-0 min-h-[82px] bg-slate-900/20"
        role="tabpanel"
      >
        {p.activeTab === 'file' && (
          <>
            <div className="flex items-center gap-1 pr-6 border-r border-white/5 relative group mr-4 py-1">
              <div className="grid grid-cols-2 gap-2">
                {btn(<Save className="w-4 h-4" />, 'Save', () => { }, !p.sheetData)}
                {btn(<FileDown className="w-4 h-4" />, 'Export', p.onExport, !p.sheetData)}
                {btn(<Printer className="w-4 h-4" />, 'Print', p.onExport, !p.sheetData)}
                {btn(<Info className="w-4 h-4" />, 'Info', () => { }, !p.sheetData)}
              </div>
              {groupLabel('File Operations')}
            </div>
            <div className="flex items-center gap-1 pr-6 relative group py-1">
              <div className="flex gap-0.5">
                {btn(<GitBranch className="w-4 h-4 text-purple-400" />, 'Branches', () => (window as any).openBranchManager?.(), !p.sheetData)}
              </div>
              {groupLabel('Version Control')}
            </div>
          </>
        )}

        {p.activeTab === 'home' && (
          <>
            {/* Clipboard Group */}
            <div className="flex items-center gap-1 pr-6 border-r border-white/5 relative group mr-4 py-1">
              <div className="flex flex-col gap-0.5">
                <button className="flex items-center gap-2 px-2 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg transition-all border border-cyan-500/20">
                  <Copy className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Paste</span>
                </button>
                <div className="flex gap-0.5">
                  {iconBtn(<Bold className="w-3.5 h-3.5" />, 'Cut (Ctrl+X)', () => { }, !p.sheetData)}
                  {iconBtn(<Copy className="w-3.5 h-3.5" />, 'Copy (Ctrl+C)', () => { }, !p.sheetData)}
                  <button
                    type="button"
                    onClick={p.onFormatPainter}
                    disabled={!p.sheetData}
                    className={`p-2 rounded-xl transition-all duration-200 disabled:opacity-20 ${p.isFormatPainterActive ? 'bg-cyan-500 text-slate-900 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'hover:bg-cyan-500/10 hover:text-cyan-400 text-slate-400'}`}
                    title="Format Painter"
                  >
                    <PaintBucket className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {groupLabel('Clipboard')}
            </div>

            {/* Font Group */}
            <div className="flex items-center gap-1 pr-4 border-r border-white/5 relative group mr-3 py-1">
              <div className="flex flex-col gap-1.5 min-w-[120px]">
                <div className="flex items-center justify-between bg-slate-950/40 rounded-lg px-2 py-1 border border-white/5">
                  <span className="text-[11px] text-slate-300 font-medium truncate">Inter</span>
                  <ChevronDown className="w-2.5 h-2.5 text-slate-500" />
                </div>
                <div className="flex items-center gap-0.5">
                  {iconBtn(<Bold className="w-3.5 h-3.5" />, 'Bold', () => p.onCellFormat?.({ fontWeight: 'bold' }), !p.sheetData)}
                  {iconBtn(<Italic className="w-3.5 h-3.5" />, 'Italic', () => p.onCellFormat?.({ fontStyle: 'italic' }), !p.sheetData)}
                  {iconBtn(<Underline className="w-3.5 h-3.5" />, 'Underline', () => p.onCellFormat?.({ textDecoration: 'underline' }), !p.sheetData)}
                  <div className="w-px h-3 bg-white/10 mx-0.5" />
                  {iconBtn(<PaintBucket className="w-3.5 h-3.5" />, 'Fill Color', () => p.onCellFormat?.({ backgroundColor: '#334155' }), !p.sheetData)}
                  {iconBtn(<Type className="w-3.5 h-3.5" />, 'Font Color', () => p.onCellFormat?.({ color: '#22d3ee' }), !p.sheetData)}
                </div>
              </div>
              {groupLabel('Font')}
            </div>

            {/* Alignment Group */}
            <div className="flex items-center gap-1 pr-4 border-r border-white/5 relative group mr-3 py-1">
              <div className="grid grid-cols-3 gap-0.5">
                {iconBtn(<AlignLeft className="w-3.5 h-3.5" />, 'Align Left', () => { })}
                {iconBtn(<AlignCenter className="w-3.5 h-3.5" />, 'Align Center', () => { })}
                {iconBtn(<AlignRight className="w-3.5 h-3.5" />, 'Align Right', () => { })}
                <button className="col-span-3 mt-0.5 py-0.5 px-1.5 hover:bg-white/5 rounded text-[9px] text-slate-400 font-bold border border-white/5 uppercase tracking-tighter transition-colors">Merge & Center</button>
              </div>
              {groupLabel('Alignment')}
            </div>

            {/* Number Group */}
            <div className="flex items-center gap-1 pr-4 border-r border-white/5 relative group mr-3 py-1">
              <div className="flex flex-col gap-1.5 min-w-[100px]">
                <div className="flex items-center justify-between bg-slate-950/40 rounded-lg px-2 py-1 border border-white/5 cursor-pointer hover:border-cyan-500/30 transition-colors" onClick={p.onCellStyles}>
                  <span className="text-[11px] text-slate-300 font-medium">Format</span>
                  <Hash className="w-2.5 h-2.5 text-cyan-500" />
                </div>
                <div className="flex items-center justify-center gap-0.5">
                  {iconBtn(<DollarSign className="w-3.5 h-3.5" />, 'Currency', () => p.onCellFormat?.({ color: '#10b981', fontWeight: '500', format: 'currency' }), !p.sheetData)}
                  {iconBtn(<Percent className="w-3.5 h-3.5" />, 'Percent', () => p.onCellFormat?.({ color: '#3b82f6', fontWeight: '500', format: 'percentage' }), !p.sheetData)}
                  {iconBtn(<Binary className="w-3.5 h-3.5" />, 'Comma', () => p.onCellFormat?.({ format: 'comma' }), !p.sheetData)}
                </div>
              </div>
              {groupLabel('Number')}
            </div>

            {/* Editing/Tools Group */}
            <div className="flex items-center gap-0.5 pr-2 relative group py-1">
              <div className="flex gap-0.5 items-center">
                {btn(<DatabaseZap className="w-3.5 h-3.5" />, 'Tools', p.onDataTools, !p.sheetData)}
                {btn(<Wand2 className="w-3.5 h-3.5" />, 'Fill', p.onSmartFill, !p.sheetData)}
                {btn(<PaintBucket className="w-3.5 h-3.5" />, 'Format', p.onFormatting, !p.sheetData)}
              </div>
              {groupLabel('Editing')}
            </div>
          </>
        )}
        {p.activeTab === 'insert' && (
          <>
            <div className="flex items-center gap-1 pr-4 border-r border-white/5 relative group mr-3 py-1">
              <div className="flex gap-0.5">
                {btn(<Table className="w-3.5 h-3.5" />, 'Pivot', p.onPivot, !p.sheetData)}
                {btn(<LayoutGrid className="w-3.5 h-3.5" />, 'Table', () => { }, !p.sheetData)}
              </div>
              {groupLabel('Tables')}
            </div>
            <div className="flex items-center gap-1 pr-4 border-r border-white/5 relative group mr-3 py-1">
              <div className="flex gap-0.5">
                {btn(<BarChart3 className="w-3.5 h-3.5" />, 'Chart', p.onChart, !p.sheetData)}
                {btn(<FileSpreadsheet className="w-3.5 h-3.5" />, 'Sparklines', () => { }, !p.sheetData)}
              </div>
              {groupLabel('Charts')}
            </div>
          </>
        )}

        {p.activeTab === 'formulas' && (
          <>
            <div className="flex items-center gap-1 pr-4 border-r border-white/5 relative group mr-3 py-1">
              <div className="flex gap-0.5">
                {btn(<FunctionSquare className="w-3.5 h-3.5" />, 'Visual Builder', () => (window as any).openVisualBuilder?.(), !p.sheetData)}
                {btn(<Wand2 className="w-3.5 h-3.5" />, 'AutoSum', () => { }, !p.sheetData)}
              </div>
              {groupLabel('Library')}
            </div>
            <div className="flex items-center gap-1 pr-4 relative group py-1">
              <div className="flex gap-0.5">
                {btn(<Target className="w-3.5 h-3.5" />, 'Goal Seek', p.onGoalSeek, !p.sheetData)}
                {btn(<Wand2 className="w-3.5 h-3.5" />, 'Fill', p.onSmartFill, !p.sheetData)}
              </div>
              {groupLabel('Analysis')}
            </div>
          </>
        )}

        {p.activeTab === 'data' && (
          <>
            <div className="flex items-center gap-1 pr-4 border-r border-white/5 relative group mr-3 py-1">
              <div className="flex gap-0.5">
                {btn(<Filter className="w-3.5 h-3.5" />, 'Sort', () => { }, !p.sheetData)}
                {btn(<Filter className="w-3.5 h-3.5" />, 'Filter', () => { }, !p.sheetData)}
              </div>
              {groupLabel('Sort & Filter')}
            </div>
            <div className="flex items-center gap-1 pr-6 border-r border-white/5 relative group mr-4">
              <div className="flex gap-1">
                {btn(<DatabaseZap className="w-4 h-4" />, 'Clean Data', p.onDataTools, !p.sheetData)}
                {btn(<FileJson className="w-4 h-4" />, 'Text to Cols', () => { }, !p.sheetData)}
              </div>
              {groupLabel('Tools')}
            </div>
          </>
        )}

        {p.activeTab === 'view' && (
          <>
            <div className="flex items-center gap-1 pr-6 border-r border-white/5 relative group mr-4">
              <div className="flex gap-1">
                {btn(<Eye className="w-4 h-4" />, 'Watch', p.onWatchWindow, !p.sheetData)}
                {p.onPageLayoutToggle && btn(<Layout className="w-4 h-4" />, 'Layout', p.onPageLayoutToggle, !p.sheetData)}
              </div>
              {groupLabel('Show')}
            </div>
            <div className="flex items-center gap-1 pr-6 border-r border-white/5 relative group mr-4">
              <div className="flex gap-1">
                {p.onSetPrintArea && btn(<Square className="w-4 h-4" />, 'Set Print', p.onSetPrintArea, !p.sheetData)}
                {p.onClearPrintArea && btn(<SquareDot className="w-4 h-4" />, 'Clear Print', p.onClearPrintArea, !p.sheetData || !p.hasPrintArea)}
              </div>
              {groupLabel('Print Area')}
            </div>
            <div className="flex items-center gap-1 pr-4 relative group py-1">
              <div className="flex gap-0.5">
                {p.onExportExcel && btn(<FileExcel className="w-3.5 h-3.5" />, 'Excel', p.onExportExcel, !p.sheetData)}
                {p.onPrint && btn(<Printer className="w-3.5 h-3.5" />, 'Print', p.onPrint, !p.sheetData)}
              </div>
              {groupLabel('Output')}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Ribbon;
