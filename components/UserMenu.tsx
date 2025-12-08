import React, { useRef, useEffect } from 'react';
import { User, Settings, Keyboard, LogOut, HelpCircle, CreditCard, Sparkles } from 'lucide-react';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenUpgrade: () => void;
  onLogout: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ 
  isOpen, 
  onClose, 
  onOpenSettings, 
  onOpenShortcuts,
  onOpenUpgrade,
  onLogout 
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className="absolute top-14 right-4 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* User Info Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-800/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-nexus-accent to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
            JD
          </div>
          <div className="overflow-hidden">
            <h3 className="text-sm font-semibold text-white truncate">John Doe</h3>
            <p className="text-xs text-slate-400 truncate">john.doe@example.com</p>
          </div>
        </div>
        <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Free Plan</span>
                <span>2/5 Files</span>
            </div>
            <div className="w-full h-1 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-[40%] bg-nexus-accent rounded-full" />
            </div>
            <button 
                onClick={() => { onOpenUpgrade(); onClose(); }}
                className="mt-3 w-full py-1.5 text-xs font-medium bg-gradient-to-r from-amber-500/10 to-amber-500/20 text-amber-400 border border-amber-500/20 rounded hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
            >
                <Sparkles className="w-3 h-3" /> Upgrade to Pro
            </button>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-1.5">
        <button onClick={() => { onOpenSettings(); onClose(); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3 transition-colors">
          <Settings className="w-4 h-4 text-slate-500" /> Settings
        </button>
        <button onClick={() => { onOpenShortcuts(); onClose(); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3 transition-colors">
          <Keyboard className="w-4 h-4 text-slate-500" /> Keyboard Shortcuts
        </button>
        <button onClick={() => { onOpenUpgrade(); onClose(); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3 transition-colors">
          <CreditCard className="w-4 h-4 text-slate-500" /> Billing
        </button>
        <button onClick={() => { window.open('https://support.google.com', '_blank'); onClose(); }} className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-3 transition-colors">
          <HelpCircle className="w-4 h-4 text-slate-500" /> Help & Support
        </button>
      </div>

      {/* Footer */}
      <div className="p-1.5 border-t border-slate-800">
        <button onClick={onLogout} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-3 transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default UserMenu;