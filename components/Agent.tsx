import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, StopCircle, Mic, Plus, Check, Zap, Calculator, PaintBucket, Filter, MessageSquare, Lightbulb, ListTodo, AlertCircle, ChevronRight, Code } from 'lucide-react';
import { ChatMessage, SheetData, ChartConfig, EnhancedAnalysisResult } from '../types';
import { analyzeDataWithGemini } from '../services/geminiService';
import { transformData } from '../services/apiClient';
import { safeEvaluate } from '../utils/safeFormulaParser';
import { parseRange, excelColToIndex, adjustFormulaReferences } from '../services/formulaService';
import { evaluateWithHF, syncWorkbook } from '../services/hyperformulaService';
import Visualization from './Visualization';

import { Workbook } from '../types';

interface AgentProps {
  sheetData: SheetData | null;
  workbook?: Workbook | null;
  onAddToDashboard: (config: ChartConfig) => void;
  onUpdateData: (newData: SheetData) => void;
  onUpdateWorkbook?: (workbook: Workbook) => void;
  onSwitchSheet?: (index: number) => void;
  promptOverride: string | null;
  onClearPromptOverride: () => void;
}

const Agent: React.FC<AgentProps> = ({ sheetData, workbook, onAddToDashboard, onUpdateData, onSwitchSheet, promptOverride, onClearPromptOverride }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Hello, I am RealSheet Agent. I can analyze your data, create visualizations, apply formatting, filter rows, and flag outliers. I show my reasoning and task planning.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState<string | null>(null);
   const [currentTurn, setCurrentTurn] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle external prompt override (e.g. from context menu)
  useEffect(() => {
    if (promptOverride) {
        setInput(promptOverride);
        // We could auto-submit here, but it's often better to let the user review
        // For "agentic" feel, let's just focus the input or auto-expand sidebar
    }
  }, [promptOverride]);

  // Auto-analyze when data is loaded
  useEffect(() => {
    if (sheetData) {
      const initialAnalyze = async () => {
        setIsLoading(true);
        try {
          setMessages(prev => [
            ...prev, 
            {
               id: 'system-start',
               role: 'model',
               text: `Analyzing ${sheetData.name}... identifying columns and potential trends.`,
               timestamp: new Date()
            }
          ]);

          const result = await analyzeDataWithGemini(
            "Please provide a brief summary of this dataset, identifying key columns and one interesting trend or visualization.", 
            sheetData
          );

          setMessages(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'model',
              text: result.textResponse,
              chartConfig: result.chartConfig,
              timestamp: new Date()
            }
          ]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
      };
    }
  }, [sheetData?.name]);

  const handleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    
    // Clear the override in parent so we can trigger the same prompt again if needed
    if (promptOverride) onClearPromptOverride();

    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
        let currentMessages = [...messages, userMsg];
        let turnCount = 0;
        const MAX_TURNS = 5;
        let finalSheetData = { ...sheetData } as SheetData;
        let hasChanges = false;
        let lastResult: EnhancedAnalysisResult | null = null;

        while (turnCount < MAX_TURNS) {
            turnCount++;
             setCurrentTurn(turnCount);

            const history = currentMessages
                .filter(m => m.id !== 'welcome' && m.id !== 'system-start')
                .map(m => ({ role: m.role, parts: [{ text: m.text }] }));

            setThinkingStep(`Reasoning turn ${turnCount}...`);
            const result: EnhancedAnalysisResult = await analyzeDataWithGemini(
                turnCount === 1 ? userMsg.text : "Please continue based on the tool results.",
                finalSheetData,
                history
            );

            lastResult = result;
            let actionMessage = "";
            let toolResults: string[] = [];

            // 1. Log Chain of Thought internally to currentMessages for model context
            if (result.chainOfThought) {
                currentMessages.push({
                    id: `cot-${Date.now()}-${turnCount}`,
                    role: 'model',
                    text: `💡 **Chain of Thought:** ${result.chainOfThought}`,
                    timestamp: new Date(),
                    isThinking: true
                });
            }

            // Verification Check - inspired by Spreadsheet-RL's outcome-based rewards
            const verifyOutcome = () => {
                if (!hasChanges) return "No changes made yet.";
                // Simple verification: ensure all formula cells evaluate correctly
                syncWorkbook(finalSheetData);
                const errors: string[] = [];
                finalSheetData.rows.forEach((row, rIdx) => {
                    finalSheetData.columns.forEach((col) => {
                        const val = row[col];
                        if (typeof val === 'string' && val.startsWith('=')) {
                            const result = evaluateWithHF(val, rIdx, col, finalSheetData);
                            if (result === '#VALUE!' || result === '#ERROR!') {
                                errors.push(`Error in cell ${col}${rIdx + 1}: ${result}`);
                            }
                        }
                    });
                });
                return errors.length === 0 ? "Verification passed: All cells consistent." : `Verification warning: ${errors.join(', ')}`;
            };

            // 2. Log Task Plan internally
            if (result.taskPlan && result.taskPlan.length > 0 && turnCount === 1) {
                currentMessages.push({
                    id: `plan-${Date.now()}-${turnCount}`,
                    role: 'model',
                    text: `📋 **Task Plan:**\n${result.taskPlan.map((step, i) => `${i + 1}. ${step}`).join('\n')}`,
                    timestamp: new Date(),
                    isThinking: true
                });
            }

            // 3. Handle Transformations
            if (result.transformationCode && finalSheetData) {
                try {
                    const transformResponse = await transformData({
                        code: result.transformationCode,
                        data: JSON.parse(JSON.stringify(finalSheetData.rows)),
                    });

                    if (transformResponse.success && transformResponse.data) {
                        const transformedRows = transformResponse.data;
                        const allKeys = new Set<string>();
                        transformedRows.forEach((r: any) => Object.keys(r).forEach(k => allKeys.add(k)));
                        const newColumns = Array.from(allKeys);

                        finalSheetData = {
                            ...finalSheetData,
                            columns: newColumns,
                            rows: transformedRows
                        };
                        hasChanges = true;
                        actionMessage += "\n\n⚡ Function executed & data updated.";
                        toolResults.push("Data transformation successful.");
                    }
                } catch (err) {
                    console.error("Transformation Error", err);
                    toolResults.push(`Transformation error: ${err}`);
                }
            }

            // 4. Handle Spreadsheet-Native Tool Calls (Spreadsheet-RL style)
            if (result.toolCalls && result.toolCalls.length > 0) {
                const readOnlyTools = ['inspect_range', 'find_cells', 'recalculate_and_read', 'get_sheet_list'];
                const writeTools = ['fill_formula', 'clear_range', 'delete_rows', 'delete_columns', 'code_interpreter', 'switch_active_sheet'];

                // Validate mix (Harness Rule: must not mix read-only and write-related)
                const hasReadOnly = result.toolCalls.some(c => readOnlyTools.includes(c.tool));
                const hasWrite = result.toolCalls.some(c => writeTools.includes(c.tool));

                if (hasReadOnly && hasWrite) {
                    console.warn("Agent mixed read-only and write-related calls. Rule violation.");
                    toolResults.push("Error: Cannot mix read-only and write-related tool calls in a single turn.");
                    break;
                }

                if (hasWrite && result.toolCalls.length > 1) {
                    console.warn("Agent issued multiple write calls. Rule violation.");
                    toolResults.push("Error: Write-related calls must be issued one at a time.");
                    break;
                }

                for (const call of result.toolCalls) {
                    const { tool, parameters } = call;

                    switch (tool) {
                        case 'fill_formula': {
                            const { range, formula } = parameters;
                            setThinkingStep(`Filling formula ${formula} in ${range}...`);
                            const rangeRef = parseRange(range);
                            if (rangeRef[0] && rangeRef[1]) {
                                const newRows = [...finalSheetData.rows];
                                const startR = rangeRef[0].rowIndex;
                                const startC = rangeRef[0].colIndex;

                                for (let r = startR; r <= rangeRef[1].rowIndex; r++) {
                                    for (let c = startC; c <= rangeRef[1].colIndex; c++) {
                                        if (r < newRows.length) {
                                            const colKey = finalSheetData.columns[c];
                                            // Adjust formula references relative to the top-left cell of the range
                                            const adjustedFormula = adjustFormulaReferences(formula, r - startR, c - startC);
                                            newRows[r] = { ...newRows[r], [colKey]: adjustedFormula };
                                        }
                                    }
                                }
                                finalSheetData = { ...finalSheetData, rows: newRows };
                                hasChanges = true;
                                actionMessage += `\n\n📝 Filled formula ${formula} in range ${range}.`;
                                toolResults.push(`Successfully filled formula ${formula} in range ${range}.`);
                            }
                            break;
                        }
                        case 'clear_range': {
                            const { range } = parameters;
                            setThinkingStep(`Clearing range ${range}...`);
                            const rangeRef = parseRange(range);
                            if (rangeRef[0] && rangeRef[1]) {
                                const newRows = [...finalSheetData.rows];
                                for (let r = rangeRef[0].rowIndex; r <= rangeRef[1].rowIndex; r++) {
                                    for (let c = rangeRef[0].colIndex; c <= rangeRef[1].colIndex; c++) {
                                        if (r < newRows.length) {
                                            const colKey = finalSheetData.columns[c];
                                            newRows[r] = { ...newRows[r], [colKey]: "" };
                                        }
                                    }
                                }
                                finalSheetData = { ...finalSheetData, rows: newRows };
                                hasChanges = true;
                                actionMessage += `\n\n🧹 Cleared range ${range}.`;
                                toolResults.push(`Successfully cleared range ${range}.`);
                            }
                            break;
                        }
                        case 'delete_rows': {
                            const { startIndex, count } = parameters;
                            setThinkingStep(`Deleting ${count} rows from index ${startIndex}...`);
                            const newRows = [...finalSheetData.rows];
                            newRows.splice(startIndex, count);
                            finalSheetData = { ...finalSheetData, rows: newRows };
                            hasChanges = true;
                            actionMessage += `\n\n🗑️ Deleted ${count} rows starting from index ${startIndex}.`;
                            toolResults.push(`Successfully deleted ${count} rows starting from index ${startIndex}.`);
                            break;
                        }
                        case 'delete_columns': {
                            const { columns: colsToDelete } = parameters;
                            setThinkingStep(`Deleting columns: ${colsToDelete.join(', ')}...`);
                            const newColumns = finalSheetData.columns.filter(c => !colsToDelete.includes(c));
                            const newRows = finalSheetData.rows.map(row => {
                                const newRow = { ...row };
                                colsToDelete.forEach((c: string) => delete newRow[c]);
                                return newRow;
                            });
                            finalSheetData = { ...finalSheetData, columns: newColumns, rows: newRows };
                            hasChanges = true;
                            actionMessage += `\n\n🗑️ Deleted columns: ${colsToDelete.join(', ')}.`;
                            toolResults.push(`Successfully deleted columns: ${colsToDelete.join(', ')}.`);
                            break;
                        }
                        case 'inspect_range': {
                            const { range } = parameters;
                            setThinkingStep(`Inspecting range ${range}...`);
                            const rangeRef = parseRange(range);
                            const sheetSummary = `Sheet name: ${finalSheetData.name}, Dimension: ${finalSheetData.rows.length + 1}x${finalSheetData.columns.length}`;

                            if (rangeRef[0] && rangeRef[1]) {
                                const inspected: any[] = [];
                                for (let r = rangeRef[0].rowIndex; r <= rangeRef[1].rowIndex; r++) {
                                    const rowData: any = {};
                                    for (let c = rangeRef[0].colIndex; c <= rangeRef[1].colIndex; c++) {
                                        if (r < finalSheetData.rows.length) {
                                            const colKey = finalSheetData.columns[c];
                                            const cellValue = finalSheetData.rows[r][colKey];
                                            const cellStyle = finalSheetData.cellStyles?.[`${r}-${colKey}`];
                                            const hasComment = finalSheetData.comments?.[`${r}-${colKey}`];

                                            rowData[colKey] = {
                                                value: cellValue,
                                                isFormula: typeof cellValue === 'string' && cellValue.startsWith('='),
                                                style: cellStyle,
                                                hasComment: !!hasComment
                                            };
                                        }
                                    }
                                    inspected.push(rowData);
                                }
                                toolResults.push(`INSPECT [${range}]:\nSummary: ${sheetSummary}\nData: ${JSON.stringify(inspected)}`);
                                actionMessage += `\n\n🔍 Inspected range ${range} with metadata.`;
                            }
                            break;
                        }
                        case 'find_cells': {
                            const { query } = parameters;
                            setThinkingStep(`Searching for "${query}"...`);
                            const matches: Array<{address: string, value: any}> = [];
                            const lowerQuery = String(query).toLowerCase();

                            // Check headers first (highest importance)
                            finalSheetData.columns.forEach((col) => {
                                if (col.toLowerCase().includes(lowerQuery)) {
                                    matches.push({ address: `${col}1 (Header)`, value: col });
                                }
                            });

                            // Check data cells
                            finalSheetData.rows.forEach((row, rIdx) => {
                                finalSheetData.columns.forEach((col) => {
                                    const val = String(row[col]);
                                    if (val.toLowerCase().includes(lowerQuery)) {
                                        matches.push({ address: `${col}${rIdx + 2}`, value: val }); // +2 because 1-based and row 1 is headers
                                    }
                                });
                            });

                            const resultStr = matches.length > 0
                                ? `Found ${matches.length} matches. Top results:\n${matches.slice(0, 15).map(m => `- ${m.address}: "${m.value}"`).join('\n')}`
                                : "No matches found.";

                            toolResults.push(`Search results for "${query}":\n${resultStr}`);
                            actionMessage += `\n\n🔎 Searched for "${query}".`;
                            break;
                        }
                        case 'recalculate_and_read': {
                            const { range } = parameters;
                            setThinkingStep(`Recalculating and reading ${range}...`);
                            // Force a fresh sync for accurate recalculation
                            syncWorkbook(finalSheetData);
                            const rangeRef = parseRange(range);
                            if (rangeRef[0] && rangeRef[1]) {
                                const calculated: any[] = [];
                                for (let r = rangeRef[0].rowIndex; r <= rangeRef[1].rowIndex; r++) {
                                    const rowValues: any = {};
                                    for (let c = rangeRef[0].colIndex; c <= rangeRef[1].colIndex; c++) {
                                        if (r < finalSheetData.rows.length) {
                                            const colKey = finalSheetData.columns[c];
                                            const evaluated = evaluateWithHF(finalSheetData.rows[r][colKey], r, colKey, finalSheetData);
                                            rowValues[colKey] = evaluated;
                                        }
                                    }
                                    calculated.push(rowValues);
                                }
                                toolResults.push(`Recalculated evaluated values for ${range}: ${JSON.stringify(calculated)}`);
                                actionMessage += `\n\n🔄 Recalculated and verified values in ${range}.`;
                            }
                            break;
                        }
                        case 'code_interpreter': {
                            const { code } = parameters;
                            setThinkingStep(`Executing custom code...`);
                            try {
                                const response = await transformData({
                                    code,
                                    data: JSON.parse(JSON.stringify(finalSheetData.rows)),
                                });
                                if (response.success && response.data) {
                                    finalSheetData = { ...finalSheetData, rows: response.data };
                                    hasChanges = true;
                                    toolResults.push("Code execution successful.");
                                    actionMessage += `\n\n💻 Executed custom code.`;
                                }
                            } catch (err) {
                                toolResults.push(`Code execution error: ${err}`);
                            }
                            break;
                        }
                        case 'get_sheet_list': {
                            setThinkingStep(`Retrieving sheet list...`);
                            if (workbook) {
                                const sheets = workbook.sheets.map((s, idx) => `${idx}: ${s.name}${idx === workbook.activeSheetIndex ? ' (Active)' : ''}`);
                                toolResults.push(`Sheets in workbook:\n${sheets.join('\n')}`);
                                actionMessage += `\n\n📋 Retrieved sheet list.`;
                            } else {
                                toolResults.push("Error: No workbook context available.");
                            }
                            break;
                        }
                        case 'switch_active_sheet': {
                            const { index } = parameters;
                            setThinkingStep(`Switching to sheet ${index}...`);
                            if (workbook && onSwitchSheet && index >= 0 && index < workbook.sheets.length) {
                                onSwitchSheet(index);
                                toolResults.push(`Successfully switched to sheet: ${workbook.sheets[index].name}`);
                                actionMessage += `\n\n🔌 Switched active sheet to "${workbook.sheets[index].name}".`;
                                // Update local state for next turns in the loop
                                finalSheetData = workbook.sheets[index];
                            } else {
                                toolResults.push(`Error: Invalid sheet index ${index}.`);
                            }
                            break;
                        }
                    }
                }
            }

            // Handle other result fields (Formatting, Filter, Comments) if this is the final turn or they are present
            if (result.formattingRules && result.formattingRules.length > 0) {
                 const mergedRules = [...(finalSheetData.formattingRules || []), ...result.formattingRules];
                 finalSheetData = { ...finalSheetData, formattingRules: mergedRules };
                 hasChanges = true;
            }
            if (result.filterCode) {
                 finalSheetData = { ...finalSheetData, filter: { description: `Filter: "${userMsg.text}"`, code: result.filterCode } };
                 hasChanges = true;
            }
            if (result.generatedComments && result.generatedComments.length > 0) {
                 const newComments = { ...(finalSheetData.comments || {}) };
                 result.generatedComments.forEach(c => { newComments[`${c.rowIndex}-${c.colIndex}`] = c.text; });
                 finalSheetData = { ...finalSheetData, comments: newComments };
                 hasChanges = true;
            }

            const aiMsg: ChatMessage = {
                id: `res-${Date.now()}-${turnCount}`,
                role: 'model',
                text: result.textResponse + actionMessage,
                chartConfig: result.chartConfig,
                timestamp: new Date(),
                toolCalls: result.toolCalls,
                turnResult: toolResults.join('\n')
            };

            // Only show the result to the user if it's the final turn or has a meaningful textResponse
            if (turnCount === MAX_TURNS || (!result.toolCalls?.length && result.textResponse)) {
                setMessages(prev => [...prev, aiMsg]);
            }
            currentMessages.push(aiMsg);

            // If we have tool results, we need to feed them back to the model in the next turn
            if (toolResults.length > 0 && turnCount < MAX_TURNS) {
                const verificationResult = verifyOutcome();
                const workbookSummary = `Workbook state: ${finalSheetData.rows.length} rows, ${finalSheetData.columns.length} columns. Columns: ${finalSheetData.columns.join(', ')}.`;

                const systemFeedback: ChatMessage = {
                    id: `sys-${Date.now()}-${turnCount}`,
                    role: 'user',
                    text: `TOOL RESULTS:\n${toolResults.join('\n')}\n\nVERIFICATION:\n${verificationResult}\n\nCONTEXT:\n${workbookSummary}\n\nINSTRUCTION:\nEvaluate if your plan is working. If verification failed or results are unexpected, state an "Alternative plan" and backtrack. If results are correct, proceed to the next step or finalize with a summary.`,
                    timestamp: new Date()
                };
                currentMessages.push(systemFeedback);
                // We don't show the raw tool results to the user to keep the chat clean
                // But we continue the loop
            } else {
                // No tool results or max turns reached, exit loop
                break;
            }
        }

        if (hasChanges) {
            onUpdateData(finalSheetData);
        }
    } catch (error) {
        console.error(error);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            text: "I'm having trouble connecting to the neural core (API Error). Please try again.",
            timestamp: new Date()
        }]);
    } finally {
        setIsLoading(false);
        setThinkingStep(null);
         setCurrentTurn(0);
    }
  };

  return (
    <div className="agent-container flex flex-col h-full bg-slate-900 border-l border-white/5 shadow-[-4px_0_24px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 flex items-center justify-center border border-white/10 shadow-inner group">
            <Bot className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h3 className="text-white text-sm font-bold leading-tight tracking-tight">NexAgent <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded ml-1 border border-cyan-500/20">v2.4</span></h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{isLoading ? 'Analyzing Data...' : 'Agent Active'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className={`chat-bubble ${msg.role}`}>
             <div className="whitespace-pre-wrap">{msg.text}</div>
             {msg.text.includes("mixed read-only and write-related") && (
                 <div className="mt-3 flex items-center gap-2 text-xs text-red-300 bg-red-900/30 p-2 rounded border border-red-500/20">
                     <AlertCircle className="w-3 h-3" />
                     <span>Harness Rule Violation: Mixed Calls</span>
                 </div>
             )}
             {msg.text.includes("must be issued one at a time") && (
                 <div className="mt-3 flex items-center gap-2 text-xs text-amber-300 bg-amber-900/30 p-2 rounded border border-amber-500/20">
                     <AlertCircle className="w-3 h-3" />
                     <span>Harness Rule: Serialized Write</span>
                 </div>
             )}
             {msg.text.includes("Function executed") && (
                 <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300 bg-emerald-900/30 p-2 rounded border border-emerald-500/20">
                     <Calculator className="w-3 h-3" /> 
                     <span>Calculation applied</span>
                 </div>
             )}
             {msg.text.includes("Applied") && msg.text.includes("rules") && (
                 <div className="mt-2 flex items-center gap-2 text-xs text-indigo-300 bg-indigo-900/30 p-2 rounded border border-indigo-500/20">
                     <PaintBucket className="w-3 h-3" /> 
                     <span>Formatting rules applied</span>
                 </div>
             )}
             {msg.text.includes("Filter applied") && (
                 <div className="mt-2 flex items-center gap-2 text-xs text-cyan-300 bg-cyan-900/30 p-2 rounded border border-cyan-500/20">
                     <Filter className="w-3 h-3" /> 
                     <span>Filter Active</span>
                 </div>
             )}
             {msg.text.includes("Added") && msg.text.includes("comments") && (
                 <div className="mt-2 flex items-center gap-2 text-xs text-orange-300 bg-orange-900/30 p-2 rounded border border-orange-500/20">
                     <MessageSquare className="w-3 h-3" /> 
                     <span>Comments added</span>
                 </div>
             )}
             {(msg.isThinking || msg.toolCalls) && (
                <details className="mt-2 group/thinking">
                    <summary className="flex items-center gap-2 text-[10px] text-slate-500 cursor-pointer hover:text-slate-400 transition-colors uppercase tracking-widest list-none">
                        <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center">
                            <Sparkles className="w-2.5 h-2.5" />
                        </div>
                        {msg.isThinking ? (msg.text.includes("Chain of Thought") ? "View Reasoning" : "View Action Plan") : "View Agent Audit Log"}
                        <ChevronRight className="w-3 h-3 group-open/thinking:rotate-90 transition-transform" />
                    </summary>
                    <div className="mt-2 text-[11px] text-slate-400 bg-slate-800/30 p-3 rounded-lg border border-slate-700/30 animate-in slide-in-from-top-1">
                        {msg.isThinking ? (
                            msg.text.replace(/💡 \*\*Chain of Thought:\*\* |📋 \*\*Task Plan:\*\*\n/, '')
                        ) : (
                            <div className="space-y-3">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1 font-bold">Tool Sequence</div>
                                    <div className="space-y-1">
                                        {msg.toolCalls?.map((call, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded border border-white/5">
                                                <Code className="w-3 h-3 text-nexus-accent" />
                                                <span className="font-mono text-[10px] text-nexus-accent">{call.tool}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {msg.turnResult && (
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-tighter mb-1 font-bold">Execution Feedback</div>
                                        <pre className="p-2 bg-black/30 rounded text-[9px] font-mono whitespace-pre-wrap border border-white/5 overflow-x-auto max-h-32">
                                            {msg.turnResult}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </details>
             )}

             {!msg.isThinking && (
                <>
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    {msg.text.includes("Function executed") && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300 bg-emerald-900/30 p-2 rounded border border-emerald-500/20">
                            <Calculator className="w-3 h-3" />
                            <span>Calculation applied</span>
                        </div>
                    )}
                    {msg.text.includes("Applied") && msg.text.includes("rules") && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-indigo-300 bg-indigo-900/30 p-2 rounded border border-indigo-500/20">
                            <PaintBucket className="w-3 h-3" />
                            <span>Formatting rules applied</span>
                        </div>
                    )}
                    {msg.text.includes("Filter applied") && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-cyan-300 bg-cyan-900/30 p-2 rounded border border-cyan-500/20">
                            <Filter className="w-3 h-3" />
                            <span>Filter Active</span>
                        </div>
                    )}
                    {msg.text.includes("Added") && msg.text.includes("comments") && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-orange-300 bg-orange-900/30 p-2 rounded border border-orange-500/20">
                            <MessageSquare className="w-3 h-3" />
                            <span>Comments added</span>
                        </div>
                    )}
                </>
             )}
            </div>
            
            {msg.chartConfig && sheetData && (
                <div className="mt-3 w-full max-w-[90%] animate-in fade-in slide-in-from-bottom-2">
                    <div className="relative group/chart border border-slate-700/50 rounded-xl overflow-hidden bg-slate-900/50">
                        <Visualization config={msg.chartConfig} data={sheetData} />
                        <button 
                            onClick={() => msg.chartConfig && onAddToDashboard(msg.chartConfig)}
                            className="absolute top-3 right-3 bg-slate-800 text-white p-1.5 rounded-md opacity-0 group-hover/chart:opacity-100 transition-all border border-slate-600 shadow-lg flex items-center gap-1 text-xs hover:bg-slate-700"
                        >
                            <Plus className="w-3 h-3" /> Pin Chart
                        </button>
                    </div>
                </div>
            )}
            
            <span className="text-[10px] text-slate-500 mt-1 px-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {isLoading && (
             <div className="p-2 space-y-2">
                 <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Sparkles className="w-3 h-3 animate-spin text-nexus-accent" />
                    <span className="font-medium">{thinkingStep || 'Thinking through your request...'}</span>
                 </div>
                 <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(step => (
                        <div
                            key={step}
                            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                                step < currentTurn ? 'bg-emerald-500' :
                                step === currentTurn ? 'bg-nexus-accent animate-pulse' :
                                'bg-slate-800'
                            }`}
                        />
                    ))}
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="agent-input-area p-4 bg-slate-900 border-t border-white/5">
        <form onSubmit={handleSubmit} className="relative">
          <div className={`agent-input-box flex items-center gap-2 bg-slate-800/50 border border-white/10 p-2 rounded-xl focus-within:border-cyan-500/50 transition-all ${isLoading ? 'opacity-50 grayscale' : ''}`}>
             <button
                type="button"
                onClick={handleVoiceInput}
                disabled={isLoading || !sheetData}
                className={`p-2 rounded-lg transition-all ${isListening ? 'text-red-400 bg-red-400/10 animate-pulse shadow-[0_0_12px_rgba(248,113,113,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                {isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={sheetData ? "Ask: 'Analyze this data...'" : "Upload data to start..."}
                disabled={isLoading}
                className="flex-1 bg-transparent border-none outline-none text-white text-sm py-1"
                autoFocus={!!promptOverride}
            />
            <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-all shadow-[0_4px_12px_rgba(6,182,212,0.3)] hover:shadow-[0_4px_20px_rgba(6,182,212,0.5)] disabled:opacity-30 disabled:shadow-none transform active:scale-95"
            >
                <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between mt-3 px-1">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">System Secure</p>
              </div>
              <p className="text-[10px] text-slate-600 font-mono font-bold tracking-tighter">AGENT v2.4.0_STABLE</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Agent;