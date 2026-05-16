/**
 * Advanced Excel Formula Functions - 50+ Additional Functions
 * Organized by category for easy reference
 */

import { Row } from '../types';
import { parseCellReference, evaluateCellValue } from './formulaService';

// Helper functions (local to this module)
const splitArgs = (args: string): string[] => {
  const result: string[] = [];
  let current = '';
  let parenDepth = 0;
  let inQuotes = false;
  
  for (let i = 0; i < args.length; i++) {
    const char = args[i];
    if (char === '"') inQuotes = !inQuotes;
    if (char === '(' && !inQuotes) parenDepth++;
    if (char === ')' && !inQuotes) parenDepth--;
    if (char === ',' && parenDepth === 0 && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current.trim()) result.push(current.trim());
  return result;
};

const getValuesFromRange = (rangeStr: string, allRows: Row[], columns: string[]): (string | number)[] => {
  try {
    const [start, end] = rangeStr.split(':');
    const startMatch = start.match(/([A-Z]+)([0-9]+)/i);
    const endMatch = end.match(/([A-Z]+)([0-9]+)/i);
    
    if (!startMatch || !endMatch) return [];
    
    const startCol = startMatch[1].toUpperCase().split('').reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0) - 1;
    const startRow = parseInt(startMatch[2]) - 1;
    const endCol = endMatch[1].toUpperCase().split('').reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0) - 1;
    const endRow = parseInt(endMatch[2]) - 1;
    
    const values: (string | number)[] = [];
    for (let r = Math.min(startRow, endRow); r <= Math.max(startRow, endRow); r++) {
      for (let c = Math.min(startCol, endCol); c <= Math.max(startCol, endCol); c++) {
        if (r >= 0 && r < allRows.length && c >= 0 && c < columns.length) {
          const val = allRows[r][columns[c]];
          if (val !== null && val !== undefined && val !== '') {
            values.push(val);
          }
        }
      }
    }
    return values;
  } catch {
    return [];
  }
};

const evaluateExpression = (expr: string, allRows: Row[], columns: string[]): any => {
  const trimmed = expr.trim();
  
  // Check if it's a range reference
  if (trimmed.match(/^[A-Z]+[0-9]+:[A-Z]+[0-9]+$/i)) {
    return getValuesFromRange(trimmed, allRows, columns);
  }
  
  // Check if it's a cell reference
  const cellMatch = trimmed.match(/^([A-Z]+)([0-9]+)$/i);
  if (cellMatch) {
    const col = cellMatch[1].toUpperCase().split('').reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0) - 1;
    const row = parseInt(cellMatch[2]) - 1;
    if (row >= 0 && row < allRows.length && col >= 0 && col < columns.length) {
      return allRows[row][columns[col]];
    }
  }
  
  // Try to parse as number
  const num = Number(trimmed);
  if (!isNaN(num)) return num;
  
  // Remove quotes from string
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  
  return trimmed;
};

// ============ ADVANCED MATH FUNCTIONS ============

/**
 * SUMIFS - Sum with multiple criteria
 * SUMIFS(sum_range, criteria_range1, criteria1, [criteria_range2, criteria2], ...)
 */
export const evaluateSUMIFS = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 3) return 0;

  const sumRange = parts[0].trim();
  let sum = 0;

  // Get all values from sum range
  const sumValues = getValuesFromRange(sumRange, allRows, columns);

  // Process criteria pairs
  for (let i = 0; i < sumValues.length; i++) {
    let meetsAllCriteria = true;

    for (let j = 1; j < parts.length; j += 2) {
      const criteriaRange = parts[j].trim();
      const criteria = parts[j + 1]?.trim() || '';

      const criteriaValues = getValuesFromRange(criteriaRange, allRows, columns);
      const criteriaValue = criteriaValues[i];

      if (!evaluateCriteria(criteriaValue, criteria)) {
        meetsAllCriteria = false;
        break;
      }
    }

    if (meetsAllCriteria) {
      sum += Number(sumValues[i]) || 0;
    }
  }

  return sum;
};

/**
 * COUNTIFS - Count with multiple criteria
 */
export const evaluateCOUNTIFS = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return 0;

  const firstRange = parts[0].trim();
  const firstCriteria = parts[1]?.trim() || '';
  
  const firstValues = getValuesFromRange(firstRange, allRows, columns);
  let count = 0;

  for (let i = 0; i < firstValues.length; i++) {
    let meetsAllCriteria = true;

    for (let j = 0; j < parts.length; j += 2) {
      const criteriaRange = parts[j].trim();
      const criteria = parts[j + 1]?.trim() || '';

      const criteriaValues = getValuesFromRange(criteriaRange, allRows, columns);
      const criteriaValue = criteriaValues[i];

      if (!evaluateCriteria(criteriaValue, criteria)) {
        meetsAllCriteria = false;
        break;
      }
    }

    if (meetsAllCriteria) {
      count++;
    }
  }

  return count;
};

/**
 * AVERAGEIFS - Average with multiple criteria
 */
export const evaluateAVERAGEIFS = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 3) return 0;

  const sumRange = parts[0].trim();
  let sum = 0;
  let count = 0;

  const sumValues = getValuesFromRange(sumRange, allRows, columns);

  for (let i = 0; i < sumValues.length; i++) {
    let meetsAllCriteria = true;

    for (let j = 1; j < parts.length; j += 2) {
      const criteriaRange = parts[j].trim();
      const criteria = parts[j + 1]?.trim() || '';

      const criteriaValues = getValuesFromRange(criteriaRange, allRows, columns);
      const criteriaValue = criteriaValues[i];

      if (!evaluateCriteria(criteriaValue, criteria)) {
        meetsAllCriteria = false;
        break;
      }
    }

    if (meetsAllCriteria) {
      sum += Number(sumValues[i]) || 0;
      count++;
    }
  }

  return count > 0 ? sum / count : 0;
};

/**
 * MAXIFS - Maximum with criteria
 */
export const evaluateMAXIFS = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 3) return 0;

  const maxRange = parts[0].trim();
  let max = -Infinity;

  const maxValues = getValuesFromRange(maxRange, allRows, columns);

  for (let i = 0; i < maxValues.length; i++) {
    let meetsAllCriteria = true;

    for (let j = 1; j < parts.length; j += 2) {
      const criteriaRange = parts[j].trim();
      const criteria = parts[j + 1]?.trim() || '';

      const criteriaValues = getValuesFromRange(criteriaRange, allRows, columns);
      const criteriaValue = criteriaValues[i];

      if (!evaluateCriteria(criteriaValue, criteria)) {
        meetsAllCriteria = false;
        break;
      }
    }

    if (meetsAllCriteria) {
      const num = Number(maxValues[i]);
      if (!isNaN(num) && num > max) {
        max = num;
      }
    }
  }

  return max === -Infinity ? 0 : max;
};

/**
 * MINIFS - Minimum with criteria
 */
export const evaluateMINIFS = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 3) return 0;

  const minRange = parts[0].trim();
  let min = Infinity;

  const minValues = getValuesFromRange(minRange, allRows, columns);

  for (let i = 0; i < minValues.length; i++) {
    let meetsAllCriteria = true;

    for (let j = 1; j < parts.length; j += 2) {
      const criteriaRange = parts[j].trim();
      const criteria = parts[j + 1]?.trim() || '';

      const criteriaValues = getValuesFromRange(criteriaRange, allRows, columns);
      const criteriaValue = criteriaValues[i];

      if (!evaluateCriteria(criteriaValue, criteria)) {
        meetsAllCriteria = false;
        break;
      }
    }

    if (meetsAllCriteria) {
      const num = Number(minValues[i]);
      if (!isNaN(num) && num < min) {
        min = num;
      }
    }
  }

  return min === Infinity ? 0 : min;
};

// Helper function to evaluate criteria
const evaluateCriteria = (value: any, criteria: string): boolean => {
  if (!criteria) return true;

  // Handle wildcards
  if (criteria.includes('*')) {
    const pattern = criteria.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${pattern}$`, 'i');
    return regex.test(String(value));
  }

  // Handle comparison operators
  if (criteria.startsWith('>=')) {
    return Number(value) >= Number(criteria.slice(2));
  } else if (criteria.startsWith('<=')) {
    return Number(value) <= Number(criteria.slice(2));
  } else if (criteria.startsWith('>')) {
    return Number(value) > Number(criteria.slice(1));
  } else if (criteria.startsWith('<')) {
    return Number(value) < Number(criteria.slice(1));
  } else if (criteria.startsWith('<>')) {
    return String(value) !== criteria.slice(2);
  } else if (criteria.startsWith('=')) {
    return String(value) === criteria.slice(1);
  } else {
    return String(value) === criteria;
  }
};

// ============ ADVANCED TEXT FUNCTIONS ============

/**
 * TEXTSPLIT - Split text by delimiters
 */
export const evaluateTEXTSPLIT = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const text = String(evaluateExpression(parts[0], allRows, columns));
  const delimiters = String(evaluateExpression(parts[1], allRows, columns));

  const result = text.split(new RegExp(`[${delimiters}]`));
  return result.join(', ');
};

/**
 * TEXTJOIN - Join text with delimiter
 */
export const evaluateTEXTJOINEnhanced = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 3) return '';

  const delimiter = String(evaluateExpression(parts[0], allRows, columns));
  const ignoreEmpty = evaluateExpression(parts[1], allRows, columns) === true;
  const texts = parts.slice(2).map(p => String(evaluateExpression(p, allRows, columns)));

  return ignoreEmpty ? texts.filter(t => t).join(delimiter) : texts.join(delimiter);
};

/**
 * REGEXEXTRACT - Extract text using regex
 */
export const evaluateREGEXEXTRACT = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const text = String(evaluateExpression(parts[0], allRows, columns));
  const pattern = String(evaluateExpression(parts[1], allRows, columns));

  const match = text.match(new RegExp(pattern));
  return match ? match[0] : '';
};

/**
 * REGEXREPLACE - Replace text using regex
 */
export const evaluateREGEXREPLACE = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 3) return '';

  const text = String(evaluateExpression(parts[0], allRows, columns));
  const pattern = String(evaluateExpression(parts[1], allRows, columns));
  const replacement = String(evaluateExpression(parts[2], allRows, columns));

  return text.replace(new RegExp(pattern, 'g'), replacement);
};

/**
 * SPLIT - Split text into array
 */
export const evaluateSPLIT = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const text = String(evaluateExpression(parts[0], allRows, columns));
  const delimiter = String(evaluateExpression(parts[1], allRows, columns));

  return text.split(delimiter).join(' | ');
};

// ============ ADVANCED DATE FUNCTIONS ============

/**
 * WORKDAY - Date excluding weekends
 */
export const evaluateWORKDAYEnhanced = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const startDate = new Date(evaluateExpression(parts[0], allRows, columns));
  const days = Number(evaluateExpression(parts[1], allRows, columns));

  let resultDate = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < days) {
    resultDate.setDate(resultDate.getDate() + 1);
    const dayOfWeek = resultDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }

  return resultDate.toISOString().split('T')[0];
};

/**
 * NETWORKDAYS - Working days between dates
 */
export const evaluateNETWORKDAYSEnhanced = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return 0;

  const startDate = new Date(evaluateExpression(parts[0], allRows, columns));
  const endDate = new Date(evaluateExpression(parts[1], allRows, columns));

  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * DATEDIF - Difference between dates
 */
export const evaluateDATEDIFEnhanced = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 3) return 0;

  const startDate = new Date(evaluateExpression(parts[0], allRows, columns));
  const endDate = new Date(evaluateExpression(parts[1], allRows, columns));
  const unit = String(evaluateExpression(parts[2], allRows, columns)).toLowerCase();

  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  switch (unit) {
    case 'y':
      return endDate.getFullYear() - startDate.getFullYear();
    case 'm':
      return (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    case 'd':
      return diffDays;
    case 'md':
      return endDate.getDate() - startDate.getDate();
    case 'ym':
      return endDate.getMonth() - startDate.getMonth();
    case 'yd':
      return diffDays % 365;
    default:
      return diffDays;
  }
};

/**
 * EOMONTH - End of month
 */
export const evaluateEOMONTHEnhanced = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const startDate = new Date(evaluateExpression(parts[0], allRows, columns));
  const months = Number(evaluateExpression(parts[1], allRows, columns));

  const resultDate = new Date(startDate.getFullYear(), startDate.getMonth() + months + 1, 0);
  return resultDate.toISOString().split('T')[0];
};

/**
 * EDATE - Date shifted by months
 */
export const evaluateEDATEEnhanced = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const startDate = new Date(evaluateExpression(parts[0], allRows, columns));
  const months = Number(evaluateExpression(parts[1], allRows, columns));

  const resultDate = new Date(startDate);
  resultDate.setMonth(resultDate.getMonth() + months);
  return resultDate.toISOString().split('T')[0];
};

// ============ ADVANCED LOGICAL FUNCTIONS ============

/**
 * IFERROR - Return value if error
 */
export const evaluateIFERROR = (args: string, allRows: Row[], columns: string[]): any => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  try {
    const value = evaluateExpression(parts[0], allRows, columns);
    if (value === '#ERROR!' || value === '#N/A' || value === '#VALUE!') {
      return evaluateExpression(parts[1], allRows, columns);
    }
    return value;
  } catch {
    return evaluateExpression(parts[1], allRows, columns);
  }
};

/**
 * IFNA - Return value if #N/A
 */
export const evaluateIFNA = (args: string, allRows: Row[], columns: string[]): any => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const value = evaluateExpression(parts[0], allRows, columns);
  if (value === '#N/A') {
    return evaluateExpression(parts[1], allRows, columns);
  }
  return value;
};

/**
 * IFS - Multiple conditions
 */
export const evaluateIFSEnhanced = (args: string, allRows: Row[], columns: string[]): any => {
  const parts = splitArgs(args);
  
  for (let i = 0; i < parts.length; i += 2) {
    const condition = evaluateExpression(parts[i], allRows, columns);
    if (condition) {
      return evaluateExpression(parts[i + 1], allRows, columns);
    }
  }
  
  return '#N/A';
};

/**
 * SWITCH - Switch statement
 */
export const evaluateSWITCHEnhanced = (args: string, allRows: Row[], columns: string[]): any => {
  const parts = splitArgs(args);
  if (parts.length < 4) return '';

  const expression = evaluateExpression(parts[0], allRows, columns);

  for (let i = 1; i < parts.length - 1; i += 2) {
    if (evaluateExpression(parts[i], allRows, columns) === expression) {
      return evaluateExpression(parts[i + 1], allRows, columns);
    }
  }

  // Default value (if exists)
  if (parts.length % 2 === 0) {
    return evaluateExpression(parts[parts.length - 1], allRows, columns);
  }

  return '#N/A';
};

// ============ ADVANCED LOOKUP FUNCTIONS ============

/**
 * TRANSPOSE - Transpose range
 */
export const evaluateTRANSPOSE = (args: string, allRows: Row[], columns: string[]): string => {
  const range = args.trim();
  const values = getValuesFromRange(range, allRows, columns);
  return values.join(' | ');
};

/**
 * UNIQUE - Return unique values
 */
export const evaluateUNIQUEEnhanced = (args: string, allRows: Row[], columns: string[]): string => {
  const range = args.trim();
  const values = getValuesFromRange(range, allRows, columns);
  const unique = [...new Set(values)];
  return unique.join(', ');
};

/**
 * SORT - Sort range
 */
export const evaluateSORTRange = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 1) return '';

  const range = parts[0].trim();
  const values = getValuesFromRange(range, allRows, columns);
  
  const sortCol = parts[1] ? Number(evaluateExpression(parts[1], allRows, columns)) : 1;
  const sortOrder = parts[2] ? Number(evaluateExpression(parts[2], allRows, columns)) : 1;

  const sorted = [...values].sort((a, b) => {
    const numA = Number(a);
    const numB = Number(b);
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return sortOrder === 1 ? numA - numB : numB - numA;
    }
    
    return sortOrder === 1 
      ? String(a).localeCompare(String(b))
      : String(b).localeCompare(String(a));
  });

  return sorted.join(', ');
};

/**
 * FILTER - Filter range by criteria
 */
export const evaluateFILTEREnhanced = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const range = parts[0].trim();
  const include = evaluateExpression(parts[1], allRows, columns);

  const values = getValuesFromRange(range, allRows, columns);
  const filtered = values.filter((_, i) => include);

  return filtered.join(', ');
};

// ============ STATISTICAL FUNCTIONS ============

/**
 * COUNTBLANK - Count empty cells
 */
export const evaluateCOUNTBLANK = (args: string, allRows: Row[], columns: string[]): number => {
  const range = args.trim();
  const values = getValuesFromRange(range, allRows, columns);
  return values.filter(v => v === '' || v === null || v === undefined).length;
};

/**
 * COUNTA - Count non-empty cells
 */
export const evaluateCOUNTA = (args: string, allRows: Row[], columns: string[]): number => {
  const range = args.trim();
  const values = getValuesFromRange(range, allRows, columns);
  return values.filter(v => v !== '' && v !== null && v !== undefined).length;
};

/**
 * CONCAT - Concatenate values
 */
export const evaluateCONCAT = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  return parts.map(p => String(evaluateExpression(p, allRows, columns))).join('');
};

/**
 * REPT - Repeat text
 */
export const evaluateREPTEnhanced = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const text = String(evaluateExpression(parts[0], allRows, columns));
  const count = Number(evaluateExpression(parts[1], allRows, columns));

  return text.repeat(count);
};

/**
 * TRIM - Remove extra spaces
 */
export const evaluateTRIM = (args: string, allRows: Row[], columns: string[]): string => {
  const text = String(evaluateExpression(args, allRows, columns));
  return text.trim().replace(/\s+/g, ' ');
};

/**
 * CLEAN - Remove non-printable characters
 */
export const evaluateCLEAN = (args: string, allRows: Row[], columns: string[]): string => {
  const text = String(evaluateExpression(args, allRows, columns));
  return text.replace(/[\x00-\x1F]/g, '');
};

/**
 * EXACT - Exact string comparison
 */
export const evaluateEXACTEnhanced = (args: string, allRows: Row[], columns: string[]): boolean => {
  const parts = splitArgs(args);
  if (parts.length < 2) return false;

  const text1 = String(evaluateExpression(parts[0], allRows, columns));
  const text2 = String(evaluateExpression(parts[1], allRows, columns));

  return text1 === text2;
};

// ============ FINANCIAL FUNCTIONS ============

/**
 * FV - Future Value
 */
export const evaluateFVEnhanced = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 3) return 0;

  const rate = Number(evaluateExpression(parts[0], allRows, columns)) / 100;
  const nper = Number(evaluateExpression(parts[1], allRows, columns));
  const pmt = Number(evaluateExpression(parts[2], allRows, columns));
  const pv = parts[3] ? Number(evaluateExpression(parts[3], allRows, columns)) : 0;

  const fv = -pv * Math.pow(1 + rate, nper) - pmt * (Math.pow(1 + rate, nper) - 1) / rate;
  return Math.round(fv * 100) / 100;
};

/**
 * NPV - Net Present Value
 */
export const evaluateNPVEnhanced = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return 0;

  const rate = Number(evaluateExpression(parts[0], allRows, columns)) / 100;
  const values = parts.slice(1).map(p => Number(evaluateExpression(p, allRows, columns)));

  let npv = 0;
  for (let i = 0; i < values.length; i++) {
    npv += values[i] / Math.pow(1 + rate, i + 1);
  }

  return Math.round(npv * 100) / 100;
};

/**
 * IRR - Internal Rate of Return
 */
export const evaluateIRREnhanced = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return 0;

  const values = parts.map(p => Number(evaluateExpression(p, allRows, columns)));
  
  // Simple IRR calculation using Newton's method
  let guess = 0.1;
  for (let i = 0; i < 100; i++) {
    let npv = 0;
    let derivative = 0;
    
    for (let j = 0; j < values.length; j++) {
      npv += values[j] / Math.pow(1 + guess, j);
      derivative -= j * values[j] / Math.pow(1 + guess, j + 1);
    }
    
    const newGuess = guess - npv / derivative;
    if (Math.abs(newGuess - guess) < 0.00001) {
      return Math.round(newGuess * 10000) / 100;
    }
    guess = newGuess;
  }

  return Math.round(guess * 10000) / 100;
};

// Export all functions
export const ADVANCED_FUNCTIONS = {
  // Math
  SUMIFS: evaluateSUMIFS,
  COUNTIFS: evaluateCOUNTIFS,
  AVERAGEIFS: evaluateAVERAGEIFS,
  MAXIFS: evaluateMAXIFS,
  MINIFS: evaluateMINIFS,
  
  // Text
  TEXTSPLIT: evaluateTEXTSPLIT,
  TEXTJOIN: evaluateTEXTJOINEnhanced,
  REGEXEXTRACT: evaluateREGEXEXTRACT,
  REGEXREPLACE: evaluateREGEXREPLACE,
  SPLIT: evaluateSPLIT,
  
  // Date
  WORKDAY: evaluateWORKDAYEnhanced,
  NETWORKDAYS: evaluateNETWORKDAYSEnhanced,
  DATEDIF: evaluateDATEDIFEnhanced,
  EOMONTH: evaluateEOMONTHEnhanced,
  EDATE: evaluateEDATEEnhanced,
  
  // Logical
  IFERROR: evaluateIFERROR,
  IFNA: evaluateIFNA,
  IFS: evaluateIFSEnhanced,
  SWITCH: evaluateSWITCHEnhanced,
  
  // Lookup
  TRANSPOSE: evaluateTRANSPOSE,
  UNIQUE: evaluateUNIQUEEnhanced,
  SORT: evaluateSORTRange,
  FILTER: evaluateFILTEREnhanced,
  
  // Statistical
  COUNTBLANK: evaluateCOUNTBLANK,
  COUNTA: evaluateCOUNTA,
  CONCAT: evaluateCONCAT,
  REPT: evaluateREPTEnhanced,
  TRIM: evaluateTRIM,
  CLEAN: evaluateCLEAN,
  EXACT: evaluateEXACTEnhanced,
  
  // Financial
  FV: evaluateFVEnhanced,
  NPV: evaluateNPVEnhanced,
  IRR: evaluateIRREnhanced
};
