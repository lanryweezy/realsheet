/**
 * Data Validation Service
 * Implements Excel-style data validation rules
 */

import { safeEvaluate } from '../utils/safeFormulaParser';

export type ValidationType = 
  | 'any'
  | 'wholeNumber'
  | 'decimal'
  | 'list'
  | 'date'
  | 'time'
  | 'textLength'
  | 'custom';

export type ValidationOperator = 
  | 'between'
  | 'notBetween'
  | 'equal'
  | 'notEqual'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual';

export interface DataValidationRule {
  id: string;
  type: ValidationType;
  operator: ValidationOperator;
  value1?: string | number;
  value2?: string | number;
  listValues?: string[]; // For list validation
  formula?: string; // For custom validation
  allowBlank?: boolean;
  showInputMessage?: boolean;
  inputTitle?: string;
  inputMessage?: string;
  showError?: boolean;
  errorStyle?: 'stop' | 'warning' | 'information';
  errorTitle?: string;
  errorMessage?: string;
  range?: string; // Cell range e.g., "A1:B10"
}

export interface ValidationResult {
  isValid: boolean;
  error?: {
    title: string;
    message: string;
    style: 'stop' | 'warning' | 'information';
  };
}

/**
 * Validate a cell value against validation rules
 */
export const validateCellValue = (
  value: any,
  rule: DataValidationRule
): ValidationResult => {
  // Allow blank if specified
  if ((value === null || value === undefined || value === '') && rule.allowBlank !== false) {
    return { isValid: true };
  }

  // Skip validation if no rule type specified
  if (!rule.type || rule.type === 'any') {
    return { isValid: true };
  }

  // Custom formula validation
  if (rule.type === 'custom' && rule.formula) {
    return validateCustomFormula(value, rule.formula);
  }

  // List validation
  if (rule.type === 'list' && rule.listValues) {
    if (!rule.listValues.includes(String(value))) {
      return createValidationError(rule, 'not_in_list');
    }
    return { isValid: true };
  }

  // Type-specific validation
  const typedValue = convertToType(value, rule.type);
  
  if (typedValue === null && rule.type !== 'textLength') {
    return createValidationError(rule, 'invalid_type');
  }

  // Operator-based validation
  if (!validateOperator(typedValue, rule)) {
    return createValidationError(rule, 'constraint_violation');
  }

  return { isValid: true };
};

/**
 * Convert value to appropriate type for validation
 */
const convertToType = (value: any, type: ValidationType): any => {
  try {
    switch (type) {
      case 'wholeNumber':
        const int = parseInt(value);
        return isNaN(int) || !Number.isInteger(parseFloat(value)) ? null : int;
      
      case 'decimal':
        const num = parseFloat(value);
        return isNaN(num) ? null : num;
      
      case 'date':
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      
      case 'time':
        // Time validation (expecting HH:MM or HH:MM:SS)
        const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])(?::([0-5][0-9]))?$/;
        return timeRegex.test(String(value)) ? String(value) : null;
      
      case 'textLength':
        return String(value).length;
      
      default:
        return value;
    }
  } catch {
    return null;
  }
};

/**
 * Validate value against operator constraints
 */
const validateOperator = (value: any, rule: DataValidationRule): boolean => {
  const val1 = convertToType(rule.value1, rule.type);
  const val2 = convertToType(rule.value2, rule.type);

  switch (rule.operator) {
    case 'between':
      return value >= val1 && value <= val2;
    
    case 'notBetween':
      return value < val1 || value > val2;
    
    case 'equal':
      return value === val1;
    
    case 'notEqual':
      return value !== val1;
    
    case 'greaterThan':
      return value > val1;
    
    case 'lessThan':
      return value < val1;
    
    case 'greaterThanOrEqual':
      return value >= val1;
    
    case 'lessThanOrEqual':
      return value <= val1;
    
    default:
      return true;
  }
};

/**
 * Validate custom formula
 */
const validateCustomFormula = (value: any, formula: string): ValidationResult => {
  try {
    // Formula should return TRUE/FALSE or 1/0
    const evalFormula = formula.replace(/<cell>/g, String(value));
    const result = safeEvaluate(evalFormula, {});
    return result === true || result === 1 
      ? { isValid: true } 
      : createValidationError({
          type: 'custom',
          errorStyle: 'stop',
          errorTitle: 'Validation Error',
          errorMessage: 'Custom validation failed'
        } as DataValidationRule, 'custom_failed');
  } catch (error) {
    return { isValid: true }; // If formula is invalid, don't block
  }
};

/**
 * Create validation error response
 */
const createValidationError = (
  rule: DataValidationRule, 
  errorCode: string
): ValidationResult => {
  const defaultMessages: Record<string, string> = {
    invalid_type: 'The value must be a valid number or date.',
    constraint_violation: 'The value does not meet the validation criteria.',
    not_in_list: 'The value must be selected from the list.',
    custom_failed: 'The value does not meet the custom validation criteria.',
  };

  return {
    isValid: false,
    error: {
      title: rule.errorTitle || 'Validation Error',
      message: rule.errorMessage || defaultMessages[errorCode] || 'Invalid value.',
      style: rule.errorStyle || 'stop',
    },
  };
};

/**
 * Parse list values from string
 */
export const parseListValues = (listString: string): string[] => {
  return listString
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0);
};

/**
 * Generate dropdown options for list validation
 */
export const getDropdownOptions = (rule: DataValidationRule): string[] => {
  if (rule.listValues) {
    return rule.listValues;
  }
  
  // If source is a range reference, would need to fetch from sheet data
  // This is a simplified implementation
  return [];
};

/**
 * Create a new validation rule
 */
export const createValidationRule = (
  type: ValidationType,
  range: string,
  options?: Partial<DataValidationRule>
): DataValidationRule => {
  const baseRule: DataValidationRule = {
    id: `validation_${Date.now()}`,
    type,
    operator: 'between',
    allowBlank: true,
    showInputMessage: false,
    showError: true,
    errorStyle: 'stop',
    range,
    ...options,
  };

  // Set default operator based on type
  if (type === 'list') {
    baseRule.operator = 'equal';
  } else if (type === 'any') {
    baseRule.allowBlank = true;
  }

  return baseRule;
};

/**
 * Validate all cells in a range against rules
 */
export interface CellValidationResult {
  row: number;
  col: number;
  cellRef: string;
  value: any;
  validationResult: ValidationResult;
}

export const validateRange = (
  data: any[][],
  rules: DataValidationRule[]
): CellValidationResult[] => {
  const results: CellValidationResult[] = [];

  rules.forEach(rule => {
    if (!rule.range) return;

    const range = parseRange(rule.range);
    if (!range) return;

    for (let row = range.startRow; row <= range.endRow; row++) {
      for (let col = range.startCol; col <= range.endCol; col++) {
        if (row < data.length && col < data[row].length) {
          const value = data[row][col];
          const result = validateCellValue(value, rule);
          
          if (!result.isValid) {
            results.push({
              row,
              col,
              cellRef: getCellRef(row, col),
              value,
              validationResult: result,
            });
          }
        }
      }
    }
  });

  return results;
};

/**
 * Parse cell range string (e.g., "A1:B10")
 */
const parseRange = (range: string): { startRow: number; endRow: number; startCol: number; endCol: number } | null => {
  const parts = range.split(':');
  if (parts.length === 1) {
    const cell = parseCellRef(parts[0]);
    if (!cell) return null;
    return {
      startRow: cell.row,
      endRow: cell.row,
      startCol: cell.col,
      endCol: cell.col,
    };
  }

  const start = parseCellRef(parts[0]);
  const end = parseCellRef(parts[1]);

  if (!start || !end) return null;

  return {
    startRow: Math.min(start.row, end.row),
    endRow: Math.max(start.row, end.row),
    startCol: Math.min(start.col, end.col),
    endCol: Math.max(start.col, end.col),
  };
};

/**
 * Parse cell reference (e.g., "A1" -> { row: 0, col: 0 })
 */
const parseCellRef = (ref: string): { row: number; col: number } | null => {
  const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;

  let col = 0;
  for (let i = 0; i < match[1].length; i++) {
    col = col * 26 + (match[1].charCodeAt(i) - 64);
  }

  return {
    row: parseInt(match[2]) - 1,
    col: col - 1,
  };
};

/**
 * Get cell reference from row/col
 */
const getCellRef = (row: number, col: number): string => {
  let colStr = '';
  let colNum = col + 1;
  
  while (colNum > 0) {
    colStr = String.fromCharCode(64 + ((colNum - 1) % 26) + 1) + colStr;
    colNum = Math.floor((colNum - 1) / 26);
  }
  
  return `${colStr}${row + 1}`;
};

/**
 * Get common validation presets
 */
export const getValidationPresets = (): Array<{
  id: ValidationType;
  name: string;
  description: string;
  icon: string;
}> => [
  { id: 'wholeNumber', name: 'Whole Number', description: 'Allow only whole numbers', icon: '123' },
  { id: 'decimal', name: 'Decimal', description: 'Allow decimal numbers', icon: '1.5' },
  { id: 'list', name: 'List', description: 'Select from dropdown', icon: '▼' },
  { id: 'date', name: 'Date', description: 'Allow valid dates', icon: '📅' },
  { id: 'time', name: 'Time', description: 'Allow valid times', icon: '🕐' },
  { id: 'textLength', name: 'Text Length', description: 'Limit text length', icon: 'ABC' },
  { id: 'custom', name: 'Custom', description: 'Use formula for validation', icon: 'ƒ' },
];

/**
 * Get operator options for validation type
 */
export const getOperatorOptions = (type: ValidationType): Array<{
  value: ValidationOperator;
  label: string;
}> => {
  const commonOperators = [
    { value: 'between', label: 'between' },
    { value: 'notBetween', label: 'not between' },
    { value: 'equal', label: 'equal to' },
    { value: 'notEqual', label: 'not equal to' },
    { value: 'greaterThan', label: 'greater than' },
    { value: 'lessThan', label: 'less than' },
    { value: 'greaterThanOrEqual', label: 'greater than or equal to' },
    { value: 'lessThanOrEqual', label: 'less than or equal to' },
  ];

  if (type === 'list') {
    return [{ value: 'equal', label: 'is in list' }];
  }

  if (type === 'textLength') {
    return commonOperators;
  }

  return commonOperators;
};
