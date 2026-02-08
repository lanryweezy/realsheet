import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Upload, FileSpreadsheet, MoreVertical, Search, Trash2, Edit2,
  LayoutGrid, List as ListIcon, Pin, PinOff, Copy, FileDown, Home, FolderOpen,
  Trash2 as TrashIcon, Settings, FileText, Calendar, DollarSign, ChevronDown,
  Activity, Share2
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
  onOpenFile: (id: string) => void;
  onNewFile: () => void;
  onUpload: (file: File) => void;
  onTemplate: (type: 'budget' | 'invoice' | 'schedule') => void;
  onOpenSettings?: () => void;
  onDownloadFile?: (id: string) => void;
}

type NavSection = 'home' | 'all' | 'trash' | 'templates';

const HomeView: React.FC<HomeViewProps> = ({
  onOpenFile,
  onNewFile,
  onUpload,
  onTemplate,
  onOpenSettings,
  onDownloadFile,
}) => {
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
      <div key={file.id} className={`group relative bg-slate-900 border border-slate-700 hover:border-nexus-accent/50 rounded-xl transition-all ${viewMode === 'list' ? 'flex items-center p-3 gap-4' : 'flex flex-col'}`}>
        {viewMode === 'grid' && (
          <div className="h-28 bg-slate-800/50 rounded-t-xl border-b border-slate-700 flex items-center justify-center cursor-pointer" onClick={() => !inTrash && onOpenFile(file.id)}>
            <FileSpreadsheet className="w-10 h-10 text-emerald-500/70" />
          </div>
        )}
        <div className={`flex-1 ${viewMode === 'grid' ? 'p-4' : ''} flex items-center justify-between min-w-0`}>
          <div className="flex items-center gap-3 overflow-hidden min-w-0" onClick={() => !inTrash && onOpenFile(file.id)}>
            {viewMode === 'list' && (
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              {renamingId === file.id ? (
                <input
                  autoFocus
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={submitRename}
                  onKeyDown={(e) => e.key === 'Enter' && submitRename()}
                  className="bg-slate-800 text-white text-sm px-2 py-1 rounded border border-nexus-accent outline-none w-full"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h3 className="text-sm font-semibold text-white truncate">{file.name}</h3>
              )}
              <p className="text-xs text-slate-500 mt-0.5">{formatMeta(file)}</p>
            </div>
          </div>
          {!inTrash && (
            <div className="relative shrink-0">
              <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === file.id ? null : file.id); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
                <MoreVertical className="w-4 h-4" />
              </button>
              {activeMenuId === file.id && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 py-1">
                  <button onClick={() => onOpenFile(file.id)} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 flex items-center gap-2"><FileSpreadsheet className="w-3.5 h-3.5" /> Open</button>
                  <button onClick={() => handleRename(file.id, file.name)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"><Edit2 className="w-3.5 h-3.5" /> Rename</button>
                  <button onClick={() => handleDuplicate(file.id)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"><Copy className="w-3.5 h-3.5" /> Duplicate</button>
                  {onDownloadFile && <button onClick={() => onDownloadFile(file.id)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2"><FileDown className="w-3.5 h-3.5" /> Download CSV</button>}
                  {showPin && (
                    <button onClick={() => handlePinToggle(file.id, !!file.pinned)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                      {file.pinned ? <><PinOff className="w-3.5 h-3.5" /> Unpin</> : <><Pin className="w-3.5 h-3.5" /> Pin</>}
                    </button>
                  )}
                  <div className="h-px bg-slate-700 my-1" />
                  <button onClick={() => { moveToTrash(file.id); refreshFiles(); setActiveMenuId(null); }} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Move to Trash</button>
                </div>
              )}
            </div>
          )}
          {inTrash && (
            <div className="flex gap-1 shrink-0">
              <button onClick={() => handleRestore(file.id)} className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded-lg">Restore</button>
              <button onClick={() => handleDelete(file.id, true)} className="p-1.5 text-red-400 hover:bg-slate-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGrouped = (name: string, fileList: FileMetadata[]) => {
    const isExpanded = expandedGroup === name;
    const displayName = fileList.length > 1 ? `${name} (${fileList.length})` : name;
    if (fileList.length > 1) {
      return (
        <div key={name} className="space-y-1">
          <div className="group relative bg-slate-900 border border-slate-700 hover:border-nexus-accent/50 rounded-xl flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setExpandedGroup(isExpanded ? null : name)}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500"><FileSpreadsheet className="w-5 h-5" /></div>
              <div>
                <h3 className="text-sm font-semibold text-white truncate">{displayName}</h3>
                <p className="text-xs text-slate-500">{fileList.length} versions</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
          {isExpanded && <div className="pl-4 space-y-2 border-l-2 border-slate-700 ml-2">{fileList.map((f) => renderFileCard(f, { showPin: true }))}</div>}
        </div>
      );
    }
    return renderFileCard(fileList[0], { showPin: true });
  };

  const skeleton = () => (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden animate-pulse">
      <div className="h-28 bg-slate-800/50" />
      <div className="p-4 space-y-2"><div className="h-4 bg-slate-700 rounded w-3/4" /><div className="h-3 bg-slate-800 rounded w-1/2" /></div>
    </div>
  );

  const emptyState = () => (
    <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-dashed border-slate-700">
      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4"><Activity className="w-8 h-8 text-slate-500" /></div>
      <h3 className="text-lg font-medium text-white mb-2">No spreadsheets yet</h3>
      <p className="text-slate-400 max-w-sm mx-auto mb-6">RealSheet is a fast, keyboard-first spreadsheet. Start with a blank sheet or try a template below.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={onNewFile} className="px-4 py-2 bg-nexus-accent text-white rounded-lg font-medium hover:bg-cyan-600">Blank spreadsheet</button>
        <button onClick={() => onTemplate('budget')} className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600">Budget template</button>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-1 overflow-hidden bg-slate-950 ${isDragActive ? 'bg-slate-900/50 border-2 border-dashed border-nexus-accent' : ''}`} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <aside className="w-52 shrink-0 border-r border-slate-800 flex flex-col bg-slate-900/50">
        <nav className="p-2 space-y-0.5">
          {[
            { id: 'home' as NavSection, label: 'Home', icon: Home },
            { id: 'all' as NavSection, label: 'All files', icon: FolderOpen },
            { id: 'trash' as NavSection, label: 'Trash', icon: TrashIcon },
            { id: 'templates' as NavSection, label: 'Templates', icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setNavSection(id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium ${navSection === id ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'}`}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
          <div className="h-px bg-slate-700 my-2" />
          {onOpenSettings && (
            <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm text-slate-400 hover:bg-slate-800/50 hover:text-white">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          )}
        </nav>
      </aside>
      <div className="flex-1 overflow-y-auto p-6 md:p-10">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input type="text" placeholder="Search spreadsheets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-nexus-accent focus:border-transparent" />
          </div>

          {(navSection === 'home' || navSection === 'templates') && (
            <section className="bg-slate-900/60 border border-slate-700 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Start a new spreadsheet</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <button onClick={onNewFile} className="group text-left">
                  <div className="aspect-[4/3] bg-slate-800 border border-slate-700 rounded-xl mb-3 flex items-center justify-center group-hover:border-nexus-accent transition-all"><Plus className="w-10 h-10 text-nexus-accent" /></div>
                  <span className="text-sm font-medium text-slate-200">Blank</span>
                </button>
                <button onClick={() => onTemplate('budget')} className="group text-left">
                  <div className="aspect-[4/3] bg-slate-800 border border-slate-700 rounded-xl mb-3 flex items-center justify-center group-hover:border-emerald-500"><DollarSign className="w-8 h-8 text-emerald-500" /></div>
                  <span className="text-sm font-medium text-slate-200">Budget</span>
                </button>
                <button onClick={() => onTemplate('invoice')} className="group text-left">
                  <div className="aspect-[4/3] bg-slate-800 border border-slate-700 rounded-xl mb-3 flex items-center justify-center group-hover:border-blue-500"><FileText className="w-8 h-8 text-blue-500" /></div>
                  <span className="text-sm font-medium text-slate-200">Invoice</span>
                </button>
                <button onClick={() => onTemplate('schedule')} className="group text-left">
                  <div className="aspect-[4/3] bg-slate-800 border border-slate-700 rounded-xl mb-3 flex items-center justify-center group-hover:border-purple-500"><Calendar className="w-8 h-8 text-purple-500" /></div>
                  <span className="text-sm font-medium text-slate-200">Schedule</span>
                </button>
                <label className="group text-left cursor-pointer">
                  <div className="aspect-[4/3] bg-slate-800 border border-dashed border-slate-600 rounded-xl mb-3 flex items-center justify-center group-hover:border-white group-hover:bg-slate-700"><Upload className="w-8 h-8 text-slate-500 group-hover:text-white" /></div>
                  <span className="text-sm font-medium text-slate-200">Upload</span>
                  <input type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => { if (e.target.files?.[0]) { handleFileUpload(e.target.files[0]); e.target.value = ''; } }} />
                </label>
              </div>
            </section>
          )}

          {navSection === 'home' && (
            <>
              {filteredPinned.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Pinned</h2>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
                    {loading ? [...Array(3)].map((_, i) => <div key={i}>{skeleton()}</div>) : filteredPinned.map((f) => renderFileCard(f, { showPin: true }))}
                  </div>
                </section>
              )}
              <section>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Recent</h2>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-1 flex">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}><LayoutGrid className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}><ListIcon className="w-4 h-4" /></button>
                  </div>
                </div>
                {loading ? (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>{[...Array(6)].map((_, i) => skeleton())}</div>
                ) : filteredRecentGrouped.length === 0 && filteredPinned.length === 0 ? (
                  emptyState()
                ) : (
                  <>
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
                      {filteredRecentGrouped.map((g) => renderGrouped(g.name, g.files))}
                    </div>
                    {!showAllRecent && totalRecentCount > RECENT_LIMIT && (
                      <button onClick={() => setShowAllRecent(true)} className="mt-4 text-sm text-nexus-accent hover:underline">View all</button>
                    )}
                  </>
                )}
              </section>
              <section>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Shared with me</h2>
                <div className="py-8 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 flex flex-col items-center text-slate-500">
                  <Share2 className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">Shared spreadsheets will appear here</p>
                </div>
              </section>
            </>
          )}

          {navSection === 'all' && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">All files</h2>
              {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => skeleton())}</div> : filteredGrouped.length === 0 ? emptyState() : <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>{filteredGrouped.map((g) => renderGrouped(g.name, g.files))}</div>}
            </section>
          )}

          {navSection === 'trash' && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Trash</h2>
              {filteredTrash.length === 0 ? (
                <div className="py-12 rounded-xl border border-dashed border-slate-700 bg-slate-900/30 text-center text-slate-500">
                  <TrashIcon className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No items in Trash</p>
                </div>
              ) : (
                <div className="space-y-2">{filteredTrash.map((f) => renderFileCard(f, { inTrash: true }))}</div>
              )}
            </section>
          )}

          {navSection === 'templates' && <section><p className="text-slate-400 text-sm">Use the templates above to start a new spreadsheet.</p></section>}
        </div>
      </div>
    </div>
  );
};

export default HomeView;
