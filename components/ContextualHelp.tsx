import React, { useState, useEffect } from 'react';
import { HelpCircle, X, Lightbulb, BookOpen, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';
import { suggestFormula as suggestFormulaAPI } from '../services/apiClient';

interface ContextualHelpProps {
  formula?: string;
  error?: string;
  cellRef?: string;
  context?: string;
  onClose: () => void;
}

interface FormulaInfo {
  name: string;
  syntax: string;
  description: string;
  examples: string[];
  relatedFormulas: string[];
  category: string;
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({
  formula,
  error,
  cellRef,
  context,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'help' | 'examples' | 'related'>('help');
  const [suggestedFormula, setSuggestedFormula] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Detect formula and get info
  const formulaInfo = detectFormulaInfo(formula || '');

  // Get formula suggestion if there's an error
  useEffect(() => {
    if (error && formula) {
      getSuggestion();
    }
  }, [error, formula]);

  const getSuggestion = async () => {
    setIsLoading(true);
    try {
      const response = await suggestFormulaAPI({
        description: `Fix this broken formula: ${formula}, Error: ${error}`
      });
      
      if (response.success && response.formula) {
        setSuggestedFormula(response.formula);
      }
    } catch (error) {
      console.error('Suggestion error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const detectFormulaInfo = (formulaText: string): FormulaInfo | null => {
    if (!formulaText) return null;

    // Extract function name
    const match = formulaText.match(/^=?\s*([A-Z]+)\s*\(/i);
    if (!match) return null;

    const funcName = match[1].toUpperCase();

    // Formula database
    const formulaDB: Record<string, FormulaInfo> = {
      // Logical
      IF: {
        name: 'IF',
        syntax: '=IF(logical_test, [value_if_true], [value_if_false])',
        description: 'Checks whether a condition is met, and returns one value if TRUE, and another value if FALSE.',
        examples: [
          '=IF(A1>10, "Yes", "No")',
          '=IF(B2>=60, "Pass", "Fail")',
          '=IF(C3=100, A3*0.1, 0)'
        ],
        relatedFormulas: ['IFS', 'AND', 'OR', 'NOT', 'SWITCH'],
        category: 'Logical'
      },
      IFS: {
        name: 'IFS',
        syntax: '=IFS(logical_test1, value1, [logical_test2, value2], ...)',
        description: 'Checks whether one or more conditions are met and returns a value corresponding to the first TRUE condition.',
        examples: [
          '=IFS(A1>90, "A", A1>80, "B", A1>70, "C")',
          '=IFS(B1<0, "Negative", B1=0, "Zero", B1>0, "Positive")'
        ],
        relatedFormulas: ['IF', 'SWITCH', 'AND', 'OR'],
        category: 'Logical'
      },
      // Lookup
      XLOOKUP: {
        name: 'XLOOKUP',
        syntax: '=XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])',
        description: 'Searches a range or array, and returns an item corresponding to the first match found.',
        examples: [
          '=XLOOKUP(A1, B:B, C:C)',
          '=XLOOKUP(D1, E1:E100, F1:F100, "Not found")',
          '=XLOOKUP("Apple", A:A, B:B, , 0)'
        ],
        relatedFormulas: ['VLOOKUP', 'HLOOKUP', 'INDEX', 'MATCH'],
        category: 'Lookup & Reference'
      },
      VLOOKUP: {
        name: 'VLOOKUP',
        syntax: '=VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])',
        description: 'Looks for a value in the leftmost column of a table, and then returns a value in the same row from a column you specify.',
        examples: [
          '=VLOOKUP(A1, B:D, 3, FALSE)',
          '=VLOOKUP("Product", A1:C100, 2, TRUE)'
        ],
        relatedFormulas: ['XLOOKUP', 'HLOOKUP', 'INDEX', 'MATCH'],
        category: 'Lookup & Reference'
      },
      INDEX: {
        name: 'INDEX',
        syntax: '=INDEX(array, row_num, [column_num])',
        description: 'Returns a value or reference of the cell at the intersection of a particular row and column.',
        examples: [
          '=INDEX(A1:C10, 2, 3)',
          '=INDEX(A:A, 5)',
          '=INDEX(A1:C100, MATCH("Apple", A:A, 0), 3)'
        ],
        relatedFormulas: ['MATCH', 'XLOOKUP', 'OFFSET'],
        category: 'Lookup & Reference'
      },
      MATCH: {
        name: 'MATCH',
        syntax: '=MATCH(lookup_value, lookup_array, [match_type])',
        description: 'Searches for a specified item in a range of cells, and returns the relative position of that item.',
        examples: [
          '=MATCH("Apple", A1:A100, 0)',
          '=MATCH(100, B:B, 1)',
          '=MATCH(D1, C1:C50, -1)'
        ],
        relatedFormulas: ['INDEX', 'XLOOKUP', 'VLOOKUP'],
        category: 'Lookup & Reference'
      },
      // Text
      CONCATENATE: {
        name: 'CONCATENATE',
        syntax: '=CONCATENATE(text1, [text2], ...)',
        description: 'Joins several text strings into one text string.',
        examples: [
          '=CONCATENATE(A1, " ", B1)',
          '=CONCATENATE("Hello ", "World")'
        ],
        relatedFormulas: ['TEXTJOIN', 'CONCAT', '&'],
        category: 'Text'
      },
      TEXTJOIN: {
        name: 'TEXTJOIN',
        syntax: '=TEXTJOIN(delimiter, ignore_empty, text1, [text2], ...)',
        description: 'Combines the text from multiple ranges and/or strings, and includes a delimiter between each text value.',
        examples: [
          '=TEXTJOIN(", ", TRUE, A1:A10)',
          '=TEXTJOIN("-", FALSE, B1, C1, D1)'
        ],
        relatedFormulas: ['CONCATENATE', 'CONCAT', 'JOIN'],
        category: 'Text'
      },
      // Date/Time
      TODAY: {
        name: 'TODAY',
        syntax: '=TODAY()',
        description: 'Returns the serial number of the current date.',
        examples: [
          '=TODAY()',
          '=TODAY()+7',
          '=YEAR(TODAY())'
        ],
        relatedFormulas: ['NOW', 'DATE', 'DAY', 'MONTH', 'YEAR'],
        category: 'Date & Time'
      },
      NOW: {
        name: 'NOW',
        syntax: '=NOW()',
        description: 'Returns the serial number of the current date and time.',
        examples: [
          '=NOW()',
          '=NOW()-TODAY()'
        ],
        relatedFormulas: ['TODAY', 'DATE', 'TIME'],
        category: 'Date & Time'
      },
      // Math
      SUM: {
        name: 'SUM',
        syntax: '=SUM(number1, [number2], ...)',
        description: 'Adds all the numbers in a range of cells.',
        examples: [
          '=SUM(A1:A10)',
          '=SUM(A1, B1, C1)',
          '=SUM(A1:A10, C1:C10)'
        ],
        relatedFormulas: ['SUMIF', 'SUMIFS', 'COUNT', 'AVERAGE'],
        category: 'Math & Trig'
      },
      SUMIF: {
        name: 'SUMIF',
        syntax: '=SUMIF(range, criteria, [sum_range])',
        description: 'Adds the cells specified by a given criteria.',
        examples: [
          '=SUMIF(A1:A10, ">5")',
          '=SUMIF(B:B, "Apples", C:C)',
          '=SUMIF(A:A, "<>0")'
        ],
        relatedFormulas: ['SUM', 'SUMIFS', 'COUNTIF'],
        category: 'Math & Trig'
      },
      // Statistical
      AVERAGE: {
        name: 'AVERAGE',
        syntax: '=AVERAGE(number1, [number2], ...)',
        description: 'Returns the average (arithmetic mean) of the arguments.',
        examples: [
          '=AVERAGE(A1:A10)',
          '=AVERAGE(B1, C1, D1)'
        ],
        relatedFormulas: ['MEDIAN', 'MODE', 'SUM', 'COUNT'],
        category: 'Statistical'
      },
      COUNT: {
        name: 'COUNT',
        syntax: '=COUNT(value1, [value2], ...)',
        description: 'Counts the number of cells that contain numbers.',
        examples: [
          '=COUNT(A1:A10)',
          '=COUNT(A1, B1, "text", 100)'
        ],
        relatedFormulas: ['COUNTA', 'COUNTIF', 'COUNTBLANK'],
        category: 'Statistical'
      },
      // Financial
      PMT: {
        name: 'PMT',
        syntax: '=PMT(rate, nper, pv, [fv], [type])',
        description: 'Calculates the payment for a loan based on constant payments and a constant interest rate.',
        examples: [
          '=PMT(0.05/12, 60, 50000)',
          '=PMT(6%/12, 360, 200000)'
        ],
        relatedFormulas: ['PV', 'FV', 'RATE', 'NPV'],
        category: 'Financial'
      }
    };

    return formulaDB[funcName] || null;
  };

  const commonErrors: Record<string, string> = {
    '#NAME?': 'The formula contains a function name or range reference that Excel/Sheets doesn\'t recognize. Check for typos.',
    '#VALUE!': 'The formula has the wrong type of argument or operand. Make sure you\'re using numbers where numbers are expected.',
    '#REF!': 'The formula refers to a cell that\'s not valid. This often happens when cells are deleted.',
    '#DIV/0!': 'The formula is trying to divide by zero. Add a check to prevent division by zero.',
    '#N/A': 'The formula can\'t find the value it\'s looking for. This is common with lookup functions.',
    '#NUM!': 'The formula has invalid numeric values, such as division by zero or square root of a negative number.',
    '#NULL!': 'The formula specifies an intersection of two areas that don\'t intersect.',
    '#SPILL!': 'The formula uses dynamic arrays but can\'t spill the results because something is in the way.',
    '#ERROR!': 'The formula contains a syntax error. Check parentheses and commas.'
  };

  return (
    <div className="fixed top-16 right-4 z-50 w-96 max-h-[calc(100vh-5rem)] overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl animate-in fade-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Formula Help</h3>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('help')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'help'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Help
        </button>
        <button
          onClick={() => setActiveTab('examples')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'examples'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Examples
        </button>
        <button
          onClick={() => setActiveTab('related')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'related'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Related
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {activeTab === 'help' && formulaInfo && (
          <>
            <div>
              <h4 className="text-sm font-bold text-white mb-2">{formulaInfo.name} Function</h4>
              <div className="bg-slate-800 rounded-lg p-3 mb-3">
                <p className="text-xs font-mono text-cyan-400">{formulaInfo.syntax}</p>
              </div>
              <p className="text-xs text-slate-300">{formulaInfo.description}</p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-400 rounded-lg p-3">
                <div className="flex items-start gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <h4 className="text-xs font-semibold text-red-400">Error Detected</h4>
                </div>
                <p className="text-xs text-slate-300 mb-2">{error}</p>
                <p className="text-xs text-slate-400">{commonErrors[error] || 'Check your formula syntax.'}</p>
                
                {isLoading ? (
                  <p className="text-xs text-cyan-400 mt-2">Generating fix suggestion...</p>
                ) : suggestedFormula ? (
                  <div className="mt-2 bg-slate-800 rounded p-2">
                    <p className="text-xs text-slate-400 mb-1">Suggested fix:</p>
                    <p className="text-xs font-mono text-green-400">{suggestedFormula}</p>
                  </div>
                ) : null}
              </div>
            )}

            {formulaInfo.category && (
              <div className="flex items-center gap-2 text-xs">
                <BookOpen className="w-3 h-3 text-slate-400" />
                <span className="text-slate-400">Category:</span>
                <span className="text-cyan-400">{formulaInfo.category}</span>
              </div>
            )}
          </>
        )}

        {activeTab === 'examples' && formulaInfo && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Examples</h4>
            {formulaInfo.examples.map((example, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs font-mono text-green-400">{example}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'related' && formulaInfo && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-white">Related Formulas</h4>
            <div className="space-y-1">
              {formulaInfo.relatedFormulas.map((related, i) => (
                <button
                  key={i}
                  onClick={() => {
                    // Could navigate to related formula help
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-300 transition-colors"
                >
                  <span>{related}</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {!formulaInfo && (
          <div className="text-center py-8 text-slate-400">
            <Lightbulb className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Enter a formula to see help</p>
          </div>
        )}

        {/* Quick Tips */}
        <div className="pt-4 border-t border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <h4 className="text-xs font-semibold text-white">Quick Tips</h4>
          </div>
          <ul className="space-y-1 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">F2</kbd> to edit a cell
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Ctrl</kbd>+<kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">`</kbd> to show formulas
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              Start typing <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">=</kbd> for formula suggestions
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ContextualHelp;
