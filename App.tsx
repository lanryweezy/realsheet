import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Download, Upload, Plus, Settings, MessageSquare, BarChart3,
  Table, Share2, Menu, Crown, X, Activity, FileSpreadsheet,
  LayoutGrid, Undo2, Redo2, PaintBucket, DatabaseZap, Eye,
  Wand2, Search, Hash, MoreVertical, Copy, MoveRight, MoveDown,
  SplitSquareHorizontal, CopyMinus, Calculator, Filter, MessageSquare as MessageSquareIcon,
  Target, FileDown, Zap, User, Code, Home, HelpCircle, Sun, Moon,
  Bell, CheckCircle, Calendar, Bot, Phone, TrendingUp, Plug, Sparkles, FileCode,
  SquareFunction as FunctionSquare, GitBranch
} from 'lucide-react';
import Grid from './components/Grid';
import Dashboard from './components/Dashboard';
import Agent from './components/Agent';
import ShareModal from './components/ShareModal';
import ErrorBoundary, { GridErrorBoundary } from './components/ErrorBoundary';
import UserMenu from './components/UserMenu';
import { parseExcelFile, exportToCSV, exportToExcel, createBlankSheet, getTemplateData, expandSheet } from './services/excelService';
import { generateSmartColumnData } from './services/geminiService';
import { SheetData, DashboardItem, ChartConfig, FormattingRule, SelectionRange, Workbook } from './types';
import { evaluateCellValue, indexToExcelCol, goalSeek, parseCellReference, adjustFormulaReferences } from './services/formulaService';
import ToastContainer, { ToastType, ToastMessage } from './components/Toast';
import { generateId } from './utils/idGenerator';
import { saveFile, loadFile, updateLastOpened, getRecentFiles } from './services/storageService';
import { SheetTabs } from './components/SheetTabs';
import HomeView from './components/HomeView';
import LoginView from './components/LoginView';
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
import VisualFormulaBuilder from './components/VisualFormulaBuilder';
import BranchManager from './components/BranchManager';
import RecordDetailView from './components/RecordDetailView';
import OnboardingTour from './components/OnboardingTour';
import CommandPalette from './components/CommandPalette';
import Ribbon, { type RibbonTab } from './components/Ribbon';
import QuickAccessToolbar from './components/QuickAccessToolbar';
import FormulaBar from './components/FormulaBar';
import { useTheme } from './contexts/ThemeContext';
import CellStylesGallery, { type CellStyle } from './components/CellStylesGallery';
import { NexusActionCenter } from './components/NexusActionCenter';
import TaskBoard from './components/TaskBoard';
import DailyPlanner from './components/DailyPlanner';
import AIAgentNetwork from './components/AIAgentNetwork';
import CommunicationHub from './components/CommunicationHub';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import IntegrationCenter from './components/IntegrationCenter';
import { useGamification } from './src/hooks/useGamification';
import { PowerHourBanner, CriticalHitFlash, StreakGuard } from './components/DopamineEngine';
import { FormMode } from './components/FormMode';
import { generateFormSchema, FormSchema } from './services/FormService';
import { suggestAutomations, AutomationSuggestion } from './services/automationService';
import { CollaborationService, Presence } from './services/collaborationService';
import { Branch, Row } from './types';

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



