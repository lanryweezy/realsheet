import React, { useState } from 'react';
import { GitBranch, Plus, GitCommit as Commit, History, X, Check, ArrowRight, GitMerge } from 'lucide-react';
import { Branch, Commit as CommitType, Workbook } from '../types';
import { createBranch, getBranches, getCommits, createCommit, saveBranch, saveCommit, mergeBranches } from '../services/versionControlService';
import MergeConflictView from './MergeConflictView';

interface BranchManagerProps {
  isOpen: boolean;
  onClose: () => void;
  workbook: Workbook;
  onSwitchBranch: (branch: Branch) => void;
  onUpdateWorkbook: (workbook: Workbook) => void;
}

const BranchManager: React.FC<BranchManagerProps> = ({
  isOpen,
  onClose,
  workbook,
  onSwitchBranch,
  onUpdateWorkbook
}) => {
  const [activeTab, setActiveTab] = useState<'branches' | 'history' | 'merge'>('branches');
  const [newBranchName, setNewBranchName] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [mergeSource, setMergeSource] = useState<Branch | null>(null);

  const branches = getBranches(workbook.id);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(branches.length > 0 ? branches[0] : null);
  const commits = currentBranch ? getCommits(currentBranch.id) : [];

  const handleCreateBranch = () => {
    if (!newBranchName.trim()) return;
    const branch = createBranch(newBranchName, workbook, currentBranch?.id);
    saveBranch(branch);
    setNewBranchName('');
    setCurrentBranch(branch);
  };

  const handleCreateCommit = () => {
    if (!commitMessage.trim() || !currentBranch) return;
    const commit = createCommit(currentBranch.id, commitMessage, workbook);
    saveCommit(commit);
    setCommitMessage('');

    // Update branch last modified
    const updatedBranch = { ...currentBranch, lastModified: Date.now(), workbook: JSON.parse(JSON.stringify(workbook)) };
    saveBranch(updatedBranch);
    setCurrentBranch(updatedBranch);
  };

  const handleMergeResolve = (finalWorkbook: Workbook) => {
    onUpdateWorkbook(finalWorkbook);
    setActiveTab('branches');
    setMergeSource(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col ${activeTab === 'merge' ? 'h-[80vh]' : ''}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {activeTab === 'merge' ? <GitMerge className="w-5 h-5 text-purple-400" /> : <GitBranch className="w-5 h-5 text-purple-400" />}
            {activeTab === 'merge' ? 'Resolve Conflicts' : 'Version Control'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white focus-visible:ring-2 focus-visible:outline-none rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeTab !== 'merge' && (
          <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('branches')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'branches' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5' : 'text-slate-400 hover:bg-white/5'}`}
          >
            Branches
          </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'history' ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-400/5' : 'text-slate-400 hover:bg-white/5'}`}
            >
              Commit History
            </button>
          </div>
        )}

        <div className={`flex-1 overflow-y-auto ${activeTab === 'merge' ? '' : 'p-6 h-[400px]'}`}>
          {activeTab === 'branches' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Create New Branch</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="feature/new-analysis"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                  <button
                    onClick={handleCreateBranch}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg font-bold transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Branch
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Active Branches</h3>
                <div className="space-y-2">
                  {branches.length === 0 && <p className="text-slate-600 italic text-sm">No branches yet. Create one to start versioning.</p>}
                  {branches.map(branch => (
                    <div
                      key={branch.id}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${currentBranch?.id === branch.id ? 'bg-purple-500/10 border-purple-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
                    >
                      <div className="flex items-center gap-3">
                        <GitBranch className={`w-4 h-4 ${currentBranch?.id === branch.id ? 'text-purple-400' : 'text-slate-500'}`} />
                        <div>
                          <p className="text-sm font-bold text-white">{branch.name}</p>
                          <p className="text-[10px] text-slate-500">Modified {new Date(branch.lastModified).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentBranch?.id !== branch.id && (
                          <button
                            onClick={() => {
                              setMergeSource(branch);
                              setActiveTab('merge');
                            }}
                            className="p-2 bg-slate-700 hover:bg-purple-600 text-white rounded-lg transition-all"
                            title={`Merge ${branch.name} into current`}
                          >
                            <GitMerge className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setCurrentBranch(branch);
                            onSwitchBranch(branch);
                          }}
                          disabled={currentBranch?.id === branch.id}
                          className={`px-3 py-1 rounded text-xs font-bold transition-all ${currentBranch?.id === branch.id ? 'text-green-400' : 'bg-slate-700 text-white hover:bg-slate-600'}`}
                        >
                          {currentBranch?.id === branch.id ? 'Current' : 'Switch'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'merge' && currentBranch && mergeSource && (
            <MergeConflictView
              sourceBranch={mergeSource}
              targetBranch={currentBranch}
              onResolve={handleMergeResolve}
              onCancel={() => setActiveTab('branches')}
            />
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              {!currentBranch ? (
                <div className="text-center py-12 text-slate-500">
                   <p>Please select or create a branch first.</p>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Commit Changes to {currentBranch.name}</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder="What changed?"
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                      <button
                        onClick={handleCreateCommit}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white rounded-lg font-bold transition-all"
                      >
                        <Commit className="w-4 h-4" />
                        Commit
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">History</h3>
                    <div className="space-y-4">
                      {commits.length === 0 && <p className="text-slate-600 italic text-sm">No commits yet in this branch.</p>}
                      {commits.slice().reverse().map((commit, i) => (
                        <div key={commit.id} className="relative pl-6 border-l-2 border-slate-800 pb-4 last:pb-0">
                          <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{commit.message}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[10px] text-slate-500 font-mono">{commit.id.substring(0, 7)}</span>
                               <span className="text-[10px] text-slate-500">•</span>
                               <span className="text-[10px] text-slate-500">{new Date(commit.timestamp).toLocaleString()}</span>
                            </div>
                            <button
                              onClick={() => onUpdateWorkbook(commit.workbookSnapshot)}
                              className="mt-2 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider flex items-center gap-1"
                            >
                              Restore this version <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {activeTab !== 'merge' && (
          <div className="p-4 border-t border-slate-700 bg-slate-800/30 flex justify-end">
             <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-all">
               Close
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchManager;
