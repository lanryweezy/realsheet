import React, { useState } from 'react';
import { X, Check, ListFilter, Hash, Calendar, Clock, Type, FunctionSquare } from 'lucide-react';
import {
  ValidationType,
  ValidationOperator,
  DataValidationRule,
  createValidationRule,
  getValidationPresets,
  getOperatorOptions,
  parseListValues,
} from '../services/dataValidationService';

interface DataValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (rule: DataValidationRule) => void;
  selectedRange?: string;
  existingRule?: DataValidationRule | null;
}

const DataValidationModal: React.FC<DataValidationModalProps> = ({
  isOpen,
  onClose,
  onApply,
  selectedRange = 'A1',
  existingRule,
}) => {
  const [validationType, setValidationType] = useState<ValidationType>(
    existingRule?.type || 'any'
  );
  const [operator, setOperator] = useState<ValidationOperator>(
    existingRule?.operator || 'between'
  );
  const [value1, setValue1] = useState(existingRule?.value1?.toString() || '');
  const [value2, setValue2] = useState(existingRule?.value2?.toString() || '');
  const [listSource, setListSource] = useState(
    existingRule?.listValues?.join(', ') || ''
  );
  const [customFormula, setCustomFormula] = useState(existingRule?.formula || '');
  const [allowBlank, setAllowBlank] = useState(existingRule?.allowBlank ?? true);
  const [showInputMessage, setShowInputMessage] = useState(
    existingRule?.showInputMessage ?? false
  );
  const [inputTitle, setInputTitle] = useState(existingRule?.inputTitle || '');
  const [inputMessage, setInputMessage] = useState(existingRule?.inputMessage || '');
  const [showError, setShowError] = useState(existingRule?.showError ?? true);
  const [errorStyle, setErrorStyle] = useState<'stop' | 'warning' | 'information'>(
    existingRule?.errorStyle || 'stop'
  );
  const [errorTitle, setErrorTitle] = useState(existingRule?.errorTitle || '');
  const [errorMessage, setErrorMessage] = useState(existingRule?.errorMessage || '');

  const presets = getValidationPresets();
  const operators = getOperatorOptions(validationType);

  const handleApply = () => {
    const rule: DataValidationRule = {
      id: existingRule?.id || `validation_${Date.now()}`,
      type: validationType,
      operator,
      value1: value1 || undefined,
      value2: value2 || undefined,
      listValues:
        validationType === 'list' ? parseListValues(listSource) : undefined,
      formula: validationType === 'custom' ? customFormula : undefined,
      allowBlank,
      showInputMessage,
      inputTitle: showInputMessage ? inputTitle : undefined,
      inputMessage: showInputMessage ? inputMessage : undefined,
      showError,
      errorStyle,
      errorTitle: showError ? errorTitle : undefined,
      errorMessage: showError ? errorMessage : undefined,
      range: selectedRange,
    };

    onApply(rule);
    onClose();
  };

  const handleClear = () => {
    setValidationType('any');
    setOperator('between');
    setValue1('');
    setValue2('');
    setListSource('');
    setCustomFormula('');
    setAllowBlank(true);
    setShowInputMessage(false);
    setInputTitle('');
    setInputMessage('');
    setShowError(true);
    setErrorStyle('stop');
    setErrorTitle('');
    setErrorMessage('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Data Validation</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Left Column - Validation Type */}
          <div className="col-span-1 space-y-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Validation Criteria
            </label>
            <div className="space-y-2">
              <button
                onClick={() => setValidationType('any')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                  validationType === 'any'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Any Value</p>
                  <p className="text-xs opacity-70">No validation</p>
                </div>
                {validationType === 'any' && <Check className="w-4 h-4 ml-auto" />}
              </button>

              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setValidationType(preset.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    validationType === preset.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-sm">
                    {getPresetIcon(preset.id)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{preset.name}</p>
                    <p className="text-xs opacity-70">{preset.description}</p>
                  </div>
                  {validationType === preset.id && (
                    <Check className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-400 mb-2">Applied to range:</p>
              <p className="text-sm font-mono text-cyan-400">{selectedRange}</p>
            </div>
          </div>

          {/* Middle & Right Columns - Settings */}
          <div className="col-span-2 space-y-4">
            {validationType !== 'any' && validationType !== 'list' && validationType !== 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Comparison
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value as ValidationOperator)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
                  >
                    {operators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Minimum Value
                    </label>
                    <input
                      type={
                        validationType === 'wholeNumber' || validationType === 'decimal'
                          ? 'number'
                          : 'text'
                      }
                      value={value1}
                      onChange={(e) => setValue1(e.target.value)}
                      placeholder="Enter minimum value"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
                    />
                  </div>
                  {operator === 'between' || operator === 'notBetween' ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Maximum Value
                      </label>
                      <input
                        type={
                          validationType === 'wholeNumber' || validationType === 'decimal'
                            ? 'number'
                            : 'text'
                        }
                        value={value2}
                        onChange={(e) => setValue2(e.target.value)}
                        placeholder="Enter maximum value"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
                      />
                    </div>
                  ) : null}
                </div>
              </>
            )}

            {validationType === 'list' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Source
                </label>
                <textarea
                  value={listSource}
                  onChange={(e) => setListSource(e.target.value)}
                  placeholder="Enter values separated by commas (e.g., Yes, No, Maybe)"
                  rows={4}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Values will appear in a dropdown list
                </p>
              </div>
            )}

            {validationType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Formula
                </label>
                <input
                  type="text"
                  value={customFormula}
                  onChange={(e) => setCustomFormula(e.target.value)}
                  placeholder="e.g., <cell> > 100"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Use {'<cell>'} as placeholder for the cell value. Must return TRUE/FALSE.
                </p>
              </div>
            )}

            {/* Input Message Tab */}
            <div className="pt-4 border-t border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={showInputMessage}
                  onChange={(e) => setShowInputMessage(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-600 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-sm text-slate-300 font-medium">
                  Show input message when cell is selected
                </span>
              </label>

              {showInputMessage && (
                <div className="space-y-3 pl-6">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Title</label>
                    <input
                      type="text"
                      value={inputTitle}
                      onChange={(e) => setInputTitle(e.target.value)}
                      placeholder="Enter title"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-cyan-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Message</label>
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Enter helpful message for users"
                      rows={2}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-cyan-400 outline-none resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Alert Tab */}
            <div className="pt-4 border-t border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={showError}
                  onChange={(e) => setShowError(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-600 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-sm text-slate-300 font-medium">
                  Show error alert after invalid data is entered
                </span>
              </label>

              {showError && (
                <div className="space-y-3 pl-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs text-slate-400 mb-1">Style</label>
                      <select
                        value={errorStyle}
                        onChange={(e) =>
                          setErrorStyle(e.target.value as 'stop' | 'warning' | 'information')
                        }
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-cyan-400 outline-none"
                      >
                        <option value="stop">🛑 Stop</option>
                        <option value="warning">⚠️ Warning</option>
                        <option value="information">ℹ️ Information</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">Title</label>
                      <input
                        type="text"
                        value={errorTitle}
                        onChange={(e) => setErrorTitle(e.target.value)}
                        placeholder="Enter error title"
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-cyan-400 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Error Message</label>
                    <textarea
                      value={errorMessage}
                      onChange={(e) => setErrorMessage(e.target.value)}
                      placeholder="Enter error message"
                      rows={2}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white text-sm focus:ring-2 focus:ring-cyan-400 outline-none resize-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Allow Blank */}
            {validationType !== 'any' && (
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={allowBlank}
                  onChange={(e) => setAllowBlank(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-600 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-sm text-slate-300">Allow blank values</span>
              </label>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={handleClear}
            className="px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
          >
            Clear All
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get icon for preset type
const getPresetIcon = (type: ValidationType) => {
  const icons: Record<ValidationType, React.ReactNode> = {
    any: <Check className="w-4 h-4" />,
    wholeNumber: <Hash className="w-4 h-4" />,
    decimal: <Hash className="w-4 h-4" />,
    list: <ListFilter className="w-4 h-4" />,
    date: <Calendar className="w-4 h-4" />,
    time: <Clock className="w-4 h-4" />,
    textLength: <Type className="w-4 h-4" />,
    custom: <FunctionSquare className="w-4 h-4" />,
  };
  return icons[type] || <Check className="w-4 h-4" />;
};

export default DataValidationModal;