// Create a unified App component that includes workbook functionality
const App: React.FC = () => {
  const isMobile = useMobileDetection();
  const { theme, toggleTheme } = useTheme();
  
  // Gamification Engine
  const { gameState, addXP, powerHour, criticalHit } = useGamification();

  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [view, setView] = useState<'home' | 'editor'>('home');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Multiple sheets state
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [isSheetTabsVisible, setIsSheetTabsVisible] = useState(true);

  // Get current sheet data
  const currentSheetData = workbook ? workbook.sheets[workbook.activeSheetIndex] : null;

  const [activeFilters, setActiveFilters] = useState<Record<string, any[]>>({});
  const [history, setHistory] = useState<SheetData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const historyRef = useRef<SheetData[]>([]);
  const workbookRef = useRef<Workbook | null>(null);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    workbookRef.current = workbook;
  }, [workbook]);

  const [highlightedCells, setHighlightedCells] = useState<Set<string>>(new Set());
  const [loadSummary, setLoadSummary] = useState<{ title: string; hint: string } | null>(null);

  // Filtered rows for display
  const displayRows = useMemo(() => {
    if (!currentSheetData) return [];
    let rows = [...currentSheetData.rows];
    Object.entries(activeFilters).forEach(([col, allowedValues]) => {
      if (allowedValues && Array.isArray(allowedValues)) {
        rows = rows.filter(row => allowedValues.includes(row[col]));
      }
    });
    return rows;
  }, [currentSheetData, activeFilters]);

  // Map display index to absolute index
  const getAbsoluteRowIndex = (displayIndex: number) => {
    if (!currentSheetData) return displayIndex;
    const targetRow = displayRows[displayIndex];
    return currentSheetData.rows.indexOf(targetRow);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default
  const [activeTab, setActiveTab] = useState<'grid' | 'dashboard'>('grid');
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>('home');
  const [pageLayoutView, setPageLayoutView] = useState(false);
  const [zoom, setZoom] = useState(100);
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
  const [isVisualFormulaBuilderOpen, setIsVisualFormulaBuilderOpen] = useState(false);
  const [isBranchManagerOpen, setIsBranchManagerOpen] = useState(false);
  const [isRecordDetailOpen, setIsRecordDetailOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [activeDetailRowIndex, setActiveDetailRowIndex] = useState<number | null>(null);
  const [presences, setPresences] = useState<Presence[]>([]);
  const collabServiceRef = useRef<CollaborationService | null>(null);

  useEffect(() => {
     if (currentUser && !collabServiceRef.current) {
        collabServiceRef.current = new CollaborationService(currentUser.name, (p) => {
           setPresences(p.filter(presence => presence.userId !== collabServiceRef.current?.['currentUser'].userId));
        });
     }
     return () => {
        collabServiceRef.current?.disconnect();
        collabServiceRef.current = null;
     };
  }, [currentUser]);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('realsheet_tour_seen');
    if (!hasSeenTour) {
       setIsOnboardingOpen(true);
    }
  }, []);

  useEffect(() => {
    (window as any).openVisualBuilder = () => setIsVisualFormulaBuilderOpen(true);
    (window as any).openBranchManager = () => setIsBranchManagerOpen(true);
    (window as any).openRecordDetail = (index: number) => {
       setActiveDetailRowIndex(index);
       setIsRecordDetailOpen(true);
    };
  }, []);

  const [isGoalSeekModalOpen, setIsGoalSeekModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Productivity Features
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [isTaskBoardOpen, setIsTaskBoardOpen] = useState(false);
  const [isDailyPlannerOpen, setIsDailyPlannerOpen] = useState(false);
  const [isAIAgentNetworkOpen, setIsAIAgentNetworkOpen] = useState(false);
  const [isCommunicationHubOpen, setIsCommunicationHubOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isFormModeOpen, setIsFormModeOpen] = useState(false);
  const [activeFormSchema, setActiveFormSchema] = useState<FormSchema | null>(null);

  const handleGenerateForm = async () => {
    if (!currentSheetData) return;
    addToast('info', 'Generating Form...', 'Semantic analysis in progress.');
    const schema = await generateFormSchema(currentSheetData);
    setActiveFormSchema(schema);
    setIsFormModeOpen(true);
  };

  const handleFormSubmit = (data: any) => {
    if (!workbook || !currentSheetData) return;

    const newRow = { ...data };
    const updatedSheets = [...workbook.sheets];
    updatedSheets[workbook.activeSheetIndex] = {
      ...currentSheetData,
      rows: [...currentSheetData.rows, newRow]
    };

    setWorkbook({ ...workbook, sheets: updatedSheets });
    addToast('success', 'Entry Recorded', 'Row appended to spreadsheet.');
    addXP(100, 'xp'); // Massive XP for external data acquisition
  };
  const [isIntegrationCenterOpen, setIsIntegrationCenterOpen] = useState(false);

  // Watch Window State
  const [isWatchWindowOpen, setIsWatchWindowOpen] = useState(false);

  // Format Painter State
  const [isFormatPainterActive, setIsFormatPainterActive] = useState(false);
  const [formatPainterSource, setFormatPainterSource] = useState<{ rowIndex: number; colKey: string } | null>(null);

  // Automation Suggestions
  const [automationSuggestions, setAutomationSuggestions] = useState<AutomationSuggestion[]>([]);

  // Cell Styles State
  const [isCellStylesOpen, setIsCellStylesOpen] = useState(false);

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
  // Autosave & Automation detection
  useEffect(() => {
    if (currentSheetData && view === 'editor') {
      const timer = setTimeout(() => {
        saveFile(currentSheetData);

        // Check for automations
        const suggestions = suggestAutomations(currentSheetData, history);
        setAutomationSuggestions(suggestions);

        if (suggestions.length > 0 && Math.random() > 0.7) { // Don't annoy the user
           addToast('info', 'Smart Suggestion', suggestions[0].title);
        }
      }, 1500); // Debounce save
      return () => clearTimeout(timer);
    }
  }, [currentSheetData, view, history]);

  // --- History Management ---
  const handleUndo = useCallback(() => {
    const currentWorkbook = workbookRef.current;
    if (historyIndex > 0 && currentWorkbook) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const updatedSheets = [...currentWorkbook.sheets];
      updatedSheets[currentWorkbook.activeSheetIndex] = historyRef.current[newIndex];
      setWorkbook({
        ...currentWorkbook,
        sheets: updatedSheets,
        lastModified: new Date()
      });
    }
  }, [historyIndex]);

  const handleRedo = useCallback(() => {
    const currentWorkbook = workbookRef.current;
    if (historyIndex < historyRef.current.length - 1 && currentWorkbook) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const updatedSheets = [...currentWorkbook.sheets];
      updatedSheets[currentWorkbook.activeSheetIndex] = historyRef.current[newIndex];
      setWorkbook({
        ...currentWorkbook,
        sheets: updatedSheets,
        lastModified: new Date()
      });
    }
  }, [historyIndex]);

  const pushToHistory = useCallback((newData: SheetData) => {
    const currentWorkbook = workbookRef.current;
    if (!currentWorkbook) return;

    const updatedSheets = [...currentWorkbook.sheets];
    updatedSheets[currentWorkbook.activeSheetIndex] = newData;

    const updatedWorkbook = {
      ...currentWorkbook,
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
  }, [historyIndex]);

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
      } else if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        setIsCellStylesOpen(true);
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
    setView('editor');
    saveFile(data);

    // High-Value Scan
    const highlights = new Set<string>();
    const numericValues: { r: number; c: number; v: number }[] = [];
    data.rows.forEach((row, ri) => {
      data.columns.forEach((col, ci) => {
        const val = Number(row[col]);
        if (!isNaN(val) && val !== 0) numericValues.push({ r: ri, c: ci, v: Math.abs(val) });
      });
    });
    numericValues.sort((a, b) => b.v - a.v);
    for (let i = 0; i < Math.min(5, numericValues.length); i++) {
      highlights.add(`${numericValues[i].r}-${numericValues[i].c}`);
    }
    if (highlights.size > 0) {
      setHighlightedCells(highlights);
      setTimeout(() => setHighlightedCells(new Set()), 3000);

      // Generate Load Summary
      const totalSum = numericValues.reduce((acc, v) => acc + v.v, 0);
      const avgValue = numericValues.length > 0 ? totalSum / numericValues.length : 0;
      setLoadSummary({
        title: "Intelligent Insight",
        hint: `Detected ${numericValues.length} key data points. Average magnitude is ${avgValue.toFixed(2)}. Top values highlighted.`
      });
      setTimeout(() => setLoadSummary(null), 8000);
    }
  };

  // --- Home View Handlers ---
  const handleOpenFile = (id: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      const data = loadFile(id);
      if (data) {
        updateLastOpened(id);
        loadData(data);
      } else {
        addToast('error', 'Load Failed', 'File not found.');
      }
      setIsTransitioning(false);
    }, 800);
  };

  const handleCreateBlank = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      loadData(createBlankSheet());
      setIsTransitioning(false);
    }, 800);
  };

  const handleTemplate = (type: 'budget' | 'invoice' | 'schedule') => {
    loadData(getTemplateData(type));
  };

  const handleGoHome = () => {
    if (currentSheetData) saveFile(currentSheetData); // Ensure saved
    setWorkbook(null);
    setView('home');
  };

  const handleDownloadFile = (id: string) => {
    const data = loadFile(id);
    if (!data) {
      addToast('error', 'Download Failed', 'File not found.');
      return;
    }
    const csvContent = exportToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    const fileName = (data.name || 'export').replace(/\.[^/.]+$/, '') + '.csv';
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('success', 'Download Complete', `${fileName} downloaded.`);
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

  const handleSetPrintArea = () => {
    if (!workbook || !currentSheetData || !selectedRange) {
      addToast('info', 'Select a range', 'Select cells first, then choose Set print area.');
      return;
    }
    const start = selectedRange.start;
    const end = selectedRange.end;
    const printArea = {
      start: { row: start.rowIndex, col: start.colIndex },
      end: { row: end.rowIndex, col: end.colIndex }
    };
    const updatedSheets = [...workbook.sheets];
    const sheet = { ...currentSheetData, printArea };
    updatedSheets[workbook.activeSheetIndex] = sheet;
    setWorkbook({ ...workbook, sheets: updatedSheets });
    addToast('success', 'Print area set', 'Only the selected range will be printed or exported.');
  };

  const handleClearPrintArea = () => {
    if (!workbook || !currentSheetData) return;
    const updatedSheets = [...workbook.sheets];
    updatedSheets[workbook.activeSheetIndex] = { ...currentSheetData, printArea: undefined };
    setWorkbook({ ...workbook, sheets: updatedSheets });
    addToast('info', 'Print area cleared');
  };

  const handleExportExcel = () => {
    if (!currentSheetData) return;
    exportToExcel(currentSheetData);
    addToast('success', 'Export Complete', 'Excel file downloaded.');
  };

  const handlePrint = () => {
    if (!currentSheetData) return;
    const pa = currentSheetData.printArea;
    const startRow = pa ? pa.start.row : 0;
    const endRow = pa ? pa.end.row : currentSheetData.rows.length - 1;
    const startCol = pa ? pa.start.col : 0;
    const endCol = pa ? pa.end.col : currentSheetData.columns.length - 1;
    const cols = currentSheetData.columns.slice(startCol, endCol + 1);
    const rows = currentSheetData.rows.slice(startRow, endRow + 1);
    const headerRow = cols.map(c => `<th style="border:1px solid #333;padding:6px;text-align:left">${escapeHtml(String(c))}</th>`).join('');
    const bodyRows = rows.map(row =>
      '<tr>' + cols.map(c => `<td style="border:1px solid #333;padding:6px">${escapeHtml(String(row[c] ?? ''))}</td>`).join('') + '</tr>'
    ).join('');
    const title = currentSheetData.name || 'Sheet';
    const html = `<!DOCTYPE html><html><head><title>${escapeHtml(title)}</title><style>table{border-collapse:collapse;width:100%} body{font-family:sans-serif;padding:12px}</style></head><body><h2>${escapeHtml(title)}</h2><table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    if (!w) { addToast('error', 'Print blocked', 'Allow popups to print.'); return; }
    w.document.write(html);
    w.document.close();
    w.onload = () => { w.focus(); w.print(); w.close(); };
  };

  function escapeHtml(s: string): string {
    const div = { innerHTML: '' };
    const el = document.createElement('div');
    el.textContent = s;
    return el.innerHTML;
  }

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

  const handleCellEdit = useCallback((rowIndex: number, colKey: string, value: string) => {
    if (!workbook || !currentSheetData) return;

    // Gamification Triggers
    if (value.startsWith('=AI(')) {
      addXP(50, 'question');
    } else {
      addXP(10, 'xp');
    }

    const absoluteRowIndex = getAbsoluteRowIndex(rowIndex);
    const updatedSheets = [...workbook.sheets];
    const currentSheet = updatedSheets[workbook.activeSheetIndex];
    const newRows = [...currentSheet.rows];

    let finalValue: string | number = value;
    const num = parseFloat(value);
    if (!isNaN(num) && isFinite(num) && String(num) === value.trim()) {
      finalValue = num;
    }
    newRows[absoluteRowIndex] = { ...newRows[absoluteRowIndex], [colKey]: finalValue };

    const newSheetData = { ...currentSheet, rows: newRows };
    // pushToHistory will handle setWorkbook and history management
    pushToHistory(newSheetData);
  }, [workbook, currentSheetData, pushToHistory, displayRows]);

  const handleFillRange = useCallback((sourceRange: SelectionRange, targetRange: SelectionRange) => {
    if (!workbook || !currentSheetData) return;

    const updatedSheets = [...workbook.sheets];
    const currentSheet = updatedSheets[workbook.activeSheetIndex];
    const newRows = [...currentSheet.rows];
    const columns = currentSheet.columns;

    const sStartRow = Math.min(sourceRange.start.rowIndex, sourceRange.end.rowIndex);
    const sEndRow = Math.max(sourceRange.start.rowIndex, sourceRange.end.rowIndex);
    const sStartCol = Math.min(sourceRange.start.colIndex, sourceRange.end.colIndex);
    const sEndCol = Math.max(sourceRange.start.colIndex, sourceRange.end.colIndex);

    const tStartRow = Math.min(targetRange.start.rowIndex, targetRange.end.rowIndex);
    const tEndRow = Math.max(targetRange.start.rowIndex, targetRange.end.rowIndex);
    const tStartCol = Math.min(targetRange.start.colIndex, targetRange.end.colIndex);
    const tEndCol = Math.max(targetRange.start.colIndex, targetRange.end.colIndex);

    const sourceWidth = sEndCol - sStartCol + 1;
    const sourceHeight = sEndRow - sStartRow + 1;

    for (let r = tStartRow; r <= tEndRow; r++) {
      for (let c = tStartCol; c <= tEndCol; c++) {
        if (r >= sStartRow && r <= sEndRow && c >= sStartCol && c <= sEndCol) continue;

        const relRow = (r - sStartRow) % sourceHeight;
        const relCol = (c - sStartCol) % sourceWidth;
        const sourceRowIdx = sStartRow + (relRow < 0 ? relRow + sourceHeight : relRow);
        const sourceColIdx = sStartCol + (relCol < 0 ? relCol + sourceWidth : relCol);

        const colKey = columns[c];
        const sourceColKey = columns[sourceColIdx];
        const sourceVal = currentSheet.rows[sourceRowIdx][sourceColKey];

        if (typeof sourceVal === 'string' && sourceVal.startsWith('=')) {
          const rowShift = r - sourceRowIdx;
          const colShift = c - sourceColIdx;
          newRows[r] = { ...newRows[r], [colKey]: adjustFormulaReferences(sourceVal, rowShift, colShift) };
        } else {
          newRows[r] = { ...newRows[r], [colKey]: sourceVal };
        }
      }
    }

    const newSheetData = { ...currentSheet, rows: newRows };
    updatedSheets[workbook.activeSheetIndex] = newSheetData;

    setWorkbook({
      ...workbook,
      sheets: updatedSheets,
      lastModified: new Date()
    });

    pushToHistory(newSheetData);
    addToast('info', 'Smart Fill', 'Range populated automatically');
  }, [workbook, currentSheetData, pushToHistory, addToast]);

  const handleInsertRow = useCallback((rowIndex: number) => {
    if (!workbook || !currentSheetData) return;
    const updatedSheets = [...workbook.sheets];
    const currentSheet = updatedSheets[workbook.activeSheetIndex];
    const newRows = [...currentSheet.rows];

    const newRow = {};
    currentSheet.columns.forEach(col => { newRow[col] = ''; });
    newRows.splice(rowIndex, 0, newRow);

    const newSheetData = { ...currentSheet, rows: newRows };
    updatedSheets[workbook.activeSheetIndex] = newSheetData;
    setWorkbook({ ...workbook, sheets: updatedSheets, lastModified: new Date() });
    pushToHistory(newSheetData);
    addToast('success', 'Row Inserted');
  }, [workbook, currentSheetData, pushToHistory, addToast]);

  const handleDeleteRow = useCallback((rowIndex: number) => {
    if (!workbook || !currentSheetData) return;
    const absoluteRowIndex = getAbsoluteRowIndex(rowIndex);
    const updatedSheets = [...workbook.sheets];
    const currentSheet = updatedSheets[workbook.activeSheetIndex];
    const newRows = [...currentSheet.rows];
    newRows.splice(absoluteRowIndex, 1);

    const newSheetData = { ...currentSheet, rows: newRows };
    updatedSheets[workbook.activeSheetIndex] = newSheetData;
    setWorkbook({ ...workbook, sheets: updatedSheets, lastModified: new Date() });
    pushToHistory(newSheetData);
    addToast('info', 'Row Deleted');
  }, [workbook, currentSheetData, pushToHistory, addToast]);

  const handleInsertColumn = useCallback((afterColKey: string) => {
    if (!workbook || !currentSheetData) return;
    const updatedSheets = [...workbook.sheets];
    const currentSheet = updatedSheets[workbook.activeSheetIndex];
    const newCols = [...currentSheet.columns];
    const colIndex = newCols.indexOf(afterColKey);

    const newColName = indexToExcelCol(newCols.length); // Simple default
    newCols.splice(colIndex + 1, 0, newColName);

    const newRows = currentSheet.rows.map(row => ({ ...row, [newColName]: '' }));

    const newSheetData = { ...currentSheet, columns: newCols, rows: newRows };
    updatedSheets[workbook.activeSheetIndex] = newSheetData;
    setWorkbook({ ...workbook, sheets: updatedSheets, lastModified: new Date() });
    pushToHistory(newSheetData);
    addToast('success', 'Column Inserted');
  }, [workbook, currentSheetData, pushToHistory, addToast]);

  const handleDeleteColumn = useCallback((colKey: string) => {
    if (!workbook || !currentSheetData) return;
    const updatedSheets = [...workbook.sheets];
    const currentSheet = updatedSheets[workbook.activeSheetIndex];
    const newCols = currentSheet.columns.filter(c => c !== colKey);
    const newRows = currentSheet.rows.map(row => {
      const { [colKey]: _, ...rest } = row;
      return rest;
    });

    const newSheetData = { ...currentSheet, columns: newCols, rows: newRows };
    updatedSheets[workbook.activeSheetIndex] = newSheetData;
    setWorkbook({ ...workbook, sheets: updatedSheets, lastModified: new Date() });
    pushToHistory(newSheetData);
    addToast('info', 'Column Deleted');
  }, [workbook, currentSheetData, pushToHistory, addToast]);

  const handleRenameColumn = useCallback((oldKey: string, newKey: string) => {
    if (!workbook || !currentSheetData) return;
    if (currentSheetData.columns.includes(newKey)) {
      addToast('error', 'Renaem Failed', 'Column name already exists');
      return;
    }
    const updatedSheets = [...workbook.sheets];
    const currentSheet = updatedSheets[workbook.activeSheetIndex];
    const newCols = currentSheet.columns.map(c => c === oldKey ? newKey : c);
    const newRows = currentSheet.rows.map(row => {
      const newRow = { ...row };
      newRow[newKey] = row[oldKey];
      delete newRow[oldKey];
      return newRow;
    });

    const newSheetData = { ...currentSheet, columns: newCols, rows: newRows };
    updatedSheets[workbook.activeSheetIndex] = newSheetData;
    setWorkbook({ ...workbook, sheets: updatedSheets, lastModified: new Date() });
    pushToHistory(newSheetData);
    addToast('success', 'Column Renamed');
  }, [workbook, currentSheetData, pushToHistory, addToast]);

  const handleSortColumn = useCallback((colKey: string, direction: 'asc' | 'desc') => {
    if (!workbook || !currentSheetData) return;

    const updatedSheets = [...workbook.sheets];
    const currentSheet = updatedSheets[workbook.activeSheetIndex];
    const rows = [...currentSheet.rows];

    rows.sort((a, b) => {
      const valA = a[colKey];
      const valB = b[colKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      // Attempt numeric comparison if possible
      const numA = parseFloat(String(valA));
      const numB = parseFloat(String(valB));
      if (!isNaN(numA) && !isNaN(numB)) {
        return direction === 'asc' ? numA - numB : numB - numA;
      }

      const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return direction === 'asc' ? comparison : -comparison;
    });

    const newSheetData = { ...currentSheet, rows };
    updatedSheets[workbook.activeSheetIndex] = newSheetData;

    setWorkbook({
      ...workbook,
      sheets: updatedSheets,
      lastModified: new Date()
    });

    pushToHistory(newSheetData);
    addToast('success', `Excel Sort`, `Column ${colKey} sorted ${direction}`);
  }, [workbook, currentSheetData, pushToHistory, addToast]);

  const handleFilterChange = useCallback((colKey: string, selectedValues: any[] | null) => {
    setActiveFilters(prev => {
      if (selectedValues === null) {
        const next = { ...prev };
        delete next[colKey];
        return next;
      }
      return { ...prev, [colKey]: selectedValues };
    });
  }, []);

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

  const handleCellFormat = useCallback((style: any) => {
    const currentWorkbook = workbookRef.current;
    if (!currentWorkbook || !selectedRange) return;

    const updatedSheets = [...currentWorkbook.sheets];
    const currentSheet = updatedSheets[currentWorkbook.activeSheetIndex];
    const newCellStyles = { ...(currentSheet.cellStyles || {}) };

    for (let r = Math.min(selectedRange.start.rowIndex, selectedRange.end.rowIndex); r <= Math.max(selectedRange.start.rowIndex, selectedRange.end.rowIndex); r++) {
      for (let c = Math.min(selectedRange.start.colIndex, selectedRange.end.colIndex); c <= Math.max(selectedRange.start.colIndex, selectedRange.end.colIndex); c++) {
        const colKey = currentSheet.columns[c];
        const key = `${r}-${colKey}`;
        newCellStyles[key] = { ...(newCellStyles[key] || {}), ...style };
      }
    }

    const newSheetData = { ...currentSheet, cellStyles: newCellStyles };
    updatedSheets[currentWorkbook.activeSheetIndex] = newSheetData;
    setWorkbook({ ...currentWorkbook, sheets: updatedSheets, lastModified: new Date() });
    pushToHistory(newSheetData);
  }, [selectedRange, pushToHistory]);

  const handleApplyCellStyle = useCallback((style: CellStyle) => {
    const currentWorkbook = workbookRef.current;
    if (!currentWorkbook || !selectedRange || !currentSheetData) return;

    const updatedSheets = [...currentWorkbook.sheets];
    const currentSheet = updatedSheets[currentWorkbook.activeSheetIndex];
    const newCellStyles = { ...(currentSheet.cellStyles || {}) };

    const { start, end } = selectedRange;
    const minRow = Math.min(start.rowIndex, end.rowIndex);
    const maxRow = Math.max(start.rowIndex, end.rowIndex);
    const minCol = Math.min(start.colIndex, end.colIndex);
    const maxCol = Math.max(start.colIndex, end.colIndex);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const colKey = currentSheet.columns[c];
        const key = `${r}-${colKey}`;

        // Define style properties based on the selected preset
        let styleProps: any = {};

        switch (style.id) {
          case 'currency':
          case 'currency-eur':
            styleProps = { color: '#10b981', fontWeight: '500' };
            break;
          case 'percentage':
            styleProps = { color: '#3b82f6', fontWeight: '500' };
            break;
          case 'date-short':
          case 'date-long':
            styleProps = { color: '#f59e0b' };
            break;
          case 'boolean':
            styleProps = { fontWeight: 'bold', color: '#8b5cf6' };
            break;
          default:
            styleProps = { color: 'inherit' };
        }

        newCellStyles[key] = { ...(newCellStyles[key] || {}), ...styleProps, format: style.format };
      }
    }

    const newSheetData = { ...currentSheet, cellStyles: newCellStyles };
    updatedSheets[currentWorkbook.activeSheetIndex] = newSheetData;
    setWorkbook({ ...currentWorkbook, sheets: updatedSheets, lastModified: new Date() });
    pushToHistory(newSheetData);
    addToast('success', 'Style Applied', `${style.name} style applied to selection`);
  }, [selectedRange, currentSheetData, pushToHistory, addToast]);

  const handleFormatPainterClick = () => {
    if (selectedRange && currentSheetData) {
      setIsFormatPainterActive(true);
      const colKey = currentSheetData.columns[selectedRange.start.colIndex];
      setFormatPainterSource({ rowIndex: selectedRange.start.rowIndex, colKey });
      addToast('info', 'Format Painter Active', 'Click a cell to apply formatting');
    }
  };

  const handleFormatPainterApply = useCallback((rowIndex: number, colKey: string) => {
    const currentWorkbook = workbookRef.current;
    if (!currentWorkbook || !formatPainterSource) return;

    const updatedSheets = [...currentWorkbook.sheets];
    const currentSheet = updatedSheets[currentWorkbook.activeSheetIndex];
    const newCellStyles = { ...(currentSheet.cellStyles || {}) };

    const sourceKey = `${formatPainterSource.rowIndex}-${formatPainterSource.colKey}`;
    const sourceStyle = currentSheet.cellStyles?.[sourceKey] || {};

    const targetKey = `${rowIndex}-${colKey}`;
    newCellStyles[targetKey] = { ...sourceStyle };

    const newSheetData = { ...currentSheet, cellStyles: newCellStyles };
    updatedSheets[currentWorkbook.activeSheetIndex] = newSheetData;
    setWorkbook({ ...currentWorkbook, sheets: updatedSheets, lastModified: new Date() });
    pushToHistory(newSheetData);
    setIsFormatPainterActive(false);
    setFormatPainterSource(null);
  }, [formatPainterSource, pushToHistory]);

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
    for (let i = 1; i <= maxSplits; i++) addedHeaders.push(`${column}_Split_${i}`);
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
      switch (operation) {
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

  const handleClearRange = (range: SelectionRange) => {
    if (!workbook || !currentSheetData) return;
    const { start, end } = range;
    const minRow = Math.min(start.rowIndex, end.rowIndex);
    const maxRow = Math.max(start.rowIndex, end.rowIndex);
    const minCol = Math.min(start.colIndex, end.colIndex);
    const maxCol = Math.max(start.colIndex, end.colIndex);

    const updatedSheets = [...workbook.sheets];
    const currentSheet = updatedSheets[workbook.activeSheetIndex];
    const newRows = [...currentSheet.rows];

    for (let r = minRow; r <= maxRow; r++) {
      const absR = getAbsoluteRowIndex(r);
      const rowCopy = { ...newRows[absR] };
      for (let c = minCol; c <= maxCol; c++) {
        rowCopy[currentSheet.columns[c]] = '';
      }
      newRows[absR] = rowCopy;
    }

    const newSheetData = { ...currentSheet, rows: newRows };
    updatedSheets[workbook.activeSheetIndex] = newSheetData;
    setWorkbook({ ...workbook, sheets: updatedSheets, lastModified: new Date() });
    pushToHistory(newSheetData);
  };

  const handleSmartFill = async (targetColumn: string, prompt: string) => {
    if (!workbook || !currentSheetData) return;
    const updatedSheets = [...workbook.sheets];
    const currentSheet = updatedSheets[workbook.activeSheetIndex];

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
    updatedSheets[workbook.activeSheetIndex] = newSheetData;
    setWorkbook({ ...workbook, sheets: updatedSheets, lastModified: new Date() });
    pushToHistory(newSheetData);
    addToast('success', 'Smart Fill Complete', 'New column generated.');
  };

  const handleSmartFillTrigger = (colKey: string) => {
    setSmartFillSourceColumn(colKey);
    setIsSmartFillModalOpen(true);
  };

  const handleAddComment = (rowIndex: number, colIndex: number, text: string) => {
    if (!workbook || !currentSheetData) return;
    const absoluteRowIndex = getAbsoluteRowIndex(rowIndex);
    const updatedSheets = [...workbook.sheets];
    const currentSheet = updatedSheets[workbook.activeSheetIndex];

    const key = `${absoluteRowIndex}-${colIndex}`;
    const newComments = { ...(currentSheet.comments || {}), [key]: text };

    const newSheetData = { ...currentSheet, comments: newComments };
    updatedSheets[workbook.activeSheetIndex] = newSheetData;
    setWorkbook({ ...workbook, sheets: updatedSheets });
    pushToHistory(newSheetData);
    addToast('success', 'Comment Added');
  };

  const handleClearFilter = () => {
    setActiveFilters({});
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

  const selectedCell = useMemo(() => {
    if (!currentSheetData || !selectedRange) return null;
    const { start } = selectedRange;
    return { rowIndex: start.rowIndex, colKey: currentSheetData.columns[start.colIndex] };
  }, [currentSheetData, selectedRange]);

  const formulaBarValue = useMemo(() => {
    if (!selectedCell || !currentSheetData) return null;
    return currentSheetData.rows[selectedCell.rowIndex]?.[selectedCell.colKey] ?? null;
  }, [currentSheetData, selectedCell]);

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
    if (!currentSheetData) return;
    // Construct prompt context
    setIsSidebarOpen(true);
    const context = `I have selected a range of cells from ${indexToExcelCol(range.start.colIndex)}${range.start.rowIndex + 1} to ${indexToExcelCol(range.end.colIndex)}${range.end.rowIndex + 1}. Analyze this specific data.`;
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

    // Ensure unique name
    let counter = 1;
    let newName = `Sheet${workbook.sheets.length + counter}`;
    while (workbook.sheets.some(s => s.name === newName)) {
      newName = `Sheet${workbook.sheets.length + (++counter)}`;
    }
    newSheet.name = newName;

    const newWorkbook = {
      ...workbook,
      sheets: [...workbook.sheets, newSheet],
      activeSheetIndex: workbook.sheets.length,
      lastModified: new Date()
    };

    setWorkbook(newWorkbook);
    addToast('success', 'Sheet Added', `Added ${newName}`);
  };

  const handleDuplicateSheet = (index: number) => {
    if (!workbook) return;
    const sheetToDuplicate = workbook.sheets[index];
    // Create a robust copy of the sheet data
    const newSheet: SheetData = JSON.parse(JSON.stringify(sheetToDuplicate));
    newSheet.id = generateId();

    // Find unique name for duplicate
    let baseName = `${sheetToDuplicate.name} (Copy)`;
    let newName = baseName;
    let counter = 1;
    while (workbook.sheets.some(s => s.name === newName)) {
      newName = `${baseName} ${counter++}`;
    }
    newSheet.name = newName;

    const updatedSheets = [...workbook.sheets];
    updatedSheets.splice(index + 1, 0, newSheet);

    setWorkbook({
      ...workbook,
      sheets: updatedSheets,
      activeSheetIndex: index + 1,
      lastModified: new Date()
    });
    addToast('success', 'Sheet Duplicated', `Created ${newName}`);
  };

  const handleRenameSheet = (index: number, newName: string) => {
    if (!workbook || !newName.trim()) return;

    // Check if name already exists (other than the current sheet)
    if (workbook.sheets.some((s, i) => i !== index && s.name === newName.trim())) {
      addToast('error', 'Rename Failed', 'A sheet with this name already exists.');
      return;
    }

    const updatedSheets = [...workbook.sheets];
    updatedSheets[index] = { ...updatedSheets[index], name: newName.trim() };

    setWorkbook({
      ...workbook,
      sheets: updatedSheets,
      lastModified: new Date()
    });
  };

  const handleCloseSheet = (index: number) => {
    if (!workbook || workbook.sheets.length <= 1) {
      addToast('warning', 'Action Blocked', 'A workbook must contain at least one visible sheet.');
      return;
    }

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

    addToast('info', 'Sheet Removed', 'The sheet has been deleted.');
  };

  const handleActiveSheetChange = (index: number) => {
    if (!workbook || index >= workbook.sheets.length) return;

    setWorkbook({
      ...workbook,
      activeSheetIndex: index,
      lastModified: new Date()
    });
  };

  const handleMoveSheet = (fromIndex: number, toIndex: number) => {
    if (!workbook || fromIndex === toIndex) return;
    const updatedSheets = [...workbook.sheets];
    const [movedSheet] = updatedSheets.splice(fromIndex, 1);
    updatedSheets.splice(toIndex, 0, movedSheet);

    // Precision active index tracking
    let newActiveIndex = workbook.activeSheetIndex;
    if (fromIndex === workbook.activeSheetIndex) {
      newActiveIndex = toIndex;
    } else if (fromIndex < workbook.activeSheetIndex && toIndex >= workbook.activeSheetIndex) {
      newActiveIndex--;
    } else if (fromIndex > workbook.activeSheetIndex && toIndex <= workbook.activeSheetIndex) {
      newActiveIndex++;
    }

    setWorkbook({
      ...workbook,
      sheets: updatedSheets,
      activeSheetIndex: newActiveIndex,
      lastModified: new Date()
    });
  };

  const handleSetSheetColor = (index: number, color?: string) => {
    if (!workbook) return;
    const updatedSheets = [...workbook.sheets];
    updatedSheets[index] = { ...updatedSheets[index], tabColor: color };
    setWorkbook({
      ...workbook,
      sheets: updatedSheets,
      lastModified: new Date()
    });
  };

  // Command Palette Actions
  const commandActions = [
    { id: 'smart-fill', label: 'Smart Fill / AI Generate', icon: Wand2, action: () => setIsSmartFillModalOpen(true) },
    { id: 'formula-builder', label: 'Visual Formula Builder', icon: FunctionSquare, action: () => setIsVisualFormulaBuilderOpen(true) },
    { id: 'version-control', label: 'Version Control (Branches)', icon: GitBranch, action: () => setIsBranchManagerOpen(true) },
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

  const handleSwitchBranch = (branch: Branch) => {
    setWorkbook(branch.workbook);
    addToast('success', 'Branch Switched', `Now on branch: ${branch.name}`);
  };

  const handleSaveDetailRow = (rowIndex: number, updatedRow: Row) => {
     if (!workbook || !currentSheetData) return;
     const updatedSheets = [...workbook.sheets];
     const currentSheet = updatedSheets[workbook.activeSheetIndex];
     const newRows = [...currentSheet.rows];
     newRows[rowIndex] = updatedRow;
     const newSheetData = { ...currentSheet, rows: newRows };
     pushToHistory(newSheetData);
     addToast('success', 'Row Updated');
  };

  if (!currentUser) {
    return <LoginView onLogin={setCurrentUser} />;
  }

  return (
    <div className="saas-layout">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      
      {/* Gamification Overlays */}
      <PowerHourBanner powerHour={powerHour} />
      <CriticalHitFlash criticalHit={criticalHit} />
      <StreakGuard streak={gameState.streak} />
      
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
      <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} fileName={currentSheetData?.name || 'Untitled'} onNotify={addToast} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
      <NexusActionCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        sheetData={currentSheetData}
      />
      <TaskBoard
        isOpen={isTaskBoardOpen}
        onClose={() => setIsTaskBoardOpen(false)}
        sheetData={currentSheetData}
      />
      <DailyPlanner
        isOpen={isDailyPlannerOpen}
        onClose={() => setIsDailyPlannerOpen(false)}
      />
      <AIAgentNetwork
        isOpen={isAIAgentNetworkOpen}
        onClose={() => setIsAIAgentNetworkOpen(false)}
      />
      <CommunicationHub
        isOpen={isCommunicationHubOpen}
        onClose={() => setIsCommunicationHubOpen(false)}
      />
      <AnalyticsDashboard
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
      />
      <IntegrationCenter
        isOpen={isIntegrationCenterOpen}
        onClose={() => setIsIntegrationCenterOpen(false)}
      />

      {isFormModeOpen && activeFormSchema && (
        <FormMode 
           schema={activeFormSchema} 
           onExit={() => setIsFormModeOpen(false)} 
           onSubmit={handleFormSubmit}
        />
      )}
      <div className="saas-main">
        {/* Header */}
        <header className="saas-header">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="brand-logo cursor-pointer flex flex-col items-start sm:flex-row sm:items-center gap-0 sm:gap-2" onClick={handleGoHome}>
              <div className="flex items-center gap-2">
                <div className="icon-box">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-white text-sm sm:text-base font-semibold">RealSheet</span>
              </div>
              <span className="text-slate-400 text-xs hidden sm:block ml-0 sm:ml-1">Fast, keyboard-first spreadsheets</span>
            </div>

            {/* Navigation Pills */}
            {currentSheetData && view === 'editor' && (
              <div className={`${isMobile ? 'flex' : 'hidden md:flex'} bg-slate-800/50 rounded-lg p-1 border border-slate-700/50 animate-in fade-in zoom-in`}>
                <button
                  onClick={() => setActiveTab('grid')}
                  className={`tab-pill ${activeTab === 'grid' ? 'active' : ''}`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  {!isMobile && <span className="mobile-hidden">Data</span>}
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`tab-pill ${activeTab === 'dashboard' ? 'active' : ''}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  {!isMobile && <span className="mobile-hidden">Dashboard</span>}
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

            {/* Presence Indicators */}
            <div className="flex -space-x-2 mr-2">
              {presences.map((presence) => (
                <div
                  key={presence.userId}
                  className="w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
                  style={{ backgroundColor: presence.color }}
                  title={presence.userName}
                >
                  {presence.userName.charAt(0)}
                </div>
              ))}
            </div>

            <button onClick={() => setIsUpgradeModalOpen(true)} className="flex items-center justify-center p-1.5 rounded-full bg-gradient-to-r from-amber-200 to-yellow-400 text-slate-900 shadow-lg shadow-amber-500/20 hover:scale-105 transition-transform" title="Upgrade to Pro – see what's included">
              <Crown className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsNotificationCenterOpen(true)}
              className="btn-icon relative"
              title="Notifications & Tasks"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative group mobile-hidden">
              <button className="btn-icon flex items-center gap-1 hover:bg-black/10 transition-colors" title="Workspace Apps">
                <LayoutGrid className="w-4 h-4" />
              </button>
              <div className="absolute top-full right-0 mt-2 w-48 py-2 bg-[var(--nexus-surface)] border border-[var(--nexus-border)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button onClick={() => setIsTaskBoardOpen(true)} className="w-full text-left px-4 py-2 hover:bg-[var(--cell-hover-bg)] text-xs flex items-center gap-2 transition-colors"><CheckCircle className="w-3.5 h-3.5" /> Task Board</button>
                <button onClick={() => setIsDailyPlannerOpen(true)} className="w-full text-left px-4 py-2 hover:bg-[var(--cell-hover-bg)] text-xs flex items-center gap-2 transition-colors"><Calendar className="w-3.5 h-3.5" /> Daily Planner</button>
                <button onClick={() => setIsAIAgentNetworkOpen(true)} className="w-full text-left px-4 py-2 hover:bg-[var(--cell-hover-bg)] text-xs flex items-center gap-2 transition-colors"><Bot className="w-3.5 h-3.5" /> AI Network</button>
                <button onClick={() => setIsCommunicationHubOpen(true)} className="w-full text-left px-4 py-2 hover:bg-[var(--cell-hover-bg)] text-xs flex items-center gap-2 transition-colors"><Phone className="w-3.5 h-3.5" /> Comm Hub</button>
                <button onClick={() => setIsAnalyticsOpen(true)} className="w-full text-left px-4 py-2 hover:bg-[var(--cell-hover-bg)] text-xs flex items-center gap-2 transition-colors"><TrendingUp className="w-3.5 h-3.5" /> Analytics</button>
                <button onClick={handleGenerateForm} className="w-full text-left px-4 py-2 hover:bg-[var(--cell-hover-bg)] text-xs flex items-center gap-2 transition-colors text-blue-400"><FileCode className="w-3.5 h-3.5" /> Generate Entry Form</button>
                <button onClick={() => setIsIntegrationCenterOpen(true)} className="w-full text-left px-4 py-2 hover:bg-[var(--cell-hover-bg)] text-xs flex items-center gap-2 transition-colors"><Plug className="w-3.5 h-3.5" /> Integrations</button>
              </div>
            </div>

            <button onClick={() => setIsShortcutsOpen(true)} className="btn-icon" title="Help & keyboard shortcuts">
              <HelpCircle className="w-4 h-4" />
            </button>

            <button onClick={toggleTheme} className="btn-icon" title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
                onLogout={() => { setCurrentUser(null); handleGoHome(); addToast('info', 'Signed Out'); }}
              />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="saas-workspace">
          {view === 'home' ? (
            <HomeView
              currentUser={currentUser}
              onOpenFile={handleOpenFile}
              onNewFile={handleCreateBlank}
              onUpload={handleFile}
              onTemplate={handleTemplate}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onDownloadFile={handleDownloadFile}
            />
          ) : (
            <>
              <div className="flex-1 flex flex-row overflow-hidden relative">
                {/* Left Side: Main Editor Stack */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0">
                  {activeTab === 'grid' && currentSheetData ? (
                    <>
                      {/* Quick Access Toolbar + Ribbon (desktop) */}
                      {!isMobile && (
                        <>
                          <Ribbon
                            activeTab={ribbonTab}
                            onTabChange={setRibbonTab}
                            sheetData={!!currentSheetData}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            canUndo={historyIndex > 0}
                            canRedo={historyIndex < history.length - 1}
                            onFormatting={() => setIsFormattingModalOpen(true)}
                            onDataTools={() => setDataToolsState({ isOpen: true, mode: 'duplicates' })}
                            onChart={() => setIsChartWizardOpen(true)}
                            onPivot={() => setIsPivotModalOpen(true)}
                            onSmartFill={() => setIsSmartFillModalOpen(true)}
                            onWatchWindow={() => setIsWatchWindowOpen(!isWatchWindowOpen)}
                            isWatchOpen={isWatchWindowOpen}
                            onExport={handleDownload}
                            onShare={() => setIsShareModalOpen(true)}
                            onGoalSeek={() => setIsGoalSeekModalOpen(true)}
                            onFormatPainter={handleFormatPainterClick}
                            isFormatPainterActive={isFormatPainterActive}
                            onCellStyles={() => setIsCellStylesOpen(true)}
                            onCellFormat={handleCellFormat}
                            pageLayoutView={pageLayoutView}
                            onPageLayoutToggle={() => setPageLayoutView(v => !v)}
                            onSetPrintArea={handleSetPrintArea}
                            onClearPrintArea={handleClearPrintArea}
                            hasPrintArea={!!(currentSheetData?.printArea)}
                            onExportExcel={handleExportExcel}
                            onPrint={handlePrint}
                          />
                        </>
                      )}
                      {/* Formula Bar */}
                      <FormulaBar
                        selectedCell={selectedCell}
                        value={formulaBarValue}
                        columns={currentSheetData.columns}
                        cellAddress={selectedRange ? `${indexToExcelCol(selectedRange.start.colIndex)}${selectedRange.start.rowIndex + 1}` : undefined}
                        onChange={(value) => {
                          if (selectedCell) handleCellEdit(selectedCell.rowIndex, selectedCell.colKey, value);
                        }}
                      />
                      <div className={`flex-1 min-h-0 data-grid-container ${pageLayoutView ? 'page-layout-view' : ''}`}>
                        <GridErrorBoundary>
                          <Grid
                            data={{ ...currentSheetData, rows: displayRows }}
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
                            onFillRange={handleFillRange}
                            onSortColumn={handleSortColumn}
                            onFormatPainterApply={handleFormatPainterApply}
                            onFilterChange={handleFilterChange}
                            activeFilters={activeFilters}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            isFormatPainterActive={isFormatPainterActive}
                            highlightedCells={highlightedCells}
                            presences={presences}
                          />
                        </GridErrorBoundary>
                      </div>
                    </>
                  ) : currentSheetData ? (
                    <Dashboard items={dashboardItems} sheetData={currentSheetData} onRemoveItem={removeFromDashboard} />
                  ) : null}

                  {/* Sheet Tabs - Directly below the grid/dashboard */}
                  {workbook && isSheetTabsVisible && (
                    <SheetTabs
                      workbook={workbook}
                      onActiveSheetChange={handleActiveSheetChange}
                      onAddSheet={handleAddSheet}
                      onRenameSheet={handleRenameSheet}
                      onCloseSheet={handleCloseSheet}
                      onDuplicateSheet={handleDuplicateSheet}
                      onMoveSheet={handleMoveSheet}
                      onSetColor={handleSetSheetColor}
                    />
                  )}

                  {/* Status Bar - Bottom of the left stack */}
                  <div className="status-bar flex items-center justify-between" style={{ background: 'var(--status-bg)' }}>
                    <div className="flex items-center gap-4">
                      <div className="status-item">
                        <span className="text-[11px]" style={{ color: 'var(--nexus-text-muted)' }}>Ready</span>
                      </div>
                      <div className="separator" />
                      <div className="status-item">
                        <Database className="w-3.5 h-3.5" />
                        <span className="font-medium" style={{ color: 'var(--nexus-text-main)' }}>{currentSheetData?.name || 'Untitled'}</span>
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

                    <div className="flex items-center gap-3">
                      <div className="status-item">
                        <span className={historyIndex > 0 ? "text-amber-400" : "text-green-400"}>
                          {historyIndex > 0 ? "● Saving..." : "● Saved"}
                        </span>
                      </div>
                      <div className="separator" />
                      <select
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="text-[11px] rounded px-1.5 py-0.5 border bg-transparent"
                        style={{ color: 'var(--nexus-text-main)', borderColor: 'var(--nexus-border)' }}
                        title="Zoom"
                      >
                        {[50, 75, 90, 100, 125, 150, 200].map((n) => (
                          <option key={n} value={n}>{n}%</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right Side: Agent Sidebar */}
                <aside className={`saas-sidebar-panel ${!isSidebarOpen ? 'hidden-panel' : ''}`}>
                  <Agent
                    sheetData={currentSheetData}
                    workbook={workbook}
                    onAddToDashboard={addToDashboard}
                    onUpdateData={pushToHistory}
                    onUpdateWorkbook={(wb) => setWorkbook(wb)}
                    onSwitchSheet={handleActiveSheetChange}
                    promptOverride={agentPromptOverride}
                    onClearPromptOverride={() => setAgentPromptOverride(null)}
                  />
                </aside>
              </div>

              {/* Watch Window - Floating overlay */}
              {currentSheetData && (
                <WatchWindow
                  isOpen={isWatchWindowOpen}
                  onClose={() => setIsWatchWindowOpen(false)}
                  data={currentSheetData}
                  onRemoveWatch={handleRemoveWatch}
                  onAddWatch={handleAddWatch}
                />
              )}
            </>
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

          <VisualFormulaBuilder
            isOpen={isVisualFormulaBuilderOpen}
            onClose={() => setIsVisualFormulaBuilderOpen(false)}
            columns={currentSheetData?.columns || []}
            onApply={(formula) => {
               if (selectedCell) handleCellEdit(selectedCell.rowIndex, selectedCell.colKey, formula);
            }}
          />

          {workbook && (
            <BranchManager
              isOpen={isBranchManagerOpen}
              onClose={() => setIsBranchManagerOpen(false)}
              workbook={workbook}
              onSwitchBranch={handleSwitchBranch}
              onUpdateWorkbook={(wb) => setWorkbook(wb)}
            />
          )}

          {isRecordDetailOpen && activeDetailRowIndex !== null && currentSheetData && (
            <RecordDetailView
              isOpen={isRecordDetailOpen}
              onClose={() => setIsRecordDetailOpen(false)}
              row={currentSheetData.rows[activeDetailRowIndex]}
              columns={currentSheetData.columns}
              rowIndex={activeDetailRowIndex}
              onSave={handleSaveDetailRow}
              onNext={activeDetailRowIndex < currentSheetData.rows.length - 1 ? () => setActiveDetailRowIndex(activeDetailRowIndex + 1) : undefined}
              onPrev={activeDetailRowIndex > 0 ? () => setActiveDetailRowIndex(activeDetailRowIndex - 1) : undefined}
            />
          )}

          <OnboardingTour
             isOpen={isOnboardingOpen}
             onClose={() => {
                setIsOnboardingOpen(false);
                localStorage.setItem('realsheet_tour_seen', 'true');
             }}
          />

          <CommandPalette
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            actions={commandActions}
            fileActions={getRecentFiles(10).map((f) => ({
              id: `file-${f.id}`,
              label: f.name,
              icon: FileSpreadsheet,
              action: () => handleOpenFile(f.id),
            }))}
          />

          <CellStylesGallery
            isOpen={isCellStylesOpen}
            onClose={() => setIsCellStylesOpen(false)}
            onSelectStyle={handleApplyCellStyle}
          />
        </main>
      </div>

      {/* Transition Overlay */}
      {isTransitioning && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 animate-spin" />
            <div className="absolute inset-4 rounded-full border-2 border-purple-500/20 animate-pulse" />
            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <p className="mt-8 text-cyan-400/80 font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Initializing Nexus Core...</p>
        </div>
      )}

      {/* While You Were Away / Load Summary Card */}
      {loadSummary && (
        <div className="fixed top-24 right-6 z-[100] w-72 bg-slate-900/40 backdrop-blur-3xl border border-cyan-500/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-4 animate-in slide-in-from-right-8 fade-in duration-700">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/80">Nexus Intelligence</span>
            </div>
            <button onClick={() => setLoadSummary(null)} className="text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <h4 className="text-white font-medium text-sm mb-1">{loadSummary.title}</h4>
          <p className="text-slate-400 text-xs leading-relaxed">{loadSummary.hint}</p>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[9px] text-slate-500 font-mono">SCAN COMPLETE</span>
            <Sparkles className="w-3 h-3 text-cyan-400/50" />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;