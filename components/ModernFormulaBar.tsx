import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, Check, X, AlertCircle, Lightbulb, 
  Wand2, Code, ChevronDown, History 
} from 'lucide-react';
import { FormulaValidator } from '../services/formulaValidator';
import { SheetData } from '../types';

interface ModernFormulaBarProps {
  value: string;
  cellRef: string;
  sheetData?: SheetData;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

const ModernFormulaBar: React.FC<ModernFormulaBarProps> = ({
  value,
  cellRef,
  sheetData,
  onChange,
  onSubmit,
  onCancel,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentFormulas, setRecentFormulas] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Validate formula on change
  useEffect(() => {
    if (value.startsWith('=') && sheetData) {
      const result = FormulaValidator.validate(value, sheetData);
      setValidation(result);
    } else {
      setValidation(null);
    }
  }, [value, sheetData]);

  // Load recent formulas
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recent_formulas') || '[]');
    setRecentFormulas(recent.slice(0, 5));
  }, []);

  const handleSubmit = () => {
    if (value.startsWith('=')) {
      // Save to recent formulas
      const recent = [value, ...recentFormulas.filter(f => f !== value)].slice(0, 5);
      localStorage.setItem('recent_formulas', JSON.stringify(recent));
      setRecentFormulas(recent);
    }
    onSubmit(value);
  };

  const handleAutoFix = () => {
    const { fixed } = FormulaValidator.autoFix(value);
    onChange(fixed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const getStatusColor = () => {
    if (!validation) return 'border-gray-300';
    if (!validation.valid) return 'border-red-500';
    if (validation.warnings.length > 0) return 'border-yellow-500';
    return 'border-green-500';
  };

  const getStatusIcon = () => {
    if (!validation) return null;
    if (!validation.valid) return <AlertCircle className="w-4 h-4 text-red-500" />;
    if (validation.warnings.length > 0) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <Check className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="modern-formula-bar">
      {/* Cell Reference */}
      <div className="cell-ref-box">
        <span className="cell-ref">{cellRef || 'A1'}</span>
      </div>

      {/* Formula Input */}
      <div className={`formula-input-container ${getStatusColor()}`}>
        <div className="formula-input-wrapper">
          {value.startsWith('=') && (
            <Sparkles className="w-4 h-4 text-purple-500 absolute left-3 top-3" />
          )}
          
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter value or formula (start with =)"
            className={`formula-input ${value.startsWith('=') ? 'pl-10' : 'pl-3'}`}
            rows={isExpanded ? 4 : 1}
            style={{ resize: 'none' }}
          />

          {/* Status Icon */}
          <div className="absolute right-3 top-3">
            {getStatusIcon()}
          </div>
        </div>

        {/* Validation Messages */}
        {validation && (
          <div className="validation-messages">
            {/* Errors */}
            {validation.errors.length > 0 && (
              <div className="error-messages">
                {validation.errors.map((error: string, i: number) => (
                  <div key={i} className="error-message">
                    <AlertCircle className="w-3 h-3" />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <div className="warning-messages">
                {validation.warnings.map((warning: string, i: number) => (
                  <div key={i} className="warning-message">
                    <AlertCircle className="w-3 h-3" />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {validation.suggestions.length > 0 && (
              <div className="suggestion-messages">
                {validation.suggestions.map((suggestion: string, i: number) => (
                  <div key={i} className="suggestion-message">
                    <Lightbulb className="w-3 h-3" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="formula-actions">
        {/* Auto-fix Button */}
        {validation && !validation.valid && (
          <button
            onClick={handleAutoFix}
            className="action-btn auto-fix-btn"
            title="Auto-fix formula"
          >
            <Wand2 className="w-4 h-4" />
            <span className="btn-text">Fix</span>
          </button>
        )}

        {/* Expand Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="action-btn"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          <Code className="w-4 h-4" />
        </button>

        {/* Recent Formulas */}
        {recentFormulas.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="action-btn"
              title="Recent formulas"
            >
              <History className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
            </button>

            {showSuggestions && (
              <div className="recent-formulas-dropdown">
                <div className="dropdown-header">Recent Formulas</div>
                {recentFormulas.map((formula, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      onChange(formula);
                      setShowSuggestions(false);
                    }}
                    className="recent-formula-item"
                  >
                    <code>{formula}</code>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="action-btn submit-btn"
          title="Apply (Enter)"
        >
          <Check className="w-4 h-4" />
          <span className="btn-text">Apply</span>
        </button>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="action-btn cancel-btn"
          title="Cancel (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <style jsx>{`
        .modern-formula-bar {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.75rem;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        .cell-ref-box {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 80px;
          height: 40px;
          padding: 0 1rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          font-weight: 600;
          color: #374151;
        }

        .formula-input-container {
          flex: 1;
          position: relative;
          border: 2px solid;
          border-radius: 0.5rem;
          background: white;
          transition: all 0.2s;
        }

        .formula-input-container:focus-within {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .formula-input-wrapper {
          position: relative;
        }

        .formula-input {
          width: 100%;
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          border: none;
          outline: none;
          font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          background: transparent;
        }

        .formula-input::placeholder {
          color: #9ca3af;
        }

        .validation-messages {
          padding: 0.5rem 1rem;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
          font-size: 0.75rem;
        }

        .error-messages,
        .warning-messages,
        .suggestion-messages {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.5rem;
        }

        .error-messages:last-child,
        .warning-messages:last-child,
        .suggestion-messages:last-child {
          margin-bottom: 0;
        }

        .error-message,
        .warning-message,
        .suggestion-message {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .error-message {
          color: #dc2626;
        }

        .warning-message {
          color: #d97706;
        }

        .suggestion-message {
          color: #2563eb;
        }

        .formula-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          background: white;
          color: #374151;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .auto-fix-btn {
          background: #fef3c7;
          border-color: #fbbf24;
          color: #92400e;
        }

        .auto-fix-btn:hover {
          background: #fde68a;
        }

        .submit-btn {
          background: #dbeafe;
          border-color: #3b82f6;
          color: #1e40af;
        }

        .submit-btn:hover {
          background: #bfdbfe;
        }

        .cancel-btn:hover {
          background: #fee2e2;
          border-color: #ef4444;
          color: #dc2626;
        }

        .btn-text {
          display: none;
        }

        @media (min-width: 768px) {
          .btn-text {
            display: inline;
          }
        }

        .recent-formulas-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 0.5rem;
          min-width: 300px;
          max-width: 500px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 50;
        }

        .dropdown-header {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 600;
          font-size: 0.875rem;
          color: #374151;
        }

        .recent-formula-item {
          display: block;
          width: 100%;
          padding: 0.75rem 1rem;
          text-align: left;
          border: none;
          background: none;
          cursor: pointer;
          transition: background 0.2s;
        }

        .recent-formula-item:hover {
          background: #f9fafb;
        }

        .recent-formula-item code {
          font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
          font-size: 0.75rem;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
};

export default ModernFormulaBar;
