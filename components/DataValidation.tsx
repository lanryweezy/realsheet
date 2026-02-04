import React, { useState, useEffect } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import { DataValidation, ValidationType } from '../types';

interface DataValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (validation: DataValidation) => void;
  initialValidation?: DataValidation;
  columns: string[];
}

export const DataValidationModal: React.FC<DataValidationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialValidation,
  columns
}) => {
  const [type, setType] = useState<ValidationType>(initialValidation?.type || 'list');
  const [range, setRange] = useState(initialValidation?.range || '');
  const [listValues, setListValues] = useState(initialValidation?.criteria.listValues?.join(',') || '');
  const [operator, setOperator] = useState(initialValidation?.criteria.operator || '');
  const [value1, setValue1] = useState(initialValidation?.criteria.value1 || '');
  const [value2, setValue2] = useState(initialValidation?.criteria.value2 || '');
  const [errorMessage, setErrorMessage] = useState(initialValidation?.errorMessage || '');
  const [showErrorMessage, setShowErrorMessage] = useState(initialValidation?.showErrorMessage ?? true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation: DataValidation = {
      id: initialValidation?.id || Date.now().toString(),
      range,
      type,
      criteria: {
        operator,
        value1,
        value2,
        listValues: type === 'list' ? listValues.split(',').map(v => v.trim()) : undefined,
      },
      errorMessage,
      showErrorMessage
    };
    
    onSave(validation);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Data Validation</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Range</label>
            <input
              type="text"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              placeholder="e.g., A1:B10"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-300 mb-1">Validation Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ValidationType)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
            >
              <option value="list">List (Dropdown)</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="textLength">Text Length</option>
              <option value="custom">Custom Formula</option>
            </select>
          </div>
          
          {type === 'list' && (
            <div>
              <label className="block text-sm text-slate-300 mb-1">List Values (comma separated)</label>
              <input
                type="text"
                value={listValues}
                onChange={(e) => setListValues(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                placeholder="e.g., Option 1,Option 2,Option 3"
              />
            </div>
          )}
          
          {(type === 'number' || type === 'date' || type === 'textLength') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Operator</label>
                <select
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                >
                  <option value="">Select operator</option>
                  <option value="=">Equals</option>
                  <option value=">">Greater Than</option>
                  <option value="<">Less Than</option>
                  <option value=">=">Greater or Equal</option>
                  <option value="<=">Less or Equal</option>
                  <option value="<>">Not Equal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-slate-300 mb-1">Value</label>
                <input
                  type={type === 'date' ? 'date' : 'text'}
                  value={value1}
                  onChange={(e) => setValue1(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm text-slate-300 mb-1">Error Message</label>
            <input
              type="text"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
              placeholder="Enter error message"
            />
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="show-error"
              checked={showErrorMessage}
              onChange={(e) => setShowErrorMessage(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="show-error" className="text-sm text-slate-300">Show error message</label>
          </div>
          
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-nexus-accent hover:bg-cyan-600 text-white rounded-lg flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DataValidationCellProps {
  value: any;
  validation?: DataValidation;
  onChange: (value: any) => void;
}

export const DataValidationCell: React.FC<DataValidationCellProps> = ({
  value,
  validation,
  onChange
}) => {
  if (!validation) {
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full p-1 border-none outline-none"
      />
    );
  }

  switch (validation.type) {
    case 'list':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full p-1 border-none outline-none bg-transparent"
        >
          <option value="">Select...</option>
          {validation.criteria.listValues?.map((option, index) => (
            <option key={index} value={option}>{option}</option>
          ))}
        </select>
      );

    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full p-1 border-none outline-none"
        />
      );
  }
};