import React, { useState } from 'react';
import { X, Check, DollarSign, Percent, Calendar, Clock, Hash, FlaskConical, Divide } from 'lucide-react';
import { FormatType, NumberFormatOptions, getFormatPresets, formatNumber } from '../services/formattingService';

interface FormatNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (options: NumberFormatOptions) => void;
  sampleValue?: number;
}

const FormatNumberModal: React.FC<FormatNumberModalProps> = ({ isOpen, onClose, onApply, sampleValue = 1234.567 }) => {
  const [selectedType, setSelectedType] = useState<FormatType>('number');
  const [decimals, setDecimals] = useState(2);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [showThousandsSeparator, setShowThousandsSeparator] = useState(true);
  const [showNegativeInParentheses, setShowNegativeInParentheses] = useState(false);
  const [customFormat, setCustomFormat] = useState('');

  const presets = getFormatPresets();

  const handleApply = () => {
    const options: NumberFormatOptions = {
      type: selectedType,
      decimals,
      currencySymbol,
      currencyCode,
      showThousandsSeparator,
      showNegativeInParentheses,
      customFormat: selectedType === 'custom' ? customFormat : undefined,
    };
    onApply(options);
    onClose();
  };

  const preview = formatNumber(sampleValue, {
    type: selectedType,
    decimals,
    currencySymbol,
    currencyCode,
    showThousandsSeparator,
    showNegativeInParentheses,
    customFormat,
  });

  const negativePreview = formatNumber(-sampleValue, {
    type: selectedType,
    decimals,
    currencySymbol,
    currencyCode,
    showThousandsSeparator,
    showNegativeInParentheses,
    customFormat,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200 m-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Format Numbers</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Left Column - Format Types */}
          <div className="col-span-1 space-y-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Format Type</label>
            <div className="space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedType(preset.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    selectedType === preset.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {getFormatIcon(preset.id)}
                  <div className="text-left">
                    <p className="text-sm font-medium">{preset.name}</p>
                    <p className="text-xs opacity-70">{preset.example}</p>
                  </div>
                  {selectedType === preset.id && (
                    <Check className="w-4 h-4 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - Options and Preview */}
          <div className="col-span-2 space-y-4">
            {/* Preview */}
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Preview</p>
              <p className="text-2xl font-mono text-white">{preview}</p>
              <p className="text-sm text-slate-400 mt-2">
                Negative: <span className="font-mono">{negativePreview}</span>
              </p>
            </div>

            {/* Options based on type */}
            {(selectedType === 'number' || selectedType === 'currency' || selectedType === 'accounting') && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Decimal Places</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={decimals}
                  onChange={(e) => setDecimals(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>
            )}

            {(selectedType === 'currency' || selectedType === 'accounting') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Currency Symbol</label>
                  <select
                    value={currencySymbol}
                    onChange={(e) => setCurrencySymbol(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
                  >
                    <option value="$">$ - US Dollar</option>
                    <option value="€">€ - Euro</option>
                    <option value="£">£ - British Pound</option>
                    <option value="¥">¥ - Japanese Yen</option>
                    <option value="₹">₹ - Indian Rupee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Currency Code</label>
                  <select
                    value={currencyCode}
                    onChange={(e) => setCurrencyCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="JPY">JPY - Japanese Yen</option>
                    <option value="INR">INR - Indian Rupee</option>
                  </select>
                </div>
              </>
            )}

            {selectedType === 'percentage' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Decimal Places</label>
                <input
                  type="number"
                  min="0"
                  max="4"
                  value={decimals}
                  onChange={(e) => setDecimals(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>
            )}

            {selectedType === 'scientific' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Significant Digits</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={decimals}
                  onChange={(e) => setDecimals(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
                />
              </div>
            )}

            {selectedType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Custom Format String</label>
                <input
                  type="text"
                  value={customFormat}
                  onChange={(e) => setCustomFormat(e.target.value)}
                  placeholder="#,##0.00"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-cyan-400 outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Examples: #,##0.00 | $#,##0.00 | 0.00%
                </p>
              </div>
            )}

            {/* Common Options */}
            <div className="space-y-2 pt-4 border-t border-slate-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showThousandsSeparator}
                  onChange={(e) => setShowThousandsSeparator(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-600 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-sm text-slate-300">Show thousands separator</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNegativeInParentheses}
                  onChange={(e) => setShowNegativeInParentheses(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-600 text-cyan-400 focus:ring-cyan-400"
                />
                <span className="text-sm text-slate-300">Show negatives in parentheses</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors font-medium"
          >
            Apply Format
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get icon for format type
const getFormatIcon = (type: FormatType) => {
  const icons: Record<FormatType, React.ReactNode> = {
    general: <Hash className="w-5 h-5" />,
    number: <Hash className="w-5 h-5" />,
    currency: <DollarSign className="w-5 h-5" />,
    accounting: <DollarSign className="w-5 h-5" />,
    percentage: <Percent className="w-5 h-5" />,
    scientific: <FlaskConical className="w-5 h-5" />,
    fraction: <Divide className="w-5 h-5" />,
    date: <Calendar className="w-5 h-5" />,
    time: <Clock className="w-5 h-5" />,
    datetime: <Calendar className="w-5 h-5" />,
    custom: <Hash className="w-5 h-5" />,
  };
  return icons[type];
};

export default FormatNumberModal;
