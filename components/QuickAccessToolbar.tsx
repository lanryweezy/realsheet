import React from 'react';
import { Undo2, Redo2, Save, type LucideIcon } from 'lucide-react';

interface QATItem {
  id: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface QuickAccessToolbarProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  saved: boolean;
  extraItems?: QATItem[];
}

const QuickAccessToolbar: React.FC<QuickAccessToolbarProps> = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  saved,
  extraItems = [],
}) => {
  const items: QATItem[] = [
    { id: 'undo', icon: Undo2, label: 'Undo', onClick: onUndo, disabled: !canUndo },
    { id: 'redo', icon: Redo2, label: 'Redo', onClick: onRedo, disabled: !canRedo },
    { id: 'save', icon: Save, label: saved ? 'Saved' : 'Saving...', onClick: () => { }, disabled: true },
    ...extraItems,
  ];

  return (
    <div
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border"
      style={{
        background: 'var(--ribbon-bg)',
        borderColor: 'var(--ribbon-border)',
      }}
    >
      {items.map(({ id, icon: Icon, label, onClick, disabled }) => (
        <button
          key={id}
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="p-1 rounded hover:bg-black/10 transition-colors disabled:opacity-50 disabled:cursor-default"
          style={{ color: 'var(--nexus-text-main)' }}
          title={label}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
};

export default QuickAccessToolbar;
