import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Upload, FileSpreadsheet, MoreVertical, Search, Trash2, Edit2,
  LayoutGrid, List as ListIcon, Pin, PinOff, Copy, FileDown, Home, FolderOpen,
  Trash2 as TrashIcon, Settings, FileText, Calendar, DollarSign, ChevronDown,
  Activity, Share2, User as UserIcon, Clock, HardDrive, Filter, ArrowUpDown
} from 'lucide-react';
import { FileMetadata } from '../types';
import {
  getFiles,
  getPinnedFiles,
  getRecentFiles,
  getTrashFiles,
  getFilesGroupedByName,
  getRecentGrouped,
  deleteFile,
  renameFile,
  pinFile,
  unpinFile,
  moveToTrash,
  restoreFromTrash,
  duplicateFile,
} from '../services/storageService';

const RECENT_LIMIT = 12;

interface HomeViewProps {
  currentUser?: { name: string; email: string } | null;
  onOpenFile: (id: string) => void;
  onNewFile: () => void;
  onUpload: (file: File) => void;
  onTemplate: (type: 'budget' | 'invoice' | 'schedule') => void;
  onOpenSettings?: () => void;
  onDownloadFile?: (id: string) => void;
}

type NavSection = 'home' | 'all' | 'trash' | 'templates';

const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  onOpenFile,
  onNewFile,
  onUpload,
  onTemplate,
  onOpenSettings,
  onDownloadFile,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const [navSection, setNavSection] = useState<NavSection>('home');
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const refreshFiles = () => setFiles(getFiles());

  useEffect(() => {
    const t = setTimeout(() => {
      refreshFiles();
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, []);

  const pinned = useMemo(() => getPinnedFiles(), [files]);
  const trash = useMemo(() => getTrashFiles(), [files]);
  const grouped = useMemo(() => getFilesGroupedByName(), [files]);
  const recentGrouped = useMemo(() => getRecentGrouped(showAllRecent ? 999 : RECENT_LIMIT), [files, showAllRecent]);
  const totalRecentCount = useMemo(() => getRecentFiles(999).length, [files]);

  const handleDelete = (id: string, fromTrash = false) => {
    if (fromTrash || confirm('Move to trash? You can restore from Trash.')) {
      if (fromTrash) deleteFile(id);
      else moveToTrash(id);
      refreshFiles();
    }
    setActiveMenuId(null);
  };

  const handleRestore = (id: string) => {
    restoreFromTrash(id);
    refreshFiles();
    setActiveMenuId(null);
  };

  const handleRename = (id: string, name: string) => {
    setRenamingId(id);
    setTempName(name);
    setActiveMenuId(null);
  };

  const submitRename = () => {
    if (renamingId && tempName.trim()) {
      renameFile(renamingId, tempName);
      refreshFiles();
    }
    setRenamingId(null);
  };

  const handleDuplicate = (id: string) => {
    duplicateFile(id);
    refreshFiles();
    setActiveMenuId(null);
  };

  const handlePinToggle = (id: string, isPinned: boolean) => {
    if (isPinned) unpinFile(id);
    else pinFile(id);
    refreshFiles();
    setActiveMenuId(null);
  };

  const filtered = (list: FileMetadata[]) =>
    searchQuery.trim()
      ? list.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : list;

  const filteredPinned = filtered(pinned);
  const filteredTrash = filtered(trash);
  const filteredGrouped = useMemo(() => {
    if (!searchQuery.trim()) return grouped;
    return grouped
      .map((g) => ({ ...g, files: g.files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())) }))
      .filter((g) => g.files.length > 0);
  }, [grouped, searchQuery]);

  const filteredRecentGrouped = useMemo(() => {
    if (!searchQuery.trim()) return recentGrouped;
    return recentGrouped
      .map((g) => ({ ...g, files: g.files.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())) }))
      .filter((g) => g.files.length > 0);
  }, [recentGrouped, searchQuery]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragActive(true); };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragActive(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
  };

  const handleFileUpload = (file: File) => {
    const valid = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', '.xlsx', '.xls', '.csv'];
    if (!valid.some((t) => file.type === t || file.name.toLowerCase().endsWith(t))) {
      alert('Please upload a valid Excel or CSV file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB.');
      return;
    }
    onUpload(file);
  };

  const formatMeta = (f: FileMetadata) => {
    const rows = `${f.rowCount} rows`;
    const date = f.lastOpened ? new Date(f.lastOpened).toLocaleDateString() : new Date(f.lastModified).toLocaleDateString();
    const label = f.lastOpened ? 'Last opened' : 'Modified';
    return `${rows} · ${label} ${date}`;
  };

  const renderFileCard = (file: FileMetadata, opts?: { inTrash?: boolean; showPin?: boolean }) => {
    const inTrash = opts?.inTrash ?? false;
    const showPin = opts?.showPin ?? true;

    return (
      <div
        key={file.id}
        className={`group relative bg-slate-900/40 border border-slate-800/60 hover:border-cyan-500/50 hover:bg-slate-800/40 rounded-2xl transition-all duration-300 ${viewMode === 'list' ? 'flex items-center p-4 gap-4' : 'flex flex-col'
          } ${inTrash ? 'opacity-70' : ''}`}
      >
        {viewMode === 'grid' && (
          <div
            className="h-32 bg-slate-950/40 rounded-t-2xl border-b border-slate-800 flex items-center justify-center cursor-pointer relative overflow-hidden group-hover:bg-slate-900/40 transition-colors"
            onClick={() => !inTrash && onOpenFile(file.id)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <FileSpreadsheet className="w-12 h-12 text-emerald-500/40 group-hover:scale-110 group-hover:text-emerald-400 transition-all duration-500" />

            {file.pinned && showPin && (
              <div className="absolute top-3 right-3 p-1.5 bg-amber-500/10 rounded-full">
                <Pin className="w-3 h-3 text-amber-500" fill="currentColor" />
              </div>
            )}
          </div>
        )}

        <div className={`flex-1 ${viewMode === 'grid' ? 'p-5' : ''} flex items-center justify-between min-w-0`}>
          <div className="flex items-center gap-4 overflow-hidden min-w-0 flex-1 group/title" onClick={() => !inTrash && onOpenFile(file.id)}>
            {viewMode === 'list' && (
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 group-hover/title:bg-emerald-500/20 transition-colors">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {renamingId === file.id ? (
                <input
                  autoFocus
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={submitRename}
                  onKeyDown={(e) => e.key === 'Enter' && submitRename()}
                  className="bg-slate-950 text-white text-sm px-3 py-1.5 rounded-lg border border-cyan-500 outline-none w-full shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h3 className="text-sm font-bold text-white truncate group-hover/title:text-cyan-400 transition-colors flex items-center gap-2">
                  {file.name}
                  {viewMode === 'list' && file.pinned && <Pin className="w-3 h-3 text-amber-500 fill-current" />}
                </h3>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800/50 rounded-full border border-white/5">
                  <Clock className="w-2.5 h-2.5 text-slate-500" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{formatMeta(file).split('·')[1].trim()}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800/50 rounded-full border border-white/5">
                  <HardDrive className="w-2.5 h-2.5 text-slate-500" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{file.rowCount} Rows</p>
                </div>
                {inTrash && <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase font-black tracking-tighter border border-red-500/20">Trash</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!inTrash && (
              <div className="relative shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === file.id ? null : file.id); }}
                  className={`p-2 rounded-xl transition-all ${activeMenuId === file.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {activeMenuId === file.id && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-20 py-2 backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={() => onOpenFile(file.id)} className="w-full text-left px-4 py-2.5 text-xs text-white hover:bg-white/5 flex items-center gap-3 transition-colors font-medium"><FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Open Workbook</button>
                    <button onClick={() => handleRename(file.id, file.name)} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors font-medium"><Edit2 className="w-4 h-4 text-blue-500" /> Rename</button>
                    <button onClick={() => handleDuplicate(file.id)} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors font-medium"><Copy className="w-4 h-4 text-purple-500" /> Duplicate</button>
                    {onDownloadFile && <button onClick={() => onDownloadFile(file.id)} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors font-medium"><FileDown className="w-4 h-4 text-amber-500" /> Download CSV</button>}

                    <div className="h-px bg-slate-800 my-2 mx-2" />

                    {showPin && (
                      <button onClick={() => handlePinToggle(file.id, !!file.pinned)} className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5 flex items-center gap-3 transition-colors font-medium">
                        {file.pinned ? <><PinOff className="w-4 h-4 text-amber-400" /> Unpin from Top</> : <><Pin className="w-4 h-4 text-amber-400" /> Pin to Top</>}
                      </button>
                    )}

                    <button onClick={() => { moveToTrash(file.id); refreshFiles(); setActiveMenuId(null); }} className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors font-bold"><Trash2 className="w-4 h-4" /> Move to Trash</button>
                  </div>
                )}
              </div>
            )}

            {inTrash && (
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleRestore(file.id)}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors"
                >
                  Restore
                </button>
                <button
                  onClick={() => handleDelete(file.id, true)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                  title="Delete Permanently"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGrouped = (name: string, fileList: FileMetadata[]) => {
    const isExpanded = expandedGroup === name;
    const displayName = fileList.length > 1 ? `${name} (${fileList.length})` : name;

    if (fileList.length > 1) {
      return (
        <div key={name} className="space-y-3">
          <div
            className={`group relative bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl flex items-center justify-between px-5 py-4 cursor-pointer transition-all duration-300 ${isExpanded ? 'ring-2 ring-cyan-500/20 bg-slate-800/40' : ''}`}
            onClick={() => setExpandedGroup(isExpanded ? null : name)}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-cyan-400">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate">{displayName}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{fileList.length} Versions Storage</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-cyan-400' : ''}`} />
          </div>
          {isExpanded && (
            <div className="pl-6 space-y-3 border-l-2 border-slate-800/60 ml-4 animate-in slide-in-from-left-2 fade-in duration-300">
              {fileList.map((f) => renderFileCard(f, { showPin: true }))}
            </div>
          )}
        </div>
      );
    }
    return renderFileCard(fileList[0], { showPin: true });
  };

  const skeleton = (key: number) => (
    <div key={key} className="bg-slate-900/40 border border-slate-800/60 rounded-2xl overflow-hidden animate-pulse">
      <div className="h-32 bg-slate-800/30" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-slate-800/50 rounded-lg w-3/4" />
        <div className="h-3 bg-slate-800/30 rounded-lg w-1/2" />
      </div>
    </div>
  );

  const emptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center animate-in fade-in zoom-in-95 duration-1000">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full" />
        <div className="relative w-24 h-24 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center shadow-2xl">
          <Activity className="w-10 h-10 text-cyan-500" />
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-3">Your workspace is quiet</h3>
      <p className="text-slate-500 max-w-sm mx-auto mb-10 leading-relaxed font-medium">
        Ready to build the future? Start with a blank sheet or explore our professional templates to get started in seconds.
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={onNewFile}
          className="px-6 py-3 bg-cyan-500 text-white rounded-2xl font-bold text-sm hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform hover:-translate-y-1"
        >
          New Spreadsheet
        </button>
        <button
          onClick={() => setNavSection('templates')}
          className="px-6 py-3 bg-slate-800 text-slate-200 rounded-2xl font-bold text-sm hover:bg-slate-700 transition-all border border-white/5"
        >
          View Templates
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-1 overflow-hidden bg-slate-950 font-sans ${isDragActive ? 'bg-slate-900/50 border-2 border-dashed border-cyan-500/50' : ''}`} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {/* Sidebar - Narrow & Pro */}
      <aside className="w-56 shrink-0 border-r border-slate-800/60 flex flex-col bg-slate-900/20 backdrop-blur-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8 group cursor-pointer" onClick={() => setNavSection('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform duration-300">
              <Activity className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-white tracking-tighter text-lg leading-none">RealSheet</span>
              <span className="text-[10px] text-cyan-500 font-bold tracking-[0.2em] uppercase">Enterprise</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-2">
          {[
            { id: 'home' as NavSection, label: 'Dashboard', icon: Home },
            { id: 'all' as NavSection, label: 'All Files', icon: FolderOpen },
            { id: 'templates' as NavSection, label: 'Templates', icon: FileText },
            { id: 'trash' as NavSection, label: 'Trash', icon: TrashIcon },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setNavSection(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-bold transition-all duration-300 relative group/nav ${navSection === id
                ? 'bg-cyan-500/10 text-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                }`}
            >
              {navSection === id && <div className="absolute left-0 w-1 h-6 bg-cyan-500 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" />}
              <Icon className={`w-5 h-5 transition-transform group-hover/nav:scale-110 ${navSection === id ? 'animate-pulse' : ''}`} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800/60">
          <div className="bg-slate-900/40 rounded-2xl p-4 border border-white/5 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Storage</span>
              </div>
              <span className="text-[10px] font-bold text-cyan-400">68%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mb-2 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-2/3 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
            </div>
            <p className="text-[10px] text-slate-500 font-medium text-center">3.4 GB of 5 GB used</p>
          </div>

          <button onClick={onOpenSettings} className="w-full mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </aside>

      <div className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900/20 via-slate-950 to-slate-950">
        <div className="max-w-6xl mx-auto px-8 py-10 space-y-12">
          {/* Top Bar / Greeting */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight leading-none mb-2">
                {getGreeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{currentUser?.name?.split(' ')[0] || 'Guest'}</span>
              </h1>
              <p className="text-slate-500 text-sm font-medium">Ready to build something amazing today?</p>
            </div>
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
              <input
                type="text"
                placeholder="Search resources, templates, and files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-slate-900/40 border border-slate-800 rounded-2xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all backdrop-blur-xl shadow-2xl"
              />
            </div>
          </div>

          {/* New Implementation of Sections */}
          {(navSection === 'home' || navSection === 'templates') && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Start Fresh</h2>
                <button className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">Browse Marketplace</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {/* Blank Template */}
                <button onClick={onNewFile} className="group flex flex-col items-start text-left">
                  <div className="w-full aspect-[1.4/1] bg-gradient-to-tr from-slate-900 to-slate-800 border-2 border-slate-800 rounded-2xl mb-4 flex items-center justify-center transition-all duration-500 group-hover:border-cyan-500/50 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(6,182,212,0.15)] relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <Plus className="w-12 h-12 text-cyan-500/80 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  </div>
                  <span className="text-sm font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">Blank Spreadsheet</span>
                  <p className="text-xs text-slate-500">Unleash your data engine</p>
                </button>

                {/* Templates */}
                {[
                  { type: 'budget', label: 'Financial Budget', icon: DollarSign, color: 'emerald', desc: 'Track income & expenses' },
                  { type: 'finance', label: 'Risk Audit', icon: Activity, color: 'cyan', desc: 'Financial risk modeling' },
                  { type: 'real_estate', label: 'Inventory', icon: HardDrive, color: 'indigo', desc: 'Supply chain tracking' },
                ].map((tpl) => (
                  <button key={tpl.type} onClick={() => onTemplate(tpl.type as any)} className="group flex flex-col items-start text-left">
                    <div className={`w-full aspect-[1.4/1] bg-slate-900 border border-slate-800/80 rounded-2xl mb-4 flex items-center justify-center transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] relative overflow-hidden`}>
                      <div className={`absolute inset-0 bg-gradient-to-tr opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${
                        tpl.color === 'emerald' ? 'from-emerald-500' :
                        tpl.color === 'cyan' ? 'from-cyan-500' : 'from-indigo-500'
                      }`} />
                      <tpl.icon className={`w-10 h-10 transition-all duration-500 group-hover:scale-110 ${
                        tpl.color === 'emerald' ? 'text-emerald-500/70 group-hover:text-emerald-400' :
                        tpl.color === 'cyan' ? 'text-cyan-500/70 group-hover:text-cyan-400' : 'text-indigo-500/70 group-hover:text-indigo-400'
                      }`} />
                      <div className={`absolute bottom-0 left-0 right-0 h-1 transition-transform duration-500 origin-left scale-x-0 group-hover:scale-x-100 ${
                        tpl.color === 'emerald' ? 'bg-emerald-500' :
                        tpl.color === 'cyan' ? 'bg-cyan-500' : 'bg-indigo-500'
                      }`} />
                    </div>
                    <span className="text-sm font-bold text-white mb-1 group-hover:text-white/90 transition-colors">{tpl.label}</span>
                    <p className="text-xs text-slate-500">{tpl.desc}</p>
                  </button>
                ))}

                {/* Upload Label */}
                <label className="group flex flex-col items-start text-left cursor-pointer">
                  <div className="w-full aspect-[1.4/1] bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl mb-4 flex items-center justify-center transition-all duration-500 group-hover:border-slate-600 group-hover:-translate-y-2 group-hover:bg-slate-900/50">
                    <Upload className="w-10 h-10 text-slate-600 group-hover:text-slate-400 transition-all duration-500" />
                  </div>
                  <span className="text-sm font-bold text-white mb-1 group-hover:text-slate-300 transition-colors">Import Data</span>
                  <p className="text-xs text-slate-500">Excel, CSV, JSON</p>
                  <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => { if (e.target.files?.[0]) { handleFileUpload(e.target.files[0]); e.target.value = ''; } }} />
                </label>
              </div>
            </section>
          )}

          {/* Main Files Area */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setNavSection('home')}
                  className={`text-sm font-bold tracking-widest uppercase transition-colors ${navSection === 'home' ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
                >
                  Recents
                </button>
                <button
                  onClick={() => setNavSection('all')}
                  className={`text-sm font-bold tracking-widest uppercase transition-colors ${navSection === 'all' ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
                >
                  Your Files
                </button>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-cyan-400 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-800 text-cyan-400 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                  title="List View"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Rendering based on Section */}
            <div className="animate-in fade-in duration-500">
              {navSection === 'trash' ? (
                <div className="space-y-4">
                  {filteredTrash.length === 0 ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-600 bg-slate-900/10 rounded-3xl border-2 border-dashed border-slate-900">
                      <TrashIcon className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg font-medium">Trash is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredTrash.map((f) => renderFileCard(f, { inTrash: true }))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="min-h-[400px]">
                  {loading ? (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-3 gap-6' : 'space-y-4'}>
                      {[...Array(6)].map((_, i) => skeleton(i))}
                    </div>
                  ) : filteredRecentGrouped.length === 0 && filteredPinned.length === 0 ? (
                    emptyState()
                  ) : (
                    <div className="space-y-12">
                      {/* Pinned Section */}
                      {filteredPinned.length > 0 && navSection === 'home' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-amber-500/80">
                            <Pin className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">Pinned</span>
                          </div>
                          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' : 'space-y-3'}>
                            {filteredPinned.map((f) => renderFileCard(f, { showPin: true }))}
                          </div>
                        </div>
                      )}

                      {/* Main List */}
                      <div className="space-y-4">
                        {navSection === 'all' && (
                          <div className="flex items-center gap-3 text-slate-500">
                            <FolderOpen className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">All Workspaces</span>
                          </div>
                        )}
                        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6' : 'space-y-3'}>
                          {(navSection === 'home' ? filteredRecentGrouped : filteredGrouped).map((g) => renderGrouped(g.name, g.files))}
                        </div>

                        {navSection === 'home' && !showAllRecent && totalRecentCount > RECENT_LIMIT && (
                          <button onClick={() => setShowAllRecent(true)} className="w-full py-4 text-sm font-bold text-slate-500 hover:text-cyan-400 transition-colors bg-slate-900/20 rounded-2xl border border-slate-800/50 hover:border-cyan-500/30">
                            Show all files
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
