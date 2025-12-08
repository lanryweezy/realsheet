import React, { useState } from 'react';
import { X, Copy, Users, Globe, ChevronDown, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  onNotify: (type: 'success' | 'info', title: string, msg?: string) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, fileName, onNotify }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Editor');
  const [accessLevel, setAccessLevel] = useState('Restricted'); // Restricted, Anyone

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://nexsheet.ai/s/${Math.random().toString(36).substr(2, 9)}`);
    onNotify('success', 'Link Copied', 'Share link copied to clipboard.');
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
        onNotify('success', 'Invite Sent', `Invitation sent to ${email}`);
        setEmail('');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/20 rounded-md text-blue-400">
                    <Users className="w-5 h-5" />
                </div>
                Share "{fileName}"
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-6 space-y-6">
            {/* Invite Section */}
            <form onSubmit={handleInvite} className="flex gap-2">
                <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Add people, groups, or emails"
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <select 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                    <option>Editor</option>
                    <option>Viewer</option>
                    <option>Commenter</option>
                </select>
                <button 
                    type="submit"
                    disabled={!email}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Send
                </button>
            </form>

            {/* People List */}
            <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">People with access</h3>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                            YOU
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">You (Owner)</p>
                            <p className="text-xs text-slate-500">user@example.com</p>
                        </div>
                    </div>
                    <span className="text-xs text-slate-400">Owner</span>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                            AI
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">NexSheet Agent</p>
                            <p className="text-xs text-slate-500">System Bot</p>
                        </div>
                    </div>
                    <span className="text-xs text-slate-400">Editor</span>
                </div>
            </div>

            {/* General Access */}
            <div className="pt-4 border-t border-slate-700">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">General Access</h3>
                <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-700 rounded-full text-slate-400">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setAccessLevel(accessLevel === 'Restricted' ? 'Anyone' : 'Restricted')}>
                                <span className="text-sm font-medium text-white group-hover:underline">
                                    {accessLevel === 'Restricted' ? 'Restricted' : 'Anyone with the link'}
                                </span>
                                <ChevronDown className="w-3 h-3 text-slate-500" />
                            </div>
                            <p className="text-xs text-slate-500">
                                {accessLevel === 'Restricted' 
                                    ? 'Only people with access can open with the link' 
                                    : 'Anyone on the internet with the link can view'}
                            </p>
                        </div>
                    </div>
                    
                    {accessLevel === 'Anyone' && (
                        <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">
                            Viewer
                        </button>
                    )}
                </div>
            </div>
        </div>

        <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-between items-center">
            <button 
                onClick={handleCopyLink}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium px-2 py-1 rounded hover:bg-blue-500/10"
            >
                <Copy className="w-4 h-4" /> Copy link
            </button>
            <button 
                onClick={onClose}
                className="bg-nexus-accent hover:bg-cyan-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;