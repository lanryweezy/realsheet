import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, StopCircle, Mic, Plus, Check, Zap, Calculator, PaintBucket, Filter, MessageSquare } from 'lucide-react';
import { ChatMessage, SheetData, ChartConfig } from '../types';
import { analyzeDataWithGemini } from '../services/geminiService';
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
      text: 'Hello, I am NexSheet Agent. I can analyze your data, create visualizations, apply formatting, filter rows, and flag outliers.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
        const history = messages
            .filter(m => m.id !== 'welcome' && m.id !== 'system-start')
            .map(m => ({ role: m.role, parts: [{ text: m.text }] }));
            
        const result = await analyzeDataWithGemini(userMsg.text, sheetData, history);

        let actionMessage = "";
        let finalSheetData = { ...sheetData } as SheetData;
        let hasChanges = false;

        // 1. Handle Transformations
        if (result.transformationCode && sheetData) {
            try {
                // eslint-disable-next-line no-new-func
                const transformFn = new Function('rows', result.transformationCode);
                const currentRows = JSON.parse(JSON.stringify(sheetData.rows));
                const transformedRows = transformFn(currentRows);

                if (!Array.isArray(transformedRows)) {
                    throw new Error("Transformation code did not return an array.");
                }

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
            } catch (err) {
                console.error("Transformation Error", err);
                actionMessage += "\n\n⚠️ Failed to execute data transformation function.";
            }
        }

        // 2. Handle Formatting Rules
        if (result.formattingRules && result.formattingRules.length > 0 && sheetData) {
            try {
                // Merge new rules with existing
                const mergedRules = [...(sheetData.formattingRules || []), ...result.formattingRules];
                finalSheetData = {
                    ...finalSheetData,
                    formattingRules: mergedRules
                };
                hasChanges = true;
                actionMessage += `\n\n🎨 Applied ${result.formattingRules.length} conditional formatting rules.`;
            } catch (err) {
                console.error("Formatting Error", err);
            }
        }

        // 3. Handle Filter Code
        if (result.filterCode && sheetData) {
             finalSheetData = {
                 ...finalSheetData,
                 filter: {
                     description: `Filter: "${userMsg.text}"`,
                     code: result.filterCode
                 }
             };
             hasChanges = true;
             actionMessage += `\n\n🔍 Filter applied based on request.`;
        }

        // 4. Handle Comments
        if (result.generatedComments && result.generatedComments.length > 0 && sheetData) {
            const newComments = { ...(finalSheetData.comments || {}) };
            result.generatedComments.forEach(c => {
                newComments[`${c.rowIndex}-${c.colIndex}`] = c.text;
            });
            finalSheetData = {
                ...finalSheetData,
                comments: newComments
            };
            hasChanges = true;
            actionMessage += `\n\n💬 Added ${result.generatedComments.length} comments.`;
        }

        if (hasChanges) {
            onUpdateData(finalSheetData);
        }

        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: result.textResponse + actionMessage,
            chartConfig: result.chartConfig,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
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
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">{isLoading ? 'PROCESSING' : 'ONLINE'}</span>
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
                <span>Analyzing data...</span>
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
                placeholder={sheetData ? "Ask: 'Filter rows where Sales > 500'" : "Waiting for data..."}
                disabled={isLoading || !sheetData}
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
              <p className="text-[10px] text-slate-500 font-mono">GEMINI-2.5-FLASH // v2.1.0</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Agent;