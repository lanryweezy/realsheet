import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, StopCircle, Mic, Plus, Check, Zap, Calculator, PaintBucket, Filter, MessageSquare, Lightbulb, ListTodo } from 'lucide-react';
import { ChatMessage, SheetData, ChartConfig, EnhancedAnalysisResult } from '../types';
import { analyzeDataWithGemini } from '../services/geminiService';
import { transformData } from '../services/apiClient';
import { safeEvaluate } from '../utils/safeFormulaParser';
import { parseRange, excelColToIndex } from '../services/formulaService';
import { evaluateWithHF, syncWorkbook } from '../services/hyperformulaService';
import Visualization from './Visualization';

interface AgentProps {
  sheetData: SheetData | null;
  onAddToDashboard: (config: ChartConfig) => void;
  onUpdateData: (newData: SheetData) => void;
  promptOverride: string | null;
  onClearPromptOverride: () => void;
}

const Agent: React.FC<AgentProps> = ({ sheetData, onAddToDashboard, onUpdateData, promptOverride, onClearPromptOverride }) => {
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
                            if (rangeRef[0] && rangeRef[1]) {
                                const inspected: any[][] = [];
                                for (let r = rangeRef[0].rowIndex; r <= rangeRef[1].rowIndex; r++) {
                                    const rowValues: any[] = [];
                                    for (let c = rangeRef[0].colIndex; c <= rangeRef[1].colIndex; c++) {
                                        if (r < finalSheetData.rows.length) {
                                            const colKey = finalSheetData.columns[c];
                                            rowValues.push(finalSheetData.rows[r][colKey]);
                                        }
                                    }
                                    inspected.push(rowValues);
                                }
                                toolResults.push(`Inspect results for ${range}: ${JSON.stringify(inspected)}`);
                                actionMessage += `\n\n🔍 Inspected range ${range}.`;
                            }
                            break;
                        }
                        case 'find_cells': {
                            const { query } = parameters;
                            setThinkingStep(`Searching for "${query}"...`);
                            const matches: string[] = [];
                            finalSheetData.rows.forEach((row, rIdx) => {
                                finalSheetData.columns.forEach((col, cIdx) => {
                                    if (String(row[col]).toLowerCase().includes(String(query).toLowerCase())) {
                                        matches.push(`${col}${rIdx + 1}`);
                                    }
                                });
                            });
                            const resultStr = matches.length > 0 ? `Found matches in: ${matches.slice(0, 10).join(', ')}${matches.length > 10 ? '...' : ''}` : "No matches found.";
                            toolResults.push(`Search results for "${query}": ${resultStr}`);
                            actionMessage += `\n\n🔎 Searched for "${query}".`;
                            break;
                        }
                        case 'recalculate_and_read': {
                            const { range } = parameters;
                            setThinkingStep(`Recalculating and reading ${range}...`);
                            syncWorkbook(finalSheetData);
                            const rangeRef = parseRange(range);
                            if (rangeRef[0] && rangeRef[1]) {
                                const calculated: any[][] = [];
                                for (let r = rangeRef[0].rowIndex; r <= rangeRef[1].rowIndex; r++) {
                                    const rowValues: any[] = [];
                                    for (let c = rangeRef[0].colIndex; c <= rangeRef[1].colIndex; c++) {
                                        if (r < finalSheetData.rows.length) {
                                            const colKey = finalSheetData.columns[c];
                                            rowValues.push(evaluateWithHF(finalSheetData.rows[r][colKey], r, colKey, finalSheetData));
                                        }
                                    }
                                    calculated.push(rowValues);
                                }
                                toolResults.push(`Recalculated values for ${range}: ${JSON.stringify(calculated)}`);
                                actionMessage += `\n\n🔄 Recalculated and verified range ${range}.`;
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
                timestamp: new Date()
            };

            // Only show the result to the user if it's the final turn or has a meaningful textResponse
            if (turnCount === MAX_TURNS || (!result.toolCalls?.length && result.textResponse)) {
                setMessages(prev => [...prev, aiMsg]);
            }
            currentMessages.push(aiMsg);

            // If we have tool results, we need to feed them back to the model in the next turn
            if (toolResults.length > 0 && turnCount < MAX_TURNS) {
                const verificationResult = verifyOutcome();
                const systemFeedback: ChatMessage = {
                    id: `sys-${Date.now()}-${turnCount}`,
                    role: 'user',
                    text: `Tool execution results:\n${toolResults.join('\n')}\n\nVerification: ${verificationResult}\n\nBased on these results, what is your next step? If you are finished, please provide a final summary.`,
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
    }
  };

  return (
    <div className="agent-container">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
                <h2 className="font-semibold text-white text-sm">NexAgent</h2>
                <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{isLoading ? 'THINKING' : 'THINKING'}</span>
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
             {msg.text.includes("Chain of Thought") && (
                 <div className="mt-2 flex items-center gap-2 text-xs text-amber-300 bg-amber-900/30 p-2 rounded border border-amber-500/20">
                     <Lightbulb className="w-3 h-3" /> 
                     <span>Reasoning Process</span>
                 </div>
             )}
             {msg.text.includes("Task Plan") && (
                 <div className="mt-2 flex items-center gap-2 text-xs text-blue-300 bg-blue-900/30 p-2 rounded border border-blue-500/20">
                     <ListTodo className="w-3 h-3" /> 
                     <span>Action Plan</span>
                 </div>
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
            <div className="flex items-center gap-2 text-slate-500 text-xs p-2">
                <Sparkles className="w-3 h-3 animate-spin text-nexus-accent" />
                 <span>{thinkingStep || 'Thinking through your request...'}</span>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="agent-input-area">
        <form onSubmit={handleSubmit} className="relative">
          <div className="agent-input-box">
             <button
                type="button"
                onClick={handleVoiceInput}
                disabled={isLoading || !sheetData}
                className={`p-2 rounded-md transition-colors ${isListening ? 'text-red-400 bg-red-400/10' : 'text-slate-400 hover:text-white'}`}
            >
                {isListening ? <StopCircle className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={sheetData ? "Ask: 'How should I plan to clean this data?'" : "Waiting for data..."}
                disabled={isLoading || !input.trim()}
                autoFocus={!!promptOverride} // Auto focus if override exists
            />
            <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-2 bg-nexus-accent hover:bg-cyan-600 text-white rounded-md transition-colors disabled:opacity-50"
            >
                <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-between mt-2 px-1">
              <p className="text-[10px] text-slate-500 font-mono">OFFLINE MODE // v2.2.0</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Agent;