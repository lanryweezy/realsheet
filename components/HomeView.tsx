import React, { useState, useEffect } from 'react';
import { Plus, Upload, FileSpreadsheet, Clock, MoreVertical, Search, Trash2, Edit2, LayoutGrid, List as ListIcon, Shield, Activity, FileText, Calendar, DollarSign } from 'lucide-react';
import { FileMetadata } from '../types';
import { getFiles, deleteFile, renameFile } from '../services/storageService';

interface HomeViewProps {
  onOpenFile: (id: string) => void;
  onNewFile: () => void;
  onUpload: (file: File) => void;
  onTemplate: (type: 'budget' | 'invoice' | 'schedule') => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onOpenFile, onNewFile, onUpload, onTemplate }) => {
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');

  // Load files on mount
  useEffect(() => {
    refreshFiles();
  }, []);

  const refreshFiles = () => {
    setFiles(getFiles());
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
        deleteFile(id);
        refreshFiles();
    }
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

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          onUpload(e.dataTransfer.files[0]);
      }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6 md:p-10" onDragOver={handleDragOver} onDrop={handleDrop}>
        <div className="max-w-6xl mx-auto space-y-10">
            
            {/* Hero / Start Section */}
            <section>
                <h1 className="text-3xl font-bold text-white mb-6">Start a new spreadsheet</h1>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {/* Blank */}
                    <button onClick={onNewFile} className="group text-left">
                        <div className="aspect-[4/3] bg-slate-900 border border-slate-700 rounded-xl mb-3 flex items-center justify-center group-hover:border-nexus-accent group-hover:shadow-lg group-hover:shadow-nexus-accent/20 transition-all relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-nexus-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Plus className="w-10 h-10 text-nexus-accent transform group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="text-sm font-medium text-slate-200 group-hover:text-white">Blank</span>
                    </button>

                    {/* Templates */}
                    <button onClick={() => onTemplate('budget')} className="group text-left">
                        <div className="aspect-[4/3] bg-slate-900 border border-slate-700 rounded-xl mb-3 flex items-center justify-center group-hover:border-emerald-500 transition-all relative overflow-hidden">
                            <DollarSign className="w-8 h-8 text-emerald-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-200">Budget</span>
                    </button>
                    <button onClick={() => onTemplate('invoice')} className="group text-left">
                        <div className="aspect-[4/3] bg-slate-900 border border-slate-700 rounded-xl mb-3 flex items-center justify-center group-hover:border-blue-500 transition-all relative overflow-hidden">
                            <FileText className="w-8 h-8 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-200">Invoice</span>
                    </button>
                    <button onClick={() => onTemplate('schedule')} className="group text-left">
                        <div className="aspect-[4/3] bg-slate-900 border border-slate-700 rounded-xl mb-3 flex items-center justify-center group-hover:border-purple-500 transition-all relative overflow-hidden">
                            <Calendar className="w-8 h-8 text-purple-500" />
                        </div>
                        <span className="text-sm font-medium text-slate-200">Schedule</span>
                    </button>

                    {/* Upload */}
                    <label className="group text-left cursor-pointer">
                        <div className="aspect-[4/3] bg-slate-900 border border-dashed border-slate-600 rounded-xl mb-3 flex items-center justify-center group-hover:border-white group-hover:bg-slate-800 transition-all">
                            <Upload className="w-8 h-8 text-slate-500 group-hover:text-white" />
                        </div>
                        <span className="text-sm font-medium text-slate-200">Upload .xlsx</span>
                        <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => e.target.files && onUpload(e.target.files[0])} />
                    </label>
                </div>
            </section>

            {/* Recent Files Section */}
            <section>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <h2 className="text-xl font-bold text-white">Recent Spreadsheets</h2>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-nexus-accent outline-none w-64"
                            />
                        </div>
                        <div className="bg-slate-900 border border-slate-700 rounded-lg p-1 flex">
                            <button 
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {files.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800 border-dashed">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Activity className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No files yet</h3>
                        <p className="text-slate-400 max-w-sm mx-auto">
                            Create a new spreadsheet above or drag and drop an Excel file here to get started.
                        </p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
                        {filteredFiles.map(file => (
                            <div 
                                key={file.id}
                                className={`group relative bg-slate-900 border border-slate-700 hover:border-nexus-accent/50 rounded-xl transition-all hover:shadow-lg hover:shadow-cyan-900/10 ${viewMode === 'list' ? 'flex items-center p-3 gap-4' : 'p-0 flex flex-col'}`}
                            >
                                {/* Grid View Preview */}
                                {viewMode === 'grid' && (
                                    <div 
                                        className="h-32 bg-slate-800/50 rounded-t-xl border-b border-slate-700 p-4 cursor-pointer relative overflow-hidden"
                                        onClick={() => onOpenFile(file.id)}
                                    >
                                        {/* Mini Mock Grid */}
                                        <div className="grid grid-cols-3 gap-1 opacity-30">
                                            {[...Array(9)].map((_, i) => (
                                                <div key={i} className="h-4 bg-slate-600 rounded-sm"></div>
                                            ))}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-50" />
                                    </div>
                                )}

                                {/* File Info */}
                                <div className={`flex-1 ${viewMode === 'grid' ? 'p-4' : ''} flex items-center justify-between`}>
                                    <div className="flex items-center gap-3 overflow-hidden" onClick={() => onOpenFile(file.id)}>
                                        <div className={`p-2 rounded-lg bg-emerald-500/10 text-emerald-500 ${viewMode === 'grid' ? 'hidden' : 'block'}`}>
                                            <FileSpreadsheet className="w-5 h-5" />
                                        </div>
                                        
                                        <div className="cursor-pointer min-w-0">
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
                                                <h3 className="text-sm font-semibold text-white truncate group-hover:text-nexus-accent transition-colors">
                                                    {file.name}
                                                </h3>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                                                <span>•</span>
                                                <span>{file.rowCount} rows</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="relative">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === file.id ? null : file.id); }}
                                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                                        >
                                            <MoreVertical className="w-4 h-4" />
                                        </button>

                                        {activeMenuId === file.id && (
                                            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in duration-100">
                                                <button onClick={() => onOpenFile(file.id)} className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-700 flex items-center gap-2">
                                                    <FileSpreadsheet className="w-3.5 h-3.5" /> Open
                                                </button>
                                                <button onClick={() => handleRename(file.id, file.name)} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 flex items-center gap-2">
                                                    <Edit2 className="w-3.5 h-3.5" /> Rename
                                                </button>
                                                <div className="h-px bg-slate-700 my-1" />
                                                <button onClick={() => handleDelete(file.id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2">
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    </div>
  );
};

export default HomeView;