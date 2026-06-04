import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal, Play, Trash2, Copy, Save, Code, Database,
  ChevronRight, AlertCircle, CheckCircle2, X, Maximize2,
  Minimize2, History, Wand2, Info
} from 'lucide-react';
import { Workbook, SheetData } from '../types';
import alasql from 'alasql';

interface DeveloperConsoleProps {
  isOpen: boolean;
  onClose: () => void;
  workbook: Workbook;
  onUpdateWorkbook: (workbook: Workbook) => void;
  onUpdateData: (data: SheetData) => void;
}

type ConsoleMode = 'js' | 'sql' | 'python';

interface ConsoleLog {
  id: string;
  type: 'input' | 'output' | 'error' | 'info';
  mode: ConsoleMode;
  content: string;
  timestamp: Date;
}

const DeveloperConsole: React.FC<DeveloperConsoleProps> = ({
  isOpen,
  onClose,
  workbook,
  onUpdateWorkbook,
  onUpdateData
}) => {
  const [mode, setMode] = useState<ConsoleMode>('js');
  const [input, setInput] = useState('');
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pyodide, setPyodide] = useState<any>(null);
  const [isPythonLoading, setIsPythonLoading] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const activeSheet = workbook.sheets[workbook.activeSheetIndex];

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (type: ConsoleLog['type'], content: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      type,
      mode,
      content,
      timestamp: new Date()
    }]);
  };

  const handleRun = () => {
    if (!input.trim()) return;

    addLog('input', input);

    if (mode === 'js') {
      runJS(input);
    } else if (mode === 'sql') {
      runSQL(input);
    } else if (mode === 'python') {
      runPython(input);
    }
  };

  const runJS = (code: string) => {
    try {
      // Provide a safe-ish environment
      const context = {
        sheet: JSON.parse(JSON.stringify(activeSheet)),
        workbook: JSON.parse(JSON.stringify(workbook)),
        Math,
        JSON,
        console: {
          log: (...args: any[]) => addLog('info', args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
        }
      };

      const fn = new Function('ctx', `
        const { sheet, workbook, Math, JSON, console } = ctx;
        ${code}
        return { sheet, workbook };
      `);

      const result = fn(context);

      if (result.sheet && JSON.stringify(result.sheet) !== JSON.stringify(activeSheet)) {
        onUpdateData(result.sheet);
        addLog('info', 'Spreadsheet updated via script');
      }

      addLog('output', 'Execution successful');
    } catch (err: any) {
      addLog('error', err.message);
    }
  };

  const initPython = async () => {
    if (pyodide) return pyodide;

    setIsPythonLoading(true);
    addLog('info', 'Initializing Python environment (Pyodide)...');

    try {
      const py = await (window as any).loadPyodide();
      setPyodide(py);
      setIsPythonLoading(false);
      addLog('info', 'Python 3.11 engine ready');
      return py;
    } catch (err: any) {
      setIsPythonLoading(false);
      addLog('error', `Failed to load Python: ${err.message}`);
      return null;
    }
  };

  const runPython = async (code: string) => {
    const py = await initPython();
    if (!py) return;

    try {
      // Inject workbook data into Python
      // We convert to JSON then parse in Python to avoid proxy issues
      const dataJson = JSON.stringify(activeSheet.rows);
      py.runPython(`
import json
rows = json.loads('${dataJson.replace(/'/g, "\\'")}')
def get_rows():
    return rows
def set_cell(row_idx, col_name, value):
    rows[row_idx][col_name] = value
      `);

      // Execute user code
      const result = await py.runPythonAsync(code);

      // Extract modified data
      const modifiedData = py.runPython("json.dumps(rows)");
      const newRows = JSON.parse(modifiedData);

      if (JSON.stringify(newRows) !== JSON.stringify(activeSheet.rows)) {
        onUpdateData({ ...activeSheet, rows: newRows });
        addLog('info', 'Spreadsheet updated via Python script');
      }

      if (result !== undefined) {
        addLog('output', String(result));
      } else {
        addLog('output', 'Python script completed');
      }
    } catch (err: any) {
      addLog('error', err.message);
    }
  };

  const runSQL = (query: string) => {
    try {
      // Map sheet data to AlaSQL format
      const data = activeSheet.rows;

      // AlaSQL allows querying arrays of objects
      // Use [?] as placeholder for the data
      const result = alasql(query, [data]);

      if (Array.isArray(result)) {
        addLog('output', JSON.stringify(result, null, 2));

        // If it's a SELECT into something or we want to update the sheet?
        // For now, just show result. In a real app, we might allow UPDATE/INSERT.
      } else {
        addLog('output', String(result));
      }
    } catch (err: any) {
      addLog('error', err.message);
    }
  };

  const clearLogs = () => setLogs([]);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-12 right-6 z-[100] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-[800px] h-[600px]' : 'w-[450px] h-[400px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white uppercase tracking-widest">Developer Console</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-slate-700 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            aria-label={isExpanded ? "Collapse Developer Console" : "Expand Developer Console"}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5 text-slate-400" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500" aria-label="Close Developer Console">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-800/50 p-1 border-b border-slate-700">
        <button
          onClick={() => setMode('js')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === 'js' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-3 h-3" />
          JavaScript
        </button>
        <button
          onClick={() => setMode('sql')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === 'sql' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3 h-3" />
          SQL
        </button>
        <button
          onClick={() => setMode('python')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mode === 'python' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3 h-3 text-yellow-500" />
          Python
        </button>
      </div>

      {/* Log Area */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-2 bg-slate-950/50">
        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
            <Terminal className="w-8 h-8" />
            <p>Ready for input...</p>
            {mode === 'sql' && <p className="text-[9px]">Example: SELECT * FROM ? WHERE Amount {'>'} 1000</p>}
            {mode === 'js' && <p className="text-[9px]">Example: sheet.rows[0].Status = &apos;Updated&apos;</p>}
            {mode === 'python' && (
              <div className="text-center space-y-1">
                <p className="text-[9px]">Example: rows[0][&quot;Status&quot;] = &quot;Pythonic&quot;</p>
                <p className="text-[9px] text-slate-700 italic">Uses Pyodide v0.26.1</p>
              </div>
            )}
          </div>
        )}
        {logs.map(log => (
          <div key={log.id} className="animate-in fade-in slide-in-from-left-1 duration-200">
            {log.type === 'input' ? (
              <div className="flex gap-2 text-slate-400">
                <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />
                <span className="break-all">{log.content}</span>
              </div>
            ) : (
              <div className={`pl-5 py-1 rounded ${
                log.type === 'error' ? 'text-red-400 bg-red-400/5 border-l-2 border-red-500' :
                log.type === 'info' ? 'text-cyan-400 bg-cyan-400/5' :
                'text-emerald-400'
              }`}>
                <pre className="whitespace-pre-wrap break-all font-mono">{log.content}</pre>
              </div>
            )}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-slate-800/80 border-t border-slate-700">
        <div className="relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleRun();
              }
            }}
            placeholder={
              mode === 'js' ? 'Write JavaScript code... (Ctrl+Enter to run)' :
              mode === 'sql' ? 'Write SQL query... (Ctrl+Enter to run)' :
              'Write Python code... (Ctrl+Enter to run)'
            }
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-[11px] font-mono text-cyan-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 min-h-[80px] max-h-[200px] transition-all shadow-inner"
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              onClick={clearLogs}
              className="p-1.5 text-slate-500 hover:text-red-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded"
              title="Clear Logs"
              aria-label="Clear Logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRun}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-[10px] font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-900/20 active:scale-95"
            >
              <Play className="w-3 h-3 fill-current" />
              RUN
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DeveloperConsole;
