import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Download, Upload, Plus, Settings, MessageSquare, BarChart3, 
  Table, Share2, Menu, Crown, X, Activity, FileSpreadsheet, 
  LayoutGrid, Undo2, Redo2, PaintBucket, DatabaseZap, Eye, 
  Wand2, Search, Hash, MoreVertical, Copy, MoveRight, MoveDown, 
  SplitSquareHorizontal, CopyMinus, Calculator, Filter, MessageSquare as MessageSquareIcon,
  Target, FileDown, Zap, User, Code, Home
} from 'lucide-react';
import Grid from './components/Grid';
import Dashboard from './components/Dashboard';
import Agent from './components/Agent';
import ShareModal from './components/ShareModal';
import ErrorBoundary, { GridErrorBoundary } from './components/ErrorBoundary';
import UserMenu from './components/UserMenu';
import { parseExcelFile, exportToCSV, createBlankSheet, getTemplateData, expandSheet } from './services/excelService';
import { generateSmartColumnData } from './services/geminiService';
import { SheetData, DashboardItem, ChartConfig, FormattingRule, SelectionRange, Workbook } from './types';
import { evaluateCellValue, indexToExcelCol, goalSeek, parseCellReference } from './services/formulaService';
import ToastContainer, { ToastType, ToastMessage } from './components/Toast';
import { generateId } from './utils/idGenerator';
import { saveFile, loadFile } from './services/storageService';
import { SheetTabs } from './components/SheetTabs';
import HomeView from './components/HomeView';
import WatchWindow from './components/WatchWindow';
import { Database, Layers } from 'lucide-react';
import UpgradeModal from './components/UpgradeModal';
import SettingsModal from './components/SettingsModal';
import ShortcutsModal from './components/ShortcutsModal';
import FormattingModal from './components/FormattingModal';
import DataToolsModal from './components/DataToolsModal';
import GoalSeekModal from './components/GoalSeekModal';
import PivotModal from './components/PivotModal';
import ChartWizardModal from './components/ChartWizardModal';
import SmartFillModal from './components/SmartFillModal';
import CommandPalette from './components/CommandPalette';

// Add mobile detection hook
const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
};

const AppContent: React.FC = () => {
  const isMobile = useMobileDetection();
  const [view, setView] = useState<'home' | 'editor'>('home');
  const [sheetData, setSheetData] = useState<SheetData | null>(null);
  const [history, setHistory] = useState<SheetData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'grid' | 'dashboard'>('grid');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  
  // Selection State
  const [selectedRange, setSelectedRange] = useState<SelectionRange | null>(null);

  // Modals
  const [isFormattingModalOpen, setIsFormattingModalOpen] = useState(false);
  
  // Data Tools State
  const [dataToolsState, setDataToolsState] = useState<{ isOpen: boolean; mode: 'duplicates' | 'split' | 'find' | 'clean'; initialColumn?: string }>({
    isOpen: false,
    mode: 'duplicates'
  });

  const [isPivotModalOpen, setIsPivotModalOpen] = useState(false);
  const [isChartWizardOpen, setIsChartWizardOpen] = useState(false);
  const [isSmartFillModalOpen, setIsSmartFillModalOpen] = useState(false);
  const [isGoalSeekModalOpen, setIsGoalSeekModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  
  // Watch Window State
  const [isWatchWindowOpen, setIsWatchWindowOpen] = useState(false);
  
  const [smartFillSourceColumn, setSmartFillSourceColumn] = useState('');

  // Agent State triggers
  const [agentPromptOverride, setAgentPromptOverride] = useState<string | null>(null);

  // Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // --- Persistence (File Based) ---
  // Autosave
  useEffect(() => {
    if (sheetData && view === 'editor') {
      const timer = setTimeout(() => {
        saveFile(sheetData);
      }, 1500); // Debounce save
      return () => clearTimeout(timer);
    }
  }, [sheetData, view]);

  // --- History Management ---
  const pushToHistory = useCallback((newData: SheetData) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newData);
      if (newHistory.length > 30) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => {
      const maxIndex = historyIndex + 1;
      return maxIndex > 29 ? 29 : maxIndex;
    });
    setSheetData(newData);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSheetData(history[newIndex]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSheetData(history[newIndex]);
    }
  }, [history, historyIndex]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleFile = async (file: File) => {
    try {
        // Show loading state
        addToast('info', 'Processing File', `Loading ${file.name}...`);
        
        const data = await parseExcelFile(file);
        loadData(data);
        addToast('success', 'File Uploaded', `Successfully loaded ${file.name}`);
        
        // Save to recent files
        saveFile(data);
        
    } catch (err: any) {
        console.error("File upload error:", err);
        
        // More specific error messages
        let errorMessage = 'Invalid file format or corrupted data.';
        
        if (err.message?.includes('XLSX library not loaded')) {
            errorMessage = 'Required library not loaded. Please refresh the page and try again.';
        } else if (err.message?.includes('Sheet is empty')) {
            errorMessage = 'The uploaded file is empty. Please check your spreadsheet.';
        } else if (err.message?.includes('parse')) {
            errorMessage = 'Unable to parse the file. Please ensure it is a valid Excel or CSV file.';
        }
        
        setError(errorMessage);
        addToast('error', 'Upload Failed', errorMessage);
    }
  };

  const loadData = (data: SheetData) => {
      setSheetData(data);
      setHistory([data]);
      setHistoryIndex(0);
      setDashboardItems([]);
      setActiveTab('grid');
      setSelectedRange(null);
      setView('editor'); // Switch to editor view
      // Initial Save to ensure it's in the list
      saveFile(data);
  };

  // --- Home View Handlers ---
  const handleOpenFile = (id: string) => {
      const data = loadFile(id);
      if (data) {
          loadData(data);
      } else {
          addToast('error', 'Load Failed', 'File not found.');
      }
  };

  const handleCreateBlank = () => {
      loadData(createBlankSheet());
  };

  const handleTemplate = (type: 'budget' | 'invoice' | 'schedule') => {
      loadData(getTemplateData(type));
  };

  const handleDownload = () => {
    if (!sheetData) return;
    const csvContent = exportToCSV(sheetData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const fileName = sheetData.name.replace(/\.[^/.]+$/, "") + ".csv";
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', 'File downloaded successfully.');
  };

  const addToDashboard = (config: ChartConfig) => {
    const newItem: DashboardItem = {
        id: Date.now().toString(),
        chartConfig: config,
        createdAt: new Date()
    };
    setDashboardItems(prev => [newItem, ...prev]);
    setActiveTab('dashboard'); // Switch to dashboard to see new item
    addToast('success', 'Chart Pinned', 'Added to dashboard.');
  };

  const removeFromDashboard = (id: string) => {
      setDashboardItems(prev => prev.filter(item => item.id !== id));
      addToast('info', 'Chart Removed');
  };

  const handleCellEdit = (rowIndex: number, colKey: string, value: string) => {
    if (!sheetData) return;
    const newRows = [...sheetData.rows];
    let finalValue: string | number = value;
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && String(num) === value.trim()) {
        finalValue = num;
    }
    newRows[rowIndex] = { ...newRows[rowIndex], [colKey]: finalValue };
    const newData = { ...sheetData, rows: newRows };
    pushToHistory(newData);
  };

  const handleAddFormattingRule = (rule: FormattingRule) => {
      if (!sheetData) return;
      const newRules = [...(sheetData.formattingRules || []), rule];
      const newData = { ...sheetData, formattingRules: newRules };
      pushToHistory(newData);
      addToast('success', 'Rule Applied', 'Conditional formatting updated.');
  };

  // --- Data Operations ---

  const handleRemoveDuplicates = (selectedColumns: string[]) => {
    if (!sheetData || selectedColumns.length === 0) return;
    const seen = new Set();
    const newRows = sheetData.rows.filter(row => {
        const signature = selectedColumns.map(col => String(row[col])).join('|||');
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
    });
    if (newRows.length < sheetData.rows.length) {
        pushToHistory({ ...sheetData, rows: newRows });
        addToast('success', 'Duplicates Removed', `Removed ${sheetData.rows.length - newRows.length} duplicate rows.`);
    } else {
        addToast('info', 'No Duplicates Found');
    }
  };

  const handleTextToColumns = (column: string, delimiter: string) => {
      if (!sheetData || !column || !delimiter) return;
      let maxSplits = 0;
      sheetData.rows.forEach(r => {
          const val = String(r[column] || '');
          const parts = val.split(delimiter);
          if (parts.length > maxSplits) maxSplits = parts.length;
      });
      if (maxSplits <= 1) {
          addToast('warning', 'No Split Occurred', 'The delimiter was not found in the selected column.');
          return;
      }
      const newHeaders = [...sheetData.columns];
      const colIndex = newHeaders.indexOf(column);
      const addedHeaders: string[] = [];
      for(let i=1; i<=maxSplits; i++) addedHeaders.push(`${column}_Split_${i}`);
      newHeaders.splice(colIndex + 1, 0, ...addedHeaders);
      const newRows = sheetData.rows.map(row => {
          const val = String(row[column] || '');
          const parts = val.split(delimiter);
          const newRow = { ...row };
          addedHeaders.forEach((h, idx) => {
              newRow[h] = parts[idx] !== undefined ? parts[idx].trim() : '';
          });
          return newRow;
      });
      pushToHistory({ ...sheetData, columns: newHeaders, rows: newRows });
      addToast('success', 'Text Split', `Column split into ${maxSplits} parts.`);
  };

  const handleFindReplace = (findText: string, replaceText: string, column: string, matchCase: boolean) => {
      if (!sheetData || !findText) return;
      let count = 0;
      const newRows = sheetData.rows.map(row => {
          const newRow = { ...row };
          const colsToSearch = column === 'All Columns' ? sheetData.columns : [column];
          colsToSearch.forEach(col => {
              const val = newRow[col];
              if (val === null || val === undefined) return;
              const strVal = String(val);
              let newVal = strVal;
              if (matchCase) {
                  newVal = strVal.split(findText).join(replaceText);
              } else {
                  const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                  newVal = strVal.replace(regex, replaceText);
              }
              if (newVal !== strVal) {
                  count++;
                  const num = parseFloat(newVal);
                  if (!isNaN(num) && isFinite(num) && String(num) === newVal.trim()) {
                      newRow[col] = num;
                  } else {
                      newRow[col] = newVal;
                  }
              }
          });
          return newRow;
      });
      
      if (count > 0) {
          pushToHistory({ ...sheetData, rows: newRows });
          addToast('success', 'Replacements Made', `Replaced ${count} occurrences.`);
      } else {
          addToast('info', 'No Matches Found');
      }
  };

  const handleMagicClean = async (column: string, instruction: string) => {
      if (!sheetData) return;
      setIsSidebarOpen(true);
      const prompt = `Please clean and standardize the column '${column}'. Instruction: ${instruction}. Replace the values in place.`;
      setAgentPromptOverride(prompt);
      addToast('info', 'AI Assistant Activated', 'Follow instructions in the sidebar.');
  };

  const handleCreatePivot = (groupCol: string, valueCol: string, operation: 'sum' | 'avg' | 'count' | 'min' | 'max') => {
      if (!sheetData) return;
      const groups: Record<string, number[]> = {};
      sheetData.rows.forEach(row => {
          const key = String(row[groupCol] || '(Blank)');
          const val = Number(row[valueCol]);
          if (!groups[key]) groups[key] = [];
          if (!isNaN(val)) groups[key].push(val);
      });
      const newRows = Object.keys(groups).map(key => {
          const values = groups[key];
          let result = 0;
          switch(operation) {
              case 'sum': result = values.reduce((a, b) => a + b, 0); break;
              case 'avg': result = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; break;
              case 'count': result = values.length; break;
              case 'min': result = values.length ? Math.min(...values) : 0; break;
              case 'max': result = values.length ? Math.max(...values) : 0; break;
          }
          if (operation !== 'count') result = Math.round(result * 100) / 100;
          return {
              [groupCol]: key,
              [`${operation}_${valueCol}`]: result
          };
      });
      const newSheetData: SheetData = {
          name: `Pivot_${sheetData.name}`,
          columns: [groupCol, `${operation}_${valueCol}`],
          rows: newRows,
          formattingRules: []
      };
      pushToHistory(newSheetData);
      addToast('success', 'Pivot Table Created');
  };

  // --- Column & Row Management ---

  const handleDeleteColumn = (colKey: string) => {
      if (!sheetData) return;
      const newColumns = sheetData.columns.filter(c => c !== colKey);
      const newRows = sheetData.rows.map(row => {
          const newRow = { ...row };
          delete newRow[colKey];
          return newRow;
      });
      pushToHistory({ ...sheetData, columns: newColumns, rows: newRows });
  };

  const handleRenameColumn = (oldKey: string, newKey: string) => {
      if (!sheetData || !newKey.trim()) return;
      const newColumns = sheetData.columns.map(c => c === oldKey ? newKey : c);
      const newRows = sheetData.rows.map(row => {
          const newRow: any = {};
          Object.keys(row).forEach(k => {
              if (k === oldKey) newRow[newKey] = row[k];
              else newRow[k] = row[k];
          });
          return newRow;
      });
      pushToHistory({ ...sheetData, columns: newColumns, rows: newRows });
  };
  
  const handleInsertRow = (index: number) => {
      if (!sheetData) return;
      const newRow: any = {};
      sheetData.columns.forEach(c => newRow[c] = '');
      const newRows = [...sheetData.rows];
      newRows.splice(index, 0, newRow);
      pushToHistory({ ...sheetData, rows: newRows });
  };

  const handleDeleteRow = (index: number) => {
      if (!sheetData) return;
      const newRows = [...sheetData.rows];
      newRows.splice(index, 1);
      pushToHistory({ ...sheetData, rows: newRows });
  };
  
  const handleInsertColumn = (index: number) => {
      if (!sheetData) return;
      // Generate a new column name like "Column X"
      let newColName = "New Column";
      let counter = 1;
      while (sheetData.columns.includes(newColName)) {
          newColName = `New Column ${counter++}`;
      }
      
      const newColumns = [...sheetData.columns];
      newColumns.splice(index + 1, 0, newColName);
      
      const newRows = sheetData.rows.map(row => ({
          ...row,
          [newColName]: ''
      }));
      
      pushToHistory({ ...sheetData, columns: newColumns, rows: newRows });
  };

  const handleClearRange = (range: SelectionRange) => {
      if (!sheetData) return;
      const { start, end } = range;
      const minRow = Math.min(start.rowIndex, end.rowIndex);
      const maxRow = Math.max(start.rowIndex, end.rowIndex);
      const minCol = Math.min(start.colIndex, end.colIndex);
      const maxCol = Math.max(start.colIndex, end.colIndex);
      
      const newRows = [...sheetData.rows];
      for (let r = minRow; r <= maxRow; r++) {
          const rowCopy = { ...newRows[r] };
          for (let c = minCol; c <= maxCol; c++) {
              rowCopy[sheetData.columns[c]] = '';
          }
          newRows[r] = rowCopy;
      }
      pushToHistory({ ...sheetData, rows: newRows });
  };

  const handleSmartFill = async (targetColumn: string, prompt: string) => {
      if (!sheetData) return;
      const newValues = await generateSmartColumnData(sheetData, targetColumn, prompt);
      const newColumns = [...sheetData.columns];
      if (!newColumns.includes(targetColumn)) {
          newColumns.push(targetColumn);
      }
      const newRows = sheetData.rows.map((row, index) => {
          return {
              ...row,
              [targetColumn]: newValues[index] !== undefined ? newValues[index] : (row[targetColumn] || "")
          };
      });
      pushToHistory({ ...sheetData, columns: newColumns, rows: newRows });
      addToast('success', 'Smart Fill Complete', 'New column generated.');
  };

  const handleSmartFillTrigger = (colKey: string) => {
      setSmartFillSourceColumn(colKey);
      setIsSmartFillModalOpen(true);
  };
  
  const handleAddComment = (rowIndex: number, colIndex: number, text: string) => {
      if (!sheetData) return;
      const key = `${rowIndex}-${colIndex}`;
      const newComments = { ...(sheetData.comments || {}), [key]: text };
      pushToHistory({ ...sheetData, comments: newComments });
      addToast('success', 'Comment Added');
  };
  
  const handleClearFilter = () => {
      if (!sheetData) return;
      const { filter, ...rest } = sheetData;
      pushToHistory({ ...rest });
      addToast('info', 'Filter Cleared');
  };
  
  const handleGoalSeek = async (targetRef: string, targetValue: number, changingRef: string) => {
      if (!sheetData) return { success: false, newValue: 0, error: "No data loaded" };
      
      const result = goalSeek(targetRef, targetValue, changingRef, sheetData);
      
      if (result.success) {
          // Update the changing cell with the new value
          const changing = parseCellReference(changingRef);
          if (changing) {
              const newRows = [...sheetData.rows];
              const colKey = sheetData.columns[changing.colIndex];
              newRows[changing.rowIndex] = { ...newRows[changing.rowIndex], [colKey]: result.newValue };
              pushToHistory({ ...sheetData, rows: newRows });
          }
      }
      
      return result;
  };
  
  // Watch Window Handlers
  const handleAddWatch = (cellRef: string) => {
      if (!sheetData) return;
      const currentWatches = sheetData.watchedCells || [];
      if (!currentWatches.includes(cellRef)) {
          pushToHistory({ ...sheetData, watchedCells: [...currentWatches, cellRef] });
          setIsWatchWindowOpen(true);
          addToast('success', 'Added to Watch Window', cellRef);
      } else {
          setIsWatchWindowOpen(true);
      }
  };

  const handleRemoveWatch = (cellRef: string) => {
      if (!sheetData || !sheetData.watchedCells) return;
      const newWatches = sheetData.watchedCells.filter(w => w !== cellRef);
      pushToHistory({ ...sheetData, watchedCells: newWatches });
  };

  // --- Statistics Calculation ---
  const rangeStats = useMemo(() => {
    if (!sheetData || !selectedRange) return null;
    
    const { start, end } = selectedRange;
    const minRow = Math.min(start.rowIndex, end.rowIndex);
    const maxRow = Math.max(start.rowIndex, end.rowIndex);
    const minCol = Math.min(start.colIndex, end.colIndex);
    const maxCol = Math.max(start.colIndex, end.colIndex);

    let sum = 0;
    let count = 0;
    let min = Infinity;
    let max = -Infinity;
    let numericCount = 0;

    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            const colKey = sheetData.columns[c];
            // Evaluate formula first
            const raw = sheetData.rows[r][colKey];
            const val = evaluateCellValue(raw, sheetData.rows, sheetData.columns);
            
            if (val !== null && val !== '') {
                count++;
                const num = Number(val);
                if (!isNaN(num)) {
                    sum += num;
                    if (num < min) min = num;
                    if (num > max) max = num;
                    numericCount++;
                }
            }
        }
    }

    if (numericCount === 0) return { count };
    
    return {
        sum: Math.round(sum * 100) / 100,
        avg: Math.round((sum / numericCount) * 100) / 100,
        min: min === Infinity ? '-' : min,
        max: max === -Infinity ? '-' : max,
        count
    };
  }, [sheetData, selectedRange]);

  const handleAnalyzeRange = (range: SelectionRange) => {
     if(!sheetData) return;
     // Construct prompt context
     setIsSidebarOpen(true);
     const context = `I have selected a range of cells from ${indexToExcelCol(range.start.colIndex)}${range.start.rowIndex+1} to ${indexToExcelCol(range.end.colIndex)}${range.end.rowIndex+1}. Analyze this specific data.`;
     setAgentPromptOverride(context);
  };

  const handleOpenDataTool = (mode: 'duplicates' | 'split' | 'find' | 'clean', colKey?: string) => {
      setDataToolsState({ isOpen: true, mode, initialColumn: colKey });
  };

  const handleColumnResize = (colKey: string, width: number) => {
      if (!sheetData) return;
      const newWidths = { ...(sheetData.columnWidths || {}), [colKey]: width };
      setSheetData({ ...sheetData, columnWidths: newWidths });
  };

  const handleSheetExpand = (targetRows: number, targetCols: number) => {
    if (!sheetData) return;
    
    // Only expand if we're actually increasing size
    if (targetRows > sheetData.rows.length || targetCols > sheetData.columns.length) {
      const expandedSheet = expandSheet(sheetData, targetRows, targetCols);
      pushToHistory(expandedSheet);
      addToast('info', 'Sheet Expanded', `Expanded to ${targetRows} rows and ${expandedSheet.columns.length} columns`);
    }
  };

  // Command Palette Actions
  const commandActions = [
      { id: 'smart-fill', label: 'Smart Fill / AI Generate', icon: Wand2, action: () => setIsSmartFillModalOpen(true) },
      { id: 'goal-seek', label: 'Goal Seek (What-If)', icon: Target, action: () => setIsGoalSeekModalOpen(true) },
      { id: 'watch-window', label: 'Toggle Watch Window', icon: Eye, action: () => setIsWatchWindowOpen(prev => !prev) },
      { id: 'pivot', label: 'Create Pivot Table', icon: Table, action: () => setIsPivotModalOpen(true) },
      { id: 'chart', label: 'Create Chart', icon: BarChart3, action: () => setIsChartWizardOpen(true) },
      { id: 'format', label: 'Conditional Formatting', icon: PaintBucket, action: () => setIsFormattingModalOpen(true) },
      { id: 'tools', label: 'Data Tools (Dedup, Split)', icon: DatabaseZap, action: () => setDataToolsState({ isOpen: true, mode: 'duplicates' }) },
      { id: 'export', label: 'Export to CSV', icon: FileDown, action: handleDownload },
      { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutGrid, action: () => setActiveTab('dashboard') },
      { id: 'grid', label: 'Go to Data Grid', icon: FileSpreadsheet, action: () => setActiveTab('grid') },
      { id: 'agent', label: 'Toggle AI Agent', icon: Zap, action: () => setIsSidebarOpen(prev => !prev) },
      { id: 'upgrade', label: 'Upgrade to Pro', icon: Crown, action: () => setIsUpgradeModalOpen(true) },
      { id: 'share', label: 'Share Spreadsheet', icon: Share2, action: () => setIsShareModalOpen(true) },
      { id: 'settings', label: 'Open Settings', icon: User, action: () => setIsSettingsOpen(true) },
      { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Code, action: () => setIsShortcutsOpen(true) },
      { id: 'home', label: 'Back to Home', icon: Home, action: handleGoHome },
  ];
  
  const getSelectedCellAddress = () => {
      if (selectedRange) {
          return `${indexToExcelCol(selectedRange.start.colIndex)}${selectedRange.start.rowIndex + 1}`;
      }
      return '';
  };

  return (
    <div className="saas-layout">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
        <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} fileName={sheetData?.name || 'Untitled'} onNotify={addToast} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
        
        <div className="saas-main">
            {/* Header */}
            <header className="saas-header">
                <div className="flex items-center gap-3 sm:gap-6">
                    <div className="brand-logo cursor-pointer" onClick={handleGoHome}>
                        <div className="icon-box">
                            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-white text-sm sm:text-base">NexSheet</span>
                    </div>
                    
                    {/* Navigation Pills - Hide on mobile */}
                    {sheetData && view === 'editor' && !isMobile && (
                        <div className="hidden md:flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 animate-in fade-in zoom-in">
                             <button 
                                onClick={() => setActiveTab('grid')}
                                className={`tab-pill ${activeTab === 'grid' ? 'active' : ''}`}
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                <span className="mobile-hidden">Data</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('dashboard')}
                                className={`tab-pill ${activeTab === 'dashboard' ? 'active' : ''}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="mobile-hidden">Dashboard</span>
                                {dashboardItems.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-nexus-accent/20 text-nexus-accent text-[10px] border border-nexus-accent/30 mobile-hidden">
                                        {dashboardItems.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Search/Command Trigger - Compact on mobile */}
                    <button 
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="hidden sm:flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                        <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="mobile-hidden">Search commands...</span>
                        <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] mobile-hidden">⌘K</span>
                    </button>

                    {/* Compact toolbar for mobile */}
                    {view === 'editor' && (
                      <div className={`compact-toolbar ${isMobile ? 'bg-slate-800/50 rounded-lg p-1 border border-slate-700/50' : 'toolbar-group animate-in fade-in slide-in-from-top-1'}`}>
                        <button onClick={handleUndo} disabled={!sheetData || historyIndex <= 0} className="btn-icon" title="Undo">
                          <Undo2 className="w-4 h-4" />
                        </button>
                        <button onClick={handleRedo} disabled={!sheetData || historyIndex >= history.length - 1} className="btn-icon" title="Redo">
                          <Redo2 className="w-4 h-4" />
                        </button>
                        
                        {!isMobile && (
                          <>
                            <div className="w-px h-4 bg-slate-700 mx-1"></div>
                            <button 
                              onClick={() => setIsFormattingModalOpen(true)} 
                              disabled={!sheetData} 
                              className="btn-icon" 
                              title="Conditional Formatting"
                            >
                              <PaintBucket className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setDataToolsState({ isOpen: true, mode: 'duplicates' })} 
                              disabled={!sheetData} 
                              className="btn-icon" 
                              title="Data Tools"
                            >
                              <DatabaseZap className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <div className="w-px h-4 bg-slate-700 mx-1 mobile-hidden"></div>
                        <button 
                          onClick={() => setIsWatchWindowOpen(!isWatchWindowOpen)} 
                          disabled={!sheetData} 
                          className={`btn-icon ${isWatchWindowOpen ? 'active' : ''} mobile-hidden`}
                          title="Watch Window"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setIsSmartFillModalOpen(true)} 
                          disabled={!sheetData} 
                          className="btn-icon text-indigo-400 hover:text-indigo-300" 
                          title="AI Smart Fill"
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                        
                        {!isMobile && (
                          <>
                            <button 
                              onClick={() => setIsPivotModalOpen(true)} 
                              disabled={!sheetData} 
                              className="btn-icon" 
                              title="Pivot Table"
                            >
                              <Table className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setIsChartWizardOpen(true)} 
                              disabled={!sheetData} 
                              className="btn-icon" 
                              title="Create Chart"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <button 
                          onClick={() => setIsShareModalOpen(true)} 
                          disabled={!sheetData} 
                          className="btn-icon text-blue-400 hover:text-blue-300 mobile-hidden" 
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        
                        {!isMobile && (
                          <>
                            <div className="w-px h-4 bg-slate-700 mx-1"></div>
                            <button onClick={handleDownload} disabled={!sheetData} className="btn-icon" title="Export">
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    <div className="h-6 w-px bg-slate-700/50 mobile-hidden"></div>
                    
                    {view === 'editor' && (
                      <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`btn-icon ${isSidebarOpen ? 'active' : ''}`}
                        title="Toggle Agent"
                      >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                      </button>
                    )}
                    
                    <button onClick={() => setIsUpgradeModalOpen(true)} className="flex items-center justify-center p-1.5 rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 text-slate-900 shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform" title="Upgrade to Pro">
                      <Crown className="w-4 h-4" />
                    </button>

                    <div className="relative">
                      <button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="w-8 h-8 rounded-full bg-gradient-to-tr from-nexus-accent to-purple-600 flex items-center justify-center border border-white/10 text-white shadow-inner hover:ring-2 hover:ring-white/20 transition-all font-bold text-xs"
                      >
                        JD
                      </button>
                      <UserMenu 
                        isOpen={isUserMenuOpen} 
                        onClose={() => setIsUserMenuOpen(false)} 
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onOpenShortcuts={() => setIsShortcutsOpen(true)}
                        onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
                        onLogout={() => { handleGoHome(); addToast('info', 'Signed Out'); }}
                      />
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="saas-workspace">
                {view === 'home' ? (
                    <HomeView 
                        onOpenFile={handleOpenFile} 
                        onNewFile={handleCreateBlank} 
                        onUpload={handleFile}
                        onTemplate={handleTemplate}
                    />
                ) : (
                    <>
                        <div className="flex-1 overflow-hidden p-4 sm:p-6 relative z-0">
                            {activeTab === 'grid' && sheetData ? (
                                <div className="h-full w-full data-grid-container">
                                    <GridErrorBoundary>
                                        <Grid 
                                            data={sheetData} 
                                            selectedRange={selectedRange}
                                            onRangeSelect={setSelectedRange}
                                            onCellEdit={handleCellEdit}
                                            onDeleteColumn={handleDeleteColumn}
                                            onRenameColumn={handleRenameColumn}
                                            onSmartFillTrigger={handleSmartFillTrigger}
                                            onAnalyzeRange={handleAnalyzeRange}
                                            onInsertRow={handleInsertRow}
                                            onDeleteRow={handleDeleteRow}
                                            onInsertColumn={handleInsertColumn}
                                            onClearRange={handleClearRange}
                                            onAddComment={handleAddComment}
                                            onAddWatch={handleAddWatch}
                                            onNotify={addToast}
                                            onOpenDataTool={handleOpenDataTool}
                                            onColumnResize={handleColumnResize}
                                            onSheetExpand={handleSheetExpand}
                                        />
                                    </GridErrorBoundary>
                                </div>
                            ) : sheetData ? (
                                <Dashboard items={dashboardItems} sheetData={sheetData} onRemoveItem={removeFromDashboard} />
                            ) : null}
                        </div>
                        
                        {/* Watch Window */}
                        {sheetData && (
                            <WatchWindow 
                                isOpen={isWatchWindowOpen}
                                onClose={() => setIsWatchWindowOpen(false)}
                                data={sheetData}
                                onRemoveWatch={handleRemoveWatch}
                                onAddWatch={handleAddWatch}
                            />
                        )}

                        {/* Status Bar */}
                        <div className="status-bar flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="status-item">
                                    <Database className="w-3.5 h-3.5" />
                                    <span className="text-slate-300 font-medium">{sheetData?.name || 'Untitled'}</span>
                                </div>
                                <div className="separator" />
                                <div className="status-item">
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>{sheetData?.rows.length.toLocaleString()} Rows</span>
                                </div>
                            </div>

                            {rangeStats && (
                                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-1">
                                        <div className="flex items-center gap-1.5 text-nexus-accent bg-nexus-accent/5 px-2 py-0.5 rounded">
                                            <span className="font-bold text-[10px] uppercase">Sum</span>
                                            <span className="font-mono">{rangeStats.sum}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded">
                                            <span className="font-bold text-[10px] uppercase">Avg</span>
                                            <span className="font-mono">{rangeStats.avg}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <span className="font-bold text-[10px] uppercase">Count</span>
                                            <span className="font-mono">{rangeStats.count}</span>
                                        </div>
                                    </div>
                            )}

                            <div className="status-item">
                                <span className={historyIndex > 0 ? "text-amber-400" : "text-green-400"}>
                                    {historyIndex > 0 ? "● Saving..." : "● Saved"}
                                </span>
                            </div>
                        </div>
                    </>
                )}

                {/* Right Panel: Agent (Only in Editor) */}
                {view === 'editor' && (
                    <aside className={`saas-sidebar-panel ${!isSidebarOpen ? 'hidden-panel' : ''}`}>
                        <Agent 
                            sheetData={sheetData} 
                            onAddToDashboard={addToDashboard} 
                            onUpdateData={pushToHistory} 
                            promptOverride={agentPromptOverride}
                            onClearPromptOverride={() => setAgentPromptOverride(null)}
                        />
                    </aside>
                )}

                {/* Modals */}
                <FormattingModal 
                    isOpen={isFormattingModalOpen}
                    onClose={() => setIsFormattingModalOpen(false)}
                    columns={sheetData?.columns || []}
                    onSave={handleAddFormattingRule}
                />
                
                <DataToolsModal
                    isOpen={dataToolsState.isOpen}
                    onClose={() => setDataToolsState(prev => ({ ...prev, isOpen: false }))}
                    columns={sheetData?.columns || []}
                    onRemoveDuplicates={handleRemoveDuplicates}
                    onTextToColumns={handleTextToColumns}
                    onFindReplace={handleFindReplace}
                    onMagicClean={handleMagicClean}
                    initialMode={dataToolsState.mode}
                    initialColumn={dataToolsState.initialColumn}
                />

                <GoalSeekModal 
                    isOpen={isGoalSeekModalOpen}
                    onClose={() => setIsGoalSeekModalOpen(false)}
                    initialTargetCell={getSelectedCellAddress()}
                    onSolve={handleGoalSeek}
                />

                <PivotModal
                    isOpen={isPivotModalOpen}
                    onClose={() => setIsPivotModalOpen(false)}
                    columns={sheetData?.columns || []}
                    onCreatePivot={handleCreatePivot}
                />

                <ChartWizardModal
                    isOpen={isChartWizardOpen}
                    onClose={() => setIsChartWizardOpen(false)}
                    columns={sheetData?.columns || []}
                    onAddChart={addToDashboard}
                />

                <SmartFillModal
                    isOpen={isSmartFillModalOpen}
                    onClose={() => setIsSmartFillModalOpen(false)}
                    initialColumnName=""
                    onApply={handleSmartFill}
                />

                <CommandPalette 
                    isOpen={isCommandPaletteOpen}
                    onClose={() => setIsCommandPaletteOpen(false)}
                    actions={commandActions}
                />
            </main>
        </div>
    </div>
  );
};

// Create a unified App component that includes workbook functionality
const App: React.FC = () => {
  const isMobile = useMobileDetection();
  const [view, setView] = useState<'home' | 'editor'>('home');
  
  // Multiple sheets state
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [isSheetTabsVisible, setIsSheetTabsVisible] = useState(true);

  // Get current sheet data
  const currentSheetData = workbook?.sheets[workbook.activeSheetIndex] || null;
  
  const [history, setHistory] = useState<SheetData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'grid' | 'dashboard'>('grid');
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  
  // Selection State
  const [selectedRange, setSelectedRange] = useState<SelectionRange | null>(null);

  // Modals
  const [isFormattingModalOpen, setIsFormattingModalOpen] = useState(false);
  
  // Data Tools State
  const [dataToolsState, setDataToolsState] = useState<{ isOpen: boolean; mode: 'duplicates' | 'split' | 'find' | 'clean'; initialColumn?: string }>({
    isOpen: false,
    mode: 'duplicates'
  });

  const [isPivotModalOpen, setIsPivotModalOpen] = useState(false);
  const [isChartWizardOpen, setIsChartWizardOpen] = useState(false);
  const [isSmartFillModalOpen, setIsSmartFillModalOpen] = useState(false);
  const [isGoalSeekModalOpen, setIsGoalSeekModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  
  // Watch Window State
  const [isWatchWindowOpen, setIsWatchWindowOpen] = useState(false);
  
  const [smartFillSourceColumn, setSmartFillSourceColumn] = useState('');

  // Agent State triggers
  const [agentPromptOverride, setAgentPromptOverride] = useState<string | null>(null);

  // Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Initialize with a single sheet
  useEffect(() => {
    if (!workbook) {
      const initialSheet = createBlankSheet();
      initialSheet.id = generateId();
      const initialWorkbook: Workbook = {
        id: generateId(),
        name: 'Workbook',
        sheets: [initialSheet],
        activeSheetIndex: 0,
        createdAt: new Date(),
        lastModified: new Date()
      };
      setWorkbook(initialWorkbook);
    }
  }, []);

  // --- Persistence (File Based) ---
  // Autosave
  useEffect(() => {
    if (currentSheetData && view === 'editor') {
      const timer = setTimeout(() => {
        saveFile(currentSheetData);
      }, 1500); // Debounce save
      return () => clearTimeout(timer);
    }
  }, [currentSheetData, view]);

  // --- History Management ---
  const pushToHistory = useCallback((newData: SheetData) => {
    if (!workbook) return;
    
    const updatedSheets = [...workbook.sheets];
    updatedSheets[workbook.activeSheetIndex] = newData;
    
    const updatedWorkbook = {
      ...workbook,
      sheets: updatedSheets,
      lastModified: new Date()
    };
    
    setWorkbook(updatedWorkbook);
    
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newData);
      if (newHistory.length > 30) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => {
      const maxIndex = historyIndex + 1;
      return maxIndex > 29 ? 29 : maxIndex;
    });
  }, [historyIndex, workbook]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const updatedSheets = [...workbook!.sheets];
      updatedSheets[workbook!.activeSheetIndex] = history[newIndex];
      setWorkbook({
        ...workbook!,
        sheets: updatedSheets,
        lastModified: new Date()
      });
    }
  }, [history, historyIndex, workbook]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const updatedSheets = [...workbook!.sheets];
      updatedSheets[workbook!.activeSheetIndex] = history[newIndex];
      setWorkbook({
        ...workbook!,
        sheets: updatedSheets,
        lastModified: new Date()
      });
    }
  }, [history, historyIndex, workbook]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const handleFile = async (file: File) => {
    try {
        // Show loading state
        addToast('info', 'Processing File', `Loading ${file.name}...`);
        
        const data = await parseExcelFile(file);
        loadData(data);
        addToast('success', 'File Uploaded', `Successfully loaded ${file.name}`);
        
        // Save to recent files
        saveFile(data);
        
    } catch (err: any) {
        console.error("File upload error:", err);
        
        // More specific error messages
        let errorMessage = 'Invalid file format or corrupted data.';
        
        if (err.message?.includes('XLSX library not loaded')) {
            errorMessage = 'Required library not loaded. Please refresh the page and try again.';
        } else if (err.message?.includes('Sheet is empty')) {
            errorMessage = 'The uploaded file is empty. Please check your spreadsheet.';
        } else if (err.message?.includes('parse')) {
            errorMessage = 'Unable to parse the file. Please ensure it is a valid Excel or CSV file.';
        }
        
        setError(errorMessage);
        addToast('error', 'Upload Failed', errorMessage);
    }
  };

  const loadData = (data: SheetData) => {
      const updatedSheets = [...(workbook?.sheets || [])];
      updatedSheets[workbook?.activeSheetIndex || 0] = data;
      
      setWorkbook(prev => prev ? {
        ...prev,
        sheets: updatedSheets,
        lastModified: new Date()
      } : null);
      
      setHistory([data]);
      setHistoryIndex(0);
      setDashboardItems([]);
      setActiveTab('grid');
      setSelectedRange(null);
      setView('editor'); // Switch to editor view
      // Initial Save to ensure it's in the list
      saveFile(data);
  };

  // --- Home View Handlers ---
  const handleOpenFile = (id: string) => {
      const data = loadFile(id);
      if (data) {
          loadData(data);
      } else {
          addToast('error', 'Load Failed', 'File not found.');
      }
  };

  const handleCreateBlank = () => {
      loadData(createBlankSheet());
  };

  const handleTemplate = (type: 'budget' | 'invoice' | 'schedule') => {
      loadData(getTemplateData(type));
  };

  const handleGoHome = () => {
      if (currentSheetData) saveFile(currentSheetData); // Ensure saved
      setWorkbook(null);
      setView('home');
  };

  const handleDownload = () => {
    if (!currentSheetData) return;
    const csvContent = exportToCSV(currentSheetData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const fileName = currentSheetData.name.replace(/\.[^/.]+$/, "") + ".csv";
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', 'File downloaded successfully.');
  };

  const addToDashboard = (config: ChartConfig) => {
    const newItem: DashboardItem = {
        id: Date.now().toString(),
        chartConfig: config,
        createdAt: new Date()
    };
    setDashboardItems(prev => [newItem, ...prev]);
    setActiveTab('dashboard'); // Switch to dashboard to see new item
    addToast('success', 'Chart Pinned', 'Added to dashboard.');
  };

  const removeFromDashboard = (id: string) => {
      setDashboardItems(prev => prev.filter(item => item.id !== id));
      addToast('info', 'Chart Removed');
  };

  const handleCellEdit = (rowIndex: number, colKey: string, value: string) => {
    if (!workbook) return;
    
    const updatedSheets = [...workbook.sheets];
    const currentSheet = updatedSheets[workbook.activeSheetIndex];
    const newRows = [...currentSheet.rows];
    
    let finalValue: string | number = value;
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && String(num) === value.trim()) {
        finalValue = num;
    }
    newRows[rowIndex] = { ...newRows[rowIndex], [colKey]: finalValue };
    
    const newSheetData = { ...currentSheet, rows: newRows };
    updatedSheets[workbook.activeSheetIndex] = newSheetData;
    
    setWorkbook({
      ...workbook,
      sheets: updatedSheets,
      lastModified: new Date()
    });
    
    pushToHistory(newSheetData);
  };

  const handleAddFormattingRule = (rule: FormattingRule) => {
      if (!workbook) return;
      
      const updatedSheets = [...workbook.sheets];
      const currentSheet = updatedSheets[workbook.activeSheetIndex];
      const newRules = [...(currentSheet.formattingRules || []), rule];
      const newSheetData = { ...currentSheet, formattingRules: newRules };
      
      updatedSheets[workbook.activeSheetIndex] = newSheetData;
      setWorkbook({
        ...workbook,
        sheets: updatedSheets,
        lastModified: new Date()
      });
      
      pushToHistory(newSheetData);
      addToast('success', 'Rule Applied', 'Conditional formatting updated.');
  };

  // --- Data Operations ---

  const handleRemoveDuplicates = (selectedColumns: string[]) => {
    if (!workbook || selectedColumns.length === 0) return;
    const currentSheet = workbook.sheets[workbook.activeSheetIndex];
    
    const seen = new Set();
    const newRows = currentSheet.rows.filter(row => {
        const signature = selectedColumns.map(col => String(row[col])).join('|||');
        if (seen.has(signature)) return false;
        seen.add(signature);
        return true;
    });
    
    if (newRows.length < currentSheet.rows.length) {
        const newSheetData = { ...currentSheet, rows: newRows };
        pushToHistory(newSheetData);
        addToast('success', 'Duplicates Removed', `Removed ${currentSheet.rows.length - newRows.length} duplicate rows.`);
    } else {
        addToast('info', 'No Duplicates Found');
    }
  };

  const handleTextToColumns = (column: string, delimiter: string) => {
      if (!workbook || !column || !delimiter) return;
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      let maxSplits = 0;
      currentSheet.rows.forEach(r => {
          const val = String(r[column] || '');
          const parts = val.split(delimiter);
          if (parts.length > maxSplits) maxSplits = parts.length;
      });
      if (maxSplits <= 1) {
          addToast('warning', 'No Split Occurred', 'The delimiter was not found in the selected column.');
          return;
      }
      const newHeaders = [...currentSheet.columns];
      const colIndex = newHeaders.indexOf(column);
      const addedHeaders: string[] = [];
      for(let i=1; i<=maxSplits; i++) addedHeaders.push(`${column}_Split_${i}`);
      newHeaders.splice(colIndex + 1, 0, ...addedHeaders);
      const newRows = currentSheet.rows.map(row => {
          const val = String(row[column] || '');
          const parts = val.split(delimiter);
          const newRow = { ...row };
          addedHeaders.forEach((h, idx) => {
              newRow[h] = parts[idx] !== undefined ? parts[idx].trim() : '';
          });
          return newRow;
      });
      
      const newSheetData = { ...currentSheet, columns: newHeaders, rows: newRows };
      pushToHistory(newSheetData);
      addToast('success', 'Text Split', `Column split into ${maxSplits} parts.`);
  };

  const handleFindReplace = (findText: string, replaceText: string, column: string, matchCase: boolean) => {
      if (!workbook || !findText) return;
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      let count = 0;
      const newRows = currentSheet.rows.map(row => {
          const newRow = { ...row };
          const colsToSearch = column === 'All Columns' ? currentSheet.columns : [column];
          colsToSearch.forEach(col => {
              const val = newRow[col];
              if (val === null || val === undefined) return;
              const strVal = String(val);
              let newVal = strVal;
              if (matchCase) {
                  newVal = strVal.split(findText).join(replaceText);
              } else {
                  const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                  newVal = strVal.replace(regex, replaceText);
              }
              if (newVal !== strVal) {
                  count++;
                  const num = parseFloat(newVal);
                  if (!isNaN(num) && isFinite(num) && String(num) === newVal.trim()) {
                      newRow[col] = num;
                  } else {
                      newRow[col] = newVal;
                  }
              }
          });
          return newRow;
      });
      
      if (count > 0) {
          const newSheetData = { ...currentSheet, rows: newRows };
          pushToHistory(newSheetData);
          addToast('success', 'Replacements Made', `Replaced ${count} occurrences.`);
      } else {
          addToast('info', 'No Matches Found');
      }
  };

  const handleMagicClean = async (column: string, instruction: string) => {
      if (!workbook) return;
      setIsSidebarOpen(true);
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      const prompt = `Please clean and standardize the column '${column}'. Instruction: ${instruction}. Replace the values in place.`;
      setAgentPromptOverride(prompt);
      addToast('info', 'AI Assistant Activated', 'Follow instructions in the sidebar.');
  };

  const handleCreatePivot = (groupCol: string, valueCol: string, operation: 'sum' | 'avg' | 'count' | 'min' | 'max') => {
      if (!workbook) return;
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      const groups: Record<string, number[]> = {};
      currentSheet.rows.forEach(row => {
          const key = String(row[groupCol] || '(Blank)');
          const val = Number(row[valueCol]);
          if (!groups[key]) groups[key] = [];
          if (!isNaN(val)) groups[key].push(val);
      });
      const newRows = Object.keys(groups).map(key => {
          const values = groups[key];
          let result = 0;
          switch(operation) {
              case 'sum': result = values.reduce((a, b) => a + b, 0); break;
              case 'avg': result = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0; break;
              case 'count': result = values.length; break;
              case 'min': result = values.length ? Math.min(...values) : 0; break;
              case 'max': result = values.length ? Math.max(...values) : 0; break;
          }
          if (operation !== 'count') result = Math.round(result * 100) / 100;
          return {
              [groupCol]: key,
              [`${operation}_${valueCol}`]: result
          };
      });
      const newSheetData: SheetData = {
          name: `Pivot_${currentSheet.name}`,
          columns: [groupCol, `${operation}_${valueCol}`],
          rows: newRows,
          formattingRules: []
      };
      pushToHistory(newSheetData);
      addToast('success', 'Pivot Table Created');
  };

  // --- Column & Row Management ---

  const handleDeleteColumn = (colKey: string) => {
      if (!workbook) return;
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      const newColumns = currentSheet.columns.filter(c => c !== colKey);
      const newRows = currentSheet.rows.map(row => {
          const newRow = { ...row };
          delete newRow[colKey];
          return newRow;
      });
      
      const newSheetData = { ...currentSheet, columns: newColumns, rows: newRows };
      pushToHistory(newSheetData);
  };

  const handleRenameColumn = (oldKey: string, newKey: string) => {
      if (!workbook || !newKey.trim()) return;
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      const newColumns = currentSheet.columns.map(c => c === oldKey ? newKey : c);
      const newRows = currentSheet.rows.map(row => {
          const newRow: any = {};
          Object.keys(row).forEach(k => {
              if (k === oldKey) newRow[newKey] = row[k];
              else newRow[k] = row[k];
          });
          return newRow;
      });
      
      const newSheetData = { ...currentSheet, columns: newColumns, rows: newRows };
      pushToHistory(newSheetData);
  };
  
  const handleInsertRow = (index: number) => {
      if (!workbook) return;
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      const newRow: any = {};
      currentSheet.columns.forEach(c => newRow[c] = '');
      const newRows = [...currentSheet.rows];
      newRows.splice(index, 0, newRow);
      
      const newSheetData = { ...currentSheet, rows: newRows };
      pushToHistory(newSheetData);
  };

  const handleDeleteRow = (index: number) => {
      if (!workbook) return;
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      const newRows = [...currentSheet.rows];
      newRows.splice(index, 1);
      
      const newSheetData = { ...currentSheet, rows: newRows };
      pushToHistory(newSheetData);
  };
  
  const handleInsertColumn = (index: number) => {
      if (!workbook) return;
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      // Generate a new column name like "Column X"
      let newColName = "New Column";
      let counter = 1;
      while (currentSheet.columns.includes(newColName)) {
          newColName = `New Column ${counter++}`;
      }
      
      const newColumns = [...currentSheet.columns];
      newColumns.splice(index + 1, 0, newColName);
      
      const newRows = currentSheet.rows.map(row => ({
          ...row,
          [newColName]: ''
      }));
      
      const newSheetData = { ...currentSheet, columns: newColumns, rows: newRows };
      pushToHistory(newSheetData);
  };

  const handleClearRange = (range: SelectionRange) => {
      if (!workbook) return;
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      const { start, end } = range;
      const minRow = Math.min(start.rowIndex, end.rowIndex);
      const maxRow = Math.max(start.rowIndex, end.rowIndex);
      const minCol = Math.min(start.colIndex, end.colIndex);
      const maxCol = Math.max(start.colIndex, end.colIndex);
      
      const newRows = [...currentSheet.rows];
      for (let r = minRow; r <= maxRow; r++) {
          const rowCopy = { ...newRows[r] };
          for (let c = minCol; c <= maxCol; c++) {
              rowCopy[currentSheet.columns[c]] = '';
          }
          newRows[r] = rowCopy;
      }
      
      const newSheetData = { ...currentSheet, rows: newRows };
      pushToHistory(newSheetData);
  };

  const handleSmartFill = async (targetColumn: string, prompt: string) => {
      if (!workbook) return;
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      const newValues = await generateSmartColumnData(currentSheet, targetColumn, prompt);
      const newColumns = [...currentSheet.columns];
      if (!newColumns.includes(targetColumn)) {
          newColumns.push(targetColumn);
      }
      const newRows = currentSheet.rows.map((row, index) => {
          return {
              ...row,
              [targetColumn]: newValues[index] !== undefined ? newValues[index] : (row[targetColumn] || "")
          };
      });
      
      const newSheetData = { ...currentSheet, columns: newColumns, rows: newRows };
      pushToHistory(newSheetData);
      addToast('success', 'Smart Fill Complete', 'New column generated.');
  };

  const handleSmartFillTrigger = (colKey: string) => {
      setSmartFillSourceColumn(colKey);
      setIsSmartFillModalOpen(true);
  };
  
  const handleAddComment = (rowIndex: number, colIndex: number, text: string) => {
      if (!workbook) return;
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      const key = `${rowIndex}-${colIndex}`;
      const newComments = { ...(currentSheet.comments || {}), [key]: text };
      
      const newSheetData = { ...currentSheet, comments: newComments };
      pushToHistory(newSheetData);
      addToast('success', 'Comment Added');
  };
  
  const handleClearFilter = () => {
      if (!workbook) return;
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      const { filter, ...rest } = currentSheet;
      pushToHistory({ ...rest });
      addToast('info', 'Filter Cleared');
  };
  
  const handleGoalSeek = async (targetRef: string, targetValue: number, changingRef: string) => {
      if (!workbook) return { success: false, newValue: 0, error: "No data loaded" };
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      const result = goalSeek(targetRef, targetValue, changingRef, currentSheet);
      
      if (result.success) {
          // Update the changing cell with the new value
          const changing = parseCellReference(changingRef);
          if (changing) {
              const newRows = [...currentSheet.rows];
              const colKey = currentSheet.columns[changing.colIndex];
              newRows[changing.rowIndex] = { ...newRows[changing.rowIndex], [colKey]: result.newValue };
              
              const newSheetData = { ...currentSheet, rows: newRows };
              pushToHistory(newSheetData);
          }
      }
      
      return result;
  };
  
  // Watch Window Handlers
  const handleAddWatch = (cellRef: string) => {
      if (!workbook || !currentSheetData) return;
      const currentWatches = currentSheetData.watchedCells || [];
      if (!currentWatches.includes(cellRef)) {
          const newWatches = [...currentWatches, cellRef];
          const newSheetData = { ...currentSheetData, watchedCells: newWatches };
          
          const updatedSheets = [...workbook.sheets];
          updatedSheets[workbook.activeSheetIndex] = newSheetData;
          setWorkbook({
            ...workbook,
            sheets: updatedSheets,
            lastModified: new Date()
          });
          
          pushToHistory(newSheetData);
          setIsWatchWindowOpen(true);
          addToast('success', 'Added to Watch Window', cellRef);
      } else {
          setIsWatchWindowOpen(true);
      }
  };

  const handleRemoveWatch = (cellRef: string) => {
      if (!workbook || !currentSheetData || !currentSheetData.watchedCells) return;
      const newWatches = currentSheetData.watchedCells.filter(w => w !== cellRef);
      
      const newSheetData = { ...currentSheetData, watchedCells: newWatches };
      const updatedSheets = [...workbook.sheets];
      updatedSheets[workbook.activeSheetIndex] = newSheetData;
      setWorkbook({
        ...workbook,
        sheets: updatedSheets,
        lastModified: new Date()
      });
      
      pushToHistory(newSheetData);
  };

  // --- Statistics Calculation ---
  const rangeStats = useMemo(() => {
    if (!currentSheetData || !selectedRange) return null;
    
    const { start, end } = selectedRange;
    const minRow = Math.min(start.rowIndex, end.rowIndex);
    const maxRow = Math.max(start.rowIndex, end.rowIndex);
    const minCol = Math.min(start.colIndex, end.colIndex);
    const maxCol = Math.max(start.colIndex, end.colIndex);

    let sum = 0;
    let count = 0;
    let min = Infinity;
    let max = -Infinity;
    let numericCount = 0;

    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            const colKey = currentSheetData.columns[c];
            // Evaluate formula first
            const raw = currentSheetData.rows[r][colKey];
            const val = evaluateCellValue(raw, currentSheetData.rows, currentSheetData.columns);
            
            if (val !== null && val !== '') {
                count++;
                const num = Number(val);
                if (!isNaN(num)) {
                    sum += num;
                    if (num < min) min = num;
                    if (num > max) max = num;
                    numericCount++;
                }
            }
        }
    }

    if (numericCount === 0) return { count };
    
    return {
        sum: Math.round(sum * 100) / 100,
        avg: Math.round((sum / numericCount) * 100) / 100,
        min: min === Infinity ? '-' : min,
        max: max === -Infinity ? '-' : max,
        count
    };
  }, [currentSheetData, selectedRange]);

  const handleAnalyzeRange = (range: SelectionRange) => {
     if(!currentSheetData) return;
     // Construct prompt context
     setIsSidebarOpen(true);
     const context = `I have selected a range of cells from ${indexToExcelCol(range.start.colIndex)}${range.start.rowIndex+1} to ${indexToExcelCol(range.end.colIndex)}${range.end.rowIndex+1}. Analyze this specific data.`;
     setAgentPromptOverride(context);
  };

  const handleOpenDataTool = (mode: 'duplicates' | 'split' | 'find' | 'clean', colKey?: string) => {
      setDataToolsState({ isOpen: true, mode, initialColumn: colKey });
  };

  const handleColumnResize = (colKey: string, width: number) => {
      if (!workbook) return;
      const currentSheet = workbook.sheets[workbook.activeSheetIndex];
      
      const newWidths = { ...(currentSheet.columnWidths || {}), [colKey]: width };
      const newSheetData = { ...currentSheet, columnWidths: newWidths };
      
      const updatedSheets = [...workbook.sheets];
      updatedSheets[workbook.activeSheetIndex] = newSheetData;
      setWorkbook({
        ...workbook,
        sheets: updatedSheets,
        lastModified: new Date()
      });
  };

  const handleSheetExpand = (targetRows: number, targetCols: number) => {
    if (!currentSheetData) return;
    
    // Only expand if we're actually increasing size
    if (targetRows > currentSheetData.rows.length || targetCols > currentSheetData.columns.length) {
      const expandedSheet = expandSheet(currentSheetData, targetRows, targetCols);
      pushToHistory(expandedSheet);
      addToast('info', 'Sheet Expanded', `Expanded to ${targetRows} rows and ${expandedSheet.columns.length} columns`);
    }
  };

  // Sheet management functions
  const handleAddSheet = () => {
    if (!workbook) return;
    
    const newSheet = createBlankSheet();
    newSheet.id = generateId();
    newSheet.name = `Sheet${workbook.sheets.length + 1}`;
    
    const newWorkbook = {
      ...workbook,
      sheets: [...workbook.sheets, newSheet],
      activeSheetIndex: workbook.sheets.length,
      lastModified: new Date()
    };
    
    setWorkbook(newWorkbook);
    addToast('success', 'Sheet Added', `Added ${newSheet.name}`);
  };

  const handleRenameSheet = (index: number, newName: string) => {
    if (!workbook) return;
    
    const updatedSheets = [...workbook.sheets];
    updatedSheets[index] = { ...updatedSheets[index], name: newName };
    
    setWorkbook({
      ...workbook,
      sheets: updatedSheets,
      lastModified: new Date()
    });
  };

  const handleCloseSheet = (index: number) => {
    if (!workbook || workbook.sheets.length <= 1) return;
    
    const updatedSheets = workbook.sheets.filter((_, i) => i !== index);
    const newActiveIndex = index === workbook.activeSheetIndex 
      ? Math.max(0, index - 1)
      : workbook.activeSheetIndex > index
        ? workbook.activeSheetIndex - 1
        : workbook.activeSheetIndex;
    
    setWorkbook({
      ...workbook,
      sheets: updatedSheets,
      activeSheetIndex: newActiveIndex,
      lastModified: new Date()
    });
    
    addToast('info', 'Sheet Removed', `Removed sheet at index ${index + 1}`);
  };

  const handleActiveSheetChange = (index: number) => {
    if (!workbook || index >= workbook.sheets.length) return;
    
    setWorkbook({
      ...workbook,
      activeSheetIndex: index,
      lastModified: new Date()
    });
  };

  // Command Palette Actions
  const commandActions = [
      { id: 'smart-fill', label: 'Smart Fill / AI Generate', icon: Wand2, action: () => setIsSmartFillModalOpen(true) },
      { id: 'goal-seek', label: 'Goal Seek (What-If)', icon: Target, action: () => setIsGoalSeekModalOpen(true) },
      { id: 'watch-window', label: 'Toggle Watch Window', icon: Eye, action: () => setIsWatchWindowOpen(prev => !prev) },
      { id: 'pivot', label: 'Create Pivot Table', icon: Table, action: () => setIsPivotModalOpen(true) },
      { id: 'chart', label: 'Create Chart', icon: BarChart3, action: () => setIsChartWizardOpen(true) },
      { id: 'format', label: 'Conditional Formatting', icon: PaintBucket, action: () => setIsFormattingModalOpen(true) },
      { id: 'tools', label: 'Data Tools (Dedup, Split)', icon: DatabaseZap, action: () => setDataToolsState({ isOpen: true, mode: 'duplicates' }) },
      { id: 'export', label: 'Export to CSV', icon: FileDown, action: handleDownload },
      { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutGrid, action: () => setActiveTab('dashboard') },
      { id: 'grid', label: 'Go to Data Grid', icon: FileSpreadsheet, action: () => setActiveTab('grid') },
      { id: 'agent', label: 'Toggle AI Agent', icon: Zap, action: () => setIsSidebarOpen(prev => !prev) },
      { id: 'upgrade', label: 'Upgrade to Pro', icon: Crown, action: () => setIsUpgradeModalOpen(true) },
      { id: 'share', label: 'Share Spreadsheet', icon: Share2, action: () => setIsShareModalOpen(true) },
      { id: 'settings', label: 'Open Settings', icon: User, action: () => setIsSettingsOpen(true) },
      { id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Code, action: () => setIsShortcutsOpen(true) },
      { id: 'home', label: 'Back to Home', icon: Home, action: handleGoHome },
  ];
  
  const getSelectedCellAddress = () => {
      if (selectedRange) {
          return `${indexToExcelCol(selectedRange.start.colIndex)}${selectedRange.start.rowIndex + 1}`;
      }
      return '';
  };

  return (
    <div className="saas-layout">
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
        <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} fileName={currentSheetData?.name || 'Untitled'} onNotify={addToast} />
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
        
        <div className="saas-main">
            {/* Header */}
            <header className="saas-header">
                <div className="flex items-center gap-3 sm:gap-6">
                    <div className="brand-logo cursor-pointer" onClick={handleGoHome}>
                        <div className="icon-box">
                            <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span className="text-white text-sm sm:text-base">NexSheet</span>
                    </div>
                    
                    {/* Navigation Pills - Hide on mobile */}
                    {currentSheetData && view === 'editor' && !isMobile && (
                        <div className="hidden md:flex bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 animate-in fade-in zoom-in">
                             <button 
                                onClick={() => setActiveTab('grid')}
                                className={`tab-pill ${activeTab === 'grid' ? 'active' : ''}`}
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                <span className="mobile-hidden">Data</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('dashboard')}
                                className={`tab-pill ${activeTab === 'dashboard' ? 'active' : ''}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                <span className="mobile-hidden">Dashboard</span>
                                {dashboardItems.length > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-nexus-accent/20 text-nexus-accent text-[10px] border border-nexus-accent/30 mobile-hidden">
                                        {dashboardItems.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Search/Command Trigger - Compact on mobile */}
                    <button 
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="hidden sm:flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                    >
                        <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span className="mobile-hidden">Search commands...</span>
                        <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] mobile-hidden">⌘K</span>
                    </button>

                    {/* Compact toolbar for mobile */}
                    {view === 'editor' && (
                      <div className={`compact-toolbar ${isMobile ? 'bg-slate-800/50 rounded-lg p-1 border border-slate-700/50' : 'toolbar-group animate-in fade-in slide-in-from-top-1'}`}>
                        <button onClick={handleUndo} disabled={!currentSheetData || historyIndex <= 0} className="btn-icon" title="Undo">
                          <Undo2 className="w-4 h-4" />
                        </button>
                        <button onClick={handleRedo} disabled={!currentSheetData || historyIndex >= history.length - 1} className="btn-icon" title="Redo">
                          <Redo2 className="w-4 h-4" />
                        </button>
                        
                        {!isMobile && (
                          <>
                            <div className="w-px h-4 bg-slate-700 mx-1"></div>
                            <button 
                              onClick={() => setIsFormattingModalOpen(true)} 
                              disabled={!currentSheetData} 
                              className="btn-icon" 
                              title="Conditional Formatting"
                            >
                              <PaintBucket className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setDataToolsState({ isOpen: true, mode: 'duplicates' })} 
                              disabled={!currentSheetData} 
                              className="btn-icon" 
                              title="Data Tools"
                            >
                              <DatabaseZap className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <div className="w-px h-4 bg-slate-700 mx-1 mobile-hidden"></div>
                        <button 
                          onClick={() => setIsWatchWindowOpen(!isWatchWindowOpen)} 
                          disabled={!currentSheetData} 
                          className={`btn-icon ${isWatchWindowOpen ? 'active' : ''} mobile-hidden`}
                          title="Watch Window"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setIsSmartFillModalOpen(true)} 
                          disabled={!currentSheetData} 
                          className="btn-icon text-indigo-400 hover:text-indigo-300" 
                          title="AI Smart Fill"
                        >
                          <Wand2 className="w-4 h-4" />
                        </button>
                        
                        {!isMobile && (
                          <>
                            <button 
                              onClick={() => setIsPivotModalOpen(true)} 
                              disabled={!currentSheetData} 
                              className="btn-icon" 
                              title="Pivot Table"
                            >
                              <Table className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setIsChartWizardOpen(true)} 
                              disabled={!currentSheetData} 
                              className="btn-icon" 
                              title="Create Chart"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        <button 
                          onClick={() => setIsShareModalOpen(true)} 
                          disabled={!currentSheetData} 
                          className="btn-icon text-blue-400 hover:text-blue-300 mobile-hidden" 
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        
                        {!isMobile && (
                          <>
                            <div className="w-px h-4 bg-slate-700 mx-1"></div>
                            <button onClick={handleDownload} disabled={!currentSheetData} className="btn-icon" title="Export">
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    <div className="h-6 w-px bg-slate-700/50 mobile-hidden"></div>
                    
                    {view === 'editor' && (
                      <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`btn-icon ${isSidebarOpen ? 'active' : ''}`}
                        title="Toggle Agent"
                      >
                        {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                      </button>
                    )}
                    
                    <button onClick={() => setIsUpgradeModalOpen(true)} className="flex items-center justify-center p-1.5 rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 text-slate-900 shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform" title="Upgrade to Pro">
                      <Crown className="w-4 h-4" />
                    </button>

                    <div className="relative">
                      <button 
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="w-8 h-8 rounded-full bg-gradient-to-tr from-nexus-accent to-purple-600 flex items-center justify-center border border-white/10 text-white shadow-inner hover:ring-2 hover:ring-white/20 transition-all font-bold text-xs"
                      >
                        JD
                      </button>
                      <UserMenu 
                        isOpen={isUserMenuOpen} 
                        onClose={() => setIsUserMenuOpen(false)} 
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onOpenShortcuts={() => setIsShortcutsOpen(true)}
                        onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
                        onLogout={() => { handleGoHome(); addToast('info', 'Signed Out'); }}
                      />
                    </div>
                </div>
            </header>

            {/* Sheet Tabs - Below the header */}
            {workbook && isSheetTabsVisible && (
              <SheetTabs
                workbook={workbook}
                onActiveSheetChange={handleActiveSheetChange}
                onAddSheet={handleAddSheet}
                onRenameSheet={handleRenameSheet}
                onCloseSheet={handleCloseSheet}
              />
            )}
            
            {/* Main Content Area */}
            <main className="saas-workspace">
                {view === 'home' ? (
                    <HomeView 
                        onOpenFile={handleOpenFile} 
                        onNewFile={handleCreateBlank} 
                        onUpload={handleFile}
                        onTemplate={handleTemplate}
                    />
                ) : (
                    <>
                        <div className="flex-1 overflow-hidden p-4 sm:p-6 relative z-0">
                            {activeTab === 'grid' && currentSheetData ? (
                                <div className="h-full w-full data-grid-container">
                                    <GridErrorBoundary>
                                        <Grid 
                                            data={currentSheetData} 
                                            selectedRange={selectedRange}
                                            onRangeSelect={setSelectedRange}
                                            onCellEdit={handleCellEdit}
                                            onDeleteColumn={handleDeleteColumn}
                                            onRenameColumn={handleRenameColumn}
                                            onSmartFillTrigger={handleSmartFillTrigger}
                                            onAnalyzeRange={handleAnalyzeRange}
                                            onInsertRow={handleInsertRow}
                                            onDeleteRow={handleDeleteRow}
                                            onInsertColumn={handleInsertColumn}
                                            onClearRange={handleClearRange}
                                            onAddComment={handleAddComment}
                                            onAddWatch={handleAddWatch}
                                            onNotify={addToast}
                                            onOpenDataTool={handleOpenDataTool}
                                            onColumnResize={handleColumnResize}
                                            onSheetExpand={handleSheetExpand}
                                        />
                                    </GridErrorBoundary>
                                </div>
                            ) : currentSheetData ? (
                                <Dashboard items={dashboardItems} sheetData={currentSheetData} onRemoveItem={removeFromDashboard} />
                            ) : null}
                        </div>
                        
                        {/* Watch Window */}
                        {currentSheetData && (
                            <WatchWindow 
                                isOpen={isWatchWindowOpen}
                                onClose={() => setIsWatchWindowOpen(false)}
                                data={currentSheetData}
                                onRemoveWatch={handleRemoveWatch}
                                onAddWatch={handleAddWatch}
                            />
                        )}

                        {/* Status Bar */}
                        <div className="status-bar flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="status-item">
                                    <Database className="w-3.5 h-3.5" />
                                    <span className="text-slate-300 font-medium">{currentSheetData?.name || 'Untitled'}</span>
                                </div>
                                <div className="separator" />
                                <div className="status-item">
                                    <Layers className="w-3.5 h-3.5" />
                                    <span>{currentSheetData?.rows.length.toLocaleString()} Rows</span>
                                </div>
                            </div>

                            {rangeStats && (
                                    <div className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-1">
                                        <div className="flex items-center gap-1.5 text-nexus-accent bg-nexus-accent/5 px-2 py-0.5 rounded">
                                            <span className="font-bold text-[10px] uppercase">Sum</span>
                                            <span className="font-mono">{rangeStats.sum}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-purple-400 bg-purple-500/5 px-2 py-0.5 rounded">
                                            <span className="font-bold text-[10px] uppercase">Avg</span>
                                            <span className="font-mono">{rangeStats.avg}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-400">
                                            <span className="font-bold text-[10px] uppercase">Count</span>
                                            <span className="font-mono">{rangeStats.count}</span>
                                        </div>
                                    </div>
                            )}

                            <div className="status-item">
                                <span className={historyIndex > 0 ? "text-amber-400" : "text-green-400"}>
                                    {historyIndex > 0 ? "● Saving..." : "● Saved"}
                                </span>
                            </div>
                        </div>
                    </>
                )}

                {/* Right Panel: Agent (Only in Editor) */}
                {view === 'editor' && (
                    <aside className={`saas-sidebar-panel ${!isSidebarOpen ? 'hidden-panel' : ''}`}>
                        <Agent 
                            sheetData={currentSheetData} 
                            onAddToDashboard={addToDashboard} 
                            onUpdateData={pushToHistory} 
                            promptOverride={agentPromptOverride}
                            onClearPromptOverride={() => setAgentPromptOverride(null)}
                        />
                    </aside>
                )}

                {/* Modals */}
                <FormattingModal 
                    isOpen={isFormattingModalOpen}
                    onClose={() => setIsFormattingModalOpen(false)}
                    columns={currentSheetData?.columns || []}
                    onSave={handleAddFormattingRule}
                />
                
                <DataToolsModal
                    isOpen={dataToolsState.isOpen}
                    onClose={() => setDataToolsState(prev => ({ ...prev, isOpen: false }))}
                    columns={currentSheetData?.columns || []}
                    onRemoveDuplicates={handleRemoveDuplicates}
                    onTextToColumns={handleTextToColumns}
                    onFindReplace={handleFindReplace}
                    onMagicClean={handleMagicClean}
                    initialMode={dataToolsState.mode}
                    initialColumn={dataToolsState.initialColumn}
                />

                <GoalSeekModal 
                    isOpen={isGoalSeekModalOpen}
                    onClose={() => setIsGoalSeekModalOpen(false)}
                    initialTargetCell={getSelectedCellAddress()}
                    onSolve={handleGoalSeek}
                />

                <PivotModal
                    isOpen={isPivotModalOpen}
                    onClose={() => setIsPivotModalOpen(false)}
                    columns={currentSheetData?.columns || []}
                    onCreatePivot={handleCreatePivot}
                />

                <ChartWizardModal
                    isOpen={isChartWizardOpen}
                    onClose={() => setIsChartWizardOpen(false)}
                    columns={currentSheetData?.columns || []}
                    onAddChart={addToDashboard}
                />

                <SmartFillModal
                    isOpen={isSmartFillModalOpen}
                    onClose={() => setIsSmartFillModalOpen(false)}
                    initialColumnName=""
                    onApply={handleSmartFill}
                />

                <CommandPalette 
                    isOpen={isCommandPaletteOpen}
                    onClose={() => setIsCommandPaletteOpen(false)}
                    actions={commandActions}
                />
            </main>
        </div>
    </div>
  );
};

export default App;

export default App;