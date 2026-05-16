import React, { useState } from 'react';
import {
  Undo2, Redo2, PaintBucket, DatabaseZap, BarChart3, Table, Wand2, Eye,
  FileDown, Share2, Target, Filter, FunctionSquare, Layout, Printer,
  FileSpreadsheet, Square, SquareDot, ChevronDown, Sparkles
} from 'lucide-react';

export type ModernRibbonTab = 'home' | 'insert' | 'formulas' | 'data' | 'view' | 'ai';

interface ModernRibbonProps {
  activeTab: ModernRibbonTab;
  onTabChange: (tab: ModernRibbonTab) => void;
  hasData: boolean;
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
  onAIAssistant: () => void;
}

const ModernRibbon: React.FC<ModernRibbonProps> = (props) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs: { id: ModernRibbonTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Home', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'insert', label: 'Insert', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'formulas', label: 'Formulas', icon: <FunctionSquare className="w-4 h-4" /> },
    { id: 'data', label: 'Data', icon: <DatabaseZap className="w-4 h-4" /> },
    { id: 'view', label: 'View', icon: <Layout className="w-4 h-4" /> },
    { id: 'ai', label: 'AI Tools', icon: <Sparkles className="w-4 h-4" /> },
  ];

  const RibbonButton = ({ 
    icon, 
    label, 
    onClick, 
    disabled = false,
    variant = 'default'
  }: { 
    icon: React.ReactNode; 
    label: string; 
    onClick: () => void; 
    disabled?: boolean;
    variant?: 'default' | 'primary' | 'success';
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`modern-ribbon-button ${variant} ${disabled ? 'disabled' : ''}`}
      title={label}
    >
      <div className="modern-ribbon-button-icon">{icon}</div>
      <span className="modern-ribbon-button-label">{label}</span>
    </button>
  );

  const RibbonGroup = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="modern-ribbon-group">
      <div className="modern-ribbon-group-content">{children}</div>
      <div className="modern-ribbon-group-title">{title}</div>
    </div>
  );

  return (
    <div className="modern-ribbon">
      {/* Tab Bar */}
      <div className="modern-ribbon-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => props.onTabChange(tab.id)}
            className={`modern-ribbon-tab ${props.activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="modern-ribbon-collapse"
          title={isCollapsed ? 'Expand Ribbon' : 'Collapse Ribbon'}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Ribbon Content */}
      {!isCollapsed && (
        <div className="modern-ribbon-content">
          {props.activeTab === 'home' && (
            <>
              <RibbonGroup title="Clipboard">
                <RibbonButton icon={<Undo2 className="w-5 h-5" />} label="Undo" onClick={props.onUndo} disabled={!props.canUndo} />
                <RibbonButton icon={<Redo2 className="w-5 h-5" />} label="Redo" onClick={props.onRedo} disabled={!props.canRedo} />
              </RibbonGroup>

              <RibbonGroup title="Formatting">
                <RibbonButton 
                  icon={<PaintBucket className="w-5 h-5" />} 
                  label="Conditional" 
                  onClick={props.onFormatting} 
                  disabled={!props.hasData}
                  variant="primary"
                />
              </RibbonGroup>

              <RibbonGroup title="Data">
                <RibbonButton 
                  icon={<DatabaseZap className="w-5 h-5" />} 
                  label="Data Tools" 
                  onClick={props.onDataTools} 
                  disabled={!props.hasData} 
                />
                <RibbonButton 
                  icon={<Wand2 className="w-5 h-5" />} 
                  label="Smart Fill" 
                  onClick={props.onSmartFill} 
                  disabled={!props.hasData}
                  variant="success"
                />
              </RibbonGroup>

              <RibbonGroup title="Share">
                <RibbonButton icon={<FileDown className="w-5 h-5" />} label="Export" onClick={props.onExport} disabled={!props.hasData} />
                <RibbonButton icon={<Share2 className="w-5 h-5" />} label="Share" onClick={props.onShare} disabled={!props.hasData} />
              </RibbonGroup>
            </>
          )}

          {props.activeTab === 'insert' && (
            <>
              <RibbonGroup title="Charts">
                <RibbonButton 
                  icon={<BarChart3 className="w-5 h-5" />} 
                  label="Chart" 
                  onClick={props.onChart} 
                  disabled={!props.hasData}
                  variant="primary"
                />
              </RibbonGroup>

              <RibbonGroup title="Tables">
                <RibbonButton 
                  icon={<Table className="w-5 h-5" />} 
                  label="Pivot Table" 
                  onClick={props.onPivot} 
                  disabled={!props.hasData} 
                />
              </RibbonGroup>
            </>
          )}

          {props.activeTab === 'formulas' && (
            <>
              <RibbonGroup title="Analysis">
                <RibbonButton 
                  icon={<Target className="w-5 h-5" />} 
                  label="Goal Seek" 
                  onClick={props.onGoalSeek} 
                  disabled={!props.hasData} 
                />
                <RibbonButton 
                  icon={<FunctionSquare className="w-5 h-5" />} 
                  label="Smart Fill" 
                  onClick={props.onSmartFill} 
                  disabled={!props.hasData} 
                />
              </RibbonGroup>
            </>
          )}

          {props.activeTab === 'data' && (
            <>
              <RibbonGroup title="Data Tools">
                <RibbonButton 
                  icon={<DatabaseZap className="w-5 h-5" />} 
                  label="Data Tools" 
                  onClick={props.onDataTools} 
                  disabled={!props.hasData} 
                />
                <RibbonButton 
                  icon={<Filter className="w-5 h-5" />} 
                  label="Filter" 
                  onClick={props.onDataTools} 
                  disabled={!props.hasData} 
                />
              </RibbonGroup>

              <RibbonGroup title="Tables">
                <RibbonButton 
                  icon={<Table className="w-5 h-5" />} 
                  label="Pivot Table" 
                  onClick={props.onPivot} 
                  disabled={!props.hasData} 
                />
              </RibbonGroup>
            </>
          )}

          {props.activeTab === 'view' && (
            <>
              <RibbonGroup title="Show">
                <RibbonButton 
                  icon={<Eye className="w-5 h-5" />} 
                  label={props.isWatchOpen ? 'Hide Watch' : 'Watch Window'} 
                  onClick={props.onWatchWindow} 
                  disabled={!props.hasData} 
                />
              </RibbonGroup>
            </>
          )}

          {props.activeTab === 'ai' && (
            <>
              <RibbonGroup title="AI Assistant">
                <RibbonButton 
                  icon={<Sparkles className="w-5 h-5" />} 
                  label="AI Assistant" 
                  onClick={props.onAIAssistant} 
                  disabled={!props.hasData}
                  variant="success"
                />
                <RibbonButton 
                  icon={<Wand2 className="w-5 h-5" />} 
                  label="Smart Fill" 
                  onClick={props.onSmartFill} 
                  disabled={!props.hasData}
                  variant="primary"
                />
              </RibbonGroup>

              <RibbonGroup title="Analysis">
                <RibbonButton 
                  icon={<Target className="w-5 h-5" />} 
                  label="Goal Seek" 
                  onClick={props.onGoalSeek} 
                  disabled={!props.hasData} 
                />
              </RibbonGroup>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ModernRibbon;
