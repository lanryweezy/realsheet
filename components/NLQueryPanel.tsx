import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, BarChart3, TrendingUp, Zap, X, MessageSquare, Lightbulb, Table2 } from 'lucide-react';
import { analyzeDataViaAPI, transformData } from '../services/apiClient';
import { SheetData, ChartConfig } from '../types';
import Visualization from './Visualization';

interface NLQueryPanelProps {
  data: SheetData | null;
  onAddToDashboard: (config: ChartConfig) => void;
  onUpdateData: (newData: SheetData) => void;
  onClose: () => void;
}

interface QueryResult {
  query: string;
  response: string;
  chartConfig?: ChartConfig;
  transformationCode?: string;
  timestamp: Date;
}

const NLQueryPanel: React.FC<NLQueryPanelProps> = ({
  data,
  onAddToDashboard,
  onUpdateData,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [results]);

  useEffect(() => {
    // Generate query suggestions based on data
    if (data && data.columns.length > 0) {
      const cols = data.columns.slice(0, 3);
      setSuggestions([
        `Show me the trend of ${cols[0] || 'data'}`,
        `What's the average of ${cols[1] || 'values'}?`,
        `Create a chart for ${cols[2] || cols[0] || 'data'}`,
        `Find outliers in ${cols[0] || 'data'}`,
        `Summarize the data`,
        `Compare ${cols[0] || 'A'} and ${cols[1] || 'B'}`
      ]);
    }
  }, [data]);

  const handleQuery = async (queryText: string) => {
    if (!queryText.trim() || !data) return;

    setIsLoading(true);
    const userQuery = queryText;
    setQuery('');

    try {
      const response = await analyzeDataViaAPI({
        prompt: userQuery,
        data: data,
        history: results.map(r => ({ role: 'user', content: r.query }))
      });

      if (response.success && response.data) {
        const newResult: QueryResult = {
          query: userQuery,
          response: response.data.textResponse,
          chartConfig: response.data.chartConfig,
          transformationCode: response.data.transformationCode,
          timestamp: new Date()
        };

        setResults(prev => [...prev, newResult]);

        // Apply transformation if provided
        if (response.data.transformationCode && response.data.chartConfig) {
          // User can choose to apply transformation
        }
      }
    } catch (error) {
      console.error('Query error:', error);
      const errorResult: QueryResult = {
        query: userQuery,
        response: 'Sorry, I encountered an error processing your query. Please try again.',
        timestamp: new Date()
      };
      setResults(prev => [...prev, errorResult]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTransformation = (result: QueryResult) => {
    if (!result.transformationCode || !data) return;

    // SECURE: Use serverless API for safe execution
    transformData({
      code: result.transformationCode,
      data: JSON.parse(JSON.stringify(data.rows)),
    }).then((response) => {
      if (response.success && response.data) {
        const transformedRows = response.data;
        if (Array.isArray(transformedRows)) {
          onUpdateData({
            ...data,
            rows: transformedRows
          });
        }
      }
    }).catch((error) => {
      console.error('Transformation error:', error);
    });
  };

  const handleAddChart = (result: QueryResult) => {
    if (result.chartConfig) {
      onAddToDashboard(result.chartConfig);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm">
      <div className="flex-1 flex flex-col bg-slate-900 border-r border-slate-700 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ask Your Data</h2>
              <p className="text-xs text-slate-400">Natural language data analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Query History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Lightbulb className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-center mb-4">Ask anything about your data</p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuery(suggestion)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 text-left transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {results.map((result, index) => (
                <div key={index} className="space-y-3">
                  {/* User Query */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 bg-slate-800 rounded-lg p-3">
                      <p className="text-sm text-white">{result.query}</p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{result.response}</p>
                      </div>

                      {/* Chart Preview */}
                      {result.chartConfig && data && (
                        <div className="bg-slate-800 rounded-lg p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-cyan-400" />
                              <span className="text-xs text-slate-400">Generated Chart</span>
                            </div>
                            <button
                              onClick={() => handleAddChart(result)}
                              className="px-2 py-1 bg-cyan-500 hover:bg-cyan-600 text-white rounded text-xs transition-colors flex items-center gap-1"
                            >
                              <Zap className="w-3 h-3" /> Add to Dashboard
                            </button>
                          </div>
                          <div className="h-64">
                            <Visualization config={result.chartConfig} data={data} />
                          </div>
                        </div>
                      )}

                      {/* Transformation Action */}
                      {result.transformationCode && (
                        <div className="bg-purple-500/10 border border-purple-400 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Table2 className="w-4 h-4 text-purple-400" />
                              <span className="text-xs text-purple-400">Data Transformation Available</span>
                            </div>
                            <button
                              onClick={() => handleApplyTransformation(result)}
                              className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs transition-colors"
                            >
                              Apply Transformation
                            </button>
                          </div>
                          <p className="text-xs text-slate-400">
                            This will modify your data based on the analysis
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-sm text-slate-400">Analyzing your data...</p>
              </div>
            </div>
          )}
        </div>

        {/* Query Input */}
        <div className="p-4 border-t border-slate-700">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuery(query);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about your data... (e.g., 'Show me sales trends')"
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              disabled={isLoading || !data}
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim() || !data}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-2">
            Examples: "What's the average?", "Create a bar chart", "Find outliers", "Summarize the data"
          </p>
        </div>
      </div>

      {/* Right Panel - Data Context */}
      <div className="w-80 bg-slate-900/50 p-4 border-l border-slate-700 overflow-y-auto">
        <h3 className="text-sm font-semibold text-white mb-4">Data Context</h3>
        
        {data ? (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Dataset</span>
                <span className="text-xs text-cyan-400 font-medium">{data.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Rows</span>
                <span className="text-xs text-white">{data.rows.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Columns</span>
                <span className="text-xs text-white">{data.columns.length}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-slate-400 mb-2">Columns</h4>
              <div className="flex flex-wrap gap-1">
                {data.columns.map((col, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-300"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700">
              <h4 className="text-xs font-medium text-slate-400 mb-2">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleQuery('Summarize this dataset')}
                  className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 text-left transition-colors"
                >
                  📊 Summarize Data
                </button>
                <button
                  onClick={() => handleQuery('Find insights and trends')}
                  className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 text-left transition-colors"
                >
                  💡 Find Insights
                </button>
                <button
                  onClick={() => handleQuery('Create visualizations')}
                  className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs text-slate-300 text-left transition-colors"
                >
                  📈 Create Charts
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Table2 className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No data loaded</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NLQueryPanel;
