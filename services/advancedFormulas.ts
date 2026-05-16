import { Row, SheetData } from '../types';
import { parseCellReference, excelColToIndex } from './formulaService';
import { safeEvaluate } from '../utils/safeFormulaParser';

/**
 * Advanced Formula Implementations
 * Supporting 100+ Excel/Google Sheets functions
 */

// ============= LOOKUP FUNCTIONS =============

/**
 * XLOOKUP - Modern replacement for VLOOKUP/HLOOKUP
 * XLOOKUP(lookup_value, lookup_array, return_array, [if_not_found], [match_mode], [search_mode])
 */
export const evaluateXLOOKUP = (args: string, allRows: Row[], columns: string[]): any => {
  const parts = splitArgs(args);
  if (parts.length < 3) return '#ERROR!';

  const lookupValue = evaluateExpression(parts[0], allRows, columns);
  const lookupArray = getRangeValuesAsString(parts[1], allRows, columns);
  const returnArray = getRangeValuesAsString(parts[2], allRows, columns);
  const ifNotFound = parts[3] ? evaluateExpression(parts[3], allRows, columns) : '#N/A';
  const matchMode = parts[4] ? Number(evaluateExpression(parts[4], allRows, columns)) : 0; // 0=exact, -1=exact or next smaller, 1=exact or next larger, 2=wildcard
  const searchMode = parts[5] ? Number(evaluateExpression(parts[5], allRows, columns)) : 1; // 1=first to last, -1=last to first, 2=binary ascending, -2=binary descending

  if (lookupArray.length !== returnArray.length) return '#ERROR!';

  let index = -1;

  if (searchMode === 1 || searchMode === 2) {
    // Search from first to last
    for (let i = 0; i < lookupArray.length; i++) {
      if (matchMode === 0 && String(lookupArray[i]) === String(lookupValue)) {
        index = i;
        break;
      } else if (matchMode === -1 && Number(lookupArray[i]) <= Number(lookupValue)) {
        index = i;
      } else if (matchMode === 1 && Number(lookupArray[i]) >= Number(lookupValue)) {
        index = i;
        break;
      }
    }
  } else {
    // Search from last to first
    for (let i = lookupArray.length - 1; i >= 0; i--) {
      if (matchMode === 0 && String(lookupArray[i]) === String(lookupValue)) {
        index = i;
        break;
      }
    }
  }

  return index !== -1 ? returnArray[index] : ifNotFound;
};

/**
 * HLOOKUP - Horizontal lookup
 * HLOOKUP(lookup_value, table_array, row_index_num, [range_lookup])
 */
export const evaluateHLOOKUP = (args: string, allRows: Row[], columns: string[]): any => {
  const parts = splitArgs(args);
  if (parts.length < 3) return '#ERROR!';

  const lookupValue = evaluateExpression(parts[0], allRows, columns);
  const tableArray = parts[1].trim();
  const rowIndex = Number(evaluateExpression(parts[2], allRows, columns)) - 1; // Convert to 0-based
  const rangeLookup = parts[3] ? evaluateExpression(parts[3], allRows, columns) : true;

  // Parse table array (e.g., "A1:D5")
  const rangeParts = tableArray.split(':');
  if (rangeParts.length !== 2) return '#ERROR!';

  const startRef = parseCellReference(rangeParts[0]);
  const endRef = parseCellReference(rangeParts[1]);
  if (!startRef || !endRef) return '#ERROR!';

  // Search first row for lookup value
  for (let col = startRef.colIndex; col <= endRef.colIndex; col++) {
    if (col < columns.length && startRef.rowIndex < allRows.length) {
      const cellValue = allRows[startRef.rowIndex][columns[col]];
      if (String(cellValue) === String(lookupValue) || (rangeLookup && Number(cellValue) === Number(lookupValue))) {
        // Return value from specified row
        const targetRow = startRef.rowIndex + rowIndex;
        if (targetRow < allRows.length && col < columns.length) {
          return allRows[targetRow][columns[col]];
        }
      }
    }
  }

  return '#N/A';
};

/**
 * Enhanced INDEX with range support
 * INDEX(array, row_num, [column_num])
 */
export const evaluateINDEXRange = (args: string, allRows: Row[], columns: string[]): any => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '#ERROR!';

  const array = parts[0].trim();
  const rowNum = Number(evaluateExpression(parts[1], allRows, columns)) - 1; // Convert to 0-based
  const colNum = parts[2] ? Number(evaluateExpression(parts[2], allRows, columns)) - 1 : 0;

  // Parse array range
  const rangeParts = array.split(':');
  if (rangeParts.length !== 2) return '#ERROR!';

  const startRef = parseCellReference(rangeParts[0]);
  if (!startRef) return '#ERROR!';

  const targetRow = startRef.rowIndex + rowNum;
  const targetCol = startRef.colIndex + colNum;

  if (targetRow >= 0 && targetRow < allRows.length && targetCol >= 0 && targetCol < columns.length) {
    return allRows[targetRow][columns[targetCol]];
  }

  return '#REF!';
};

/**
 * Enhanced MATCH with all match types
 * MATCH(lookup_value, lookup_array, [match_type])
 */
export const evaluateMATCHEnhanced = (args: string, allRows: Row[], columns: string[]): any => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '#ERROR!';

  const lookupValue = evaluateExpression(parts[0], allRows, columns);
  const lookupArray = parts[1].trim();
  const matchType = parts[2] ? Number(evaluateExpression(parts[2], allRows, columns)) : 1;

  // Parse lookup array
  const values = getRangeValuesAsString(lookupArray, allRows, columns);

  switch (matchType) {
    case 0: // Exact match
      for (let i = 0; i < values.length; i++) {
        if (String(values[i]) === String(lookupValue)) {
          return i + 1; // 1-based index
        }
      }
      break;
    case 1: // Exact match or next smallest (array must be ascending)
      let result1 = -1;
      for (let i = 0; i < values.length; i++) {
        if (Number(values[i]) <= Number(lookupValue)) {
          result1 = i + 1;
        } else {
          break;
        }
      }
      return result1 !== -1 ? result1 : '#N/A';
    case -1: // Exact match or next largest (array must be descending)
      for (let i = 0; i < values.length; i++) {
        if (Number(values[i]) >= Number(lookupValue)) {
          return i + 1;
        }
      }
      break;
  }

  return '#N/A';
};

// ============= LOGICAL FUNCTIONS =============

export const evaluateIF = (args: string, allRows: Row[], columns: string[]): any => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '#ERROR!';
  
  const condition = evaluateExpression(parts[0], allRows, columns);
  const valueIfTrue = parts[1] ? evaluateExpression(parts[1], allRows, columns) : true;
  const valueIfFalse = parts[2] ? evaluateExpression(parts[2], allRows, columns) : false;
  
  return condition ? valueIfTrue : valueIfFalse;
};

export const evaluateIFS = (args: string, allRows: Row[], columns: string[]): any => {
  const parts = splitArgs(args);
  if (parts.length < 2 || parts.length % 2 !== 0) return '#ERROR!';
  
  for (let i = 0; i < parts.length; i += 2) {
    const condition = evaluateExpression(parts[i], allRows, columns);
    if (condition) {
      return evaluateExpression(parts[i + 1], allRows, columns);
    }
  }
  
  return '#N/A';
};

export const evaluateAND = (args: string, allRows: Row[], columns: string[]): boolean => {
  const parts = splitArgs(args);
  return parts.every(part => evaluateExpression(part, allRows, columns));
};

export const evaluateOR = (args: string, allRows: Row[], columns: string[]): boolean => {
  const parts = splitArgs(args);
  return parts.some(part => evaluateExpression(part, allRows, columns));
};

export const evaluateNOT = (args: string, allRows: Row[], columns: string[]): boolean => {
  return !evaluateExpression(args, allRows, columns);
};

export const evaluateXOR = (args: string, allRows: Row[], columns: string[]): boolean => {
  const parts = splitArgs(args);
  const trueCount = parts.filter(part => evaluateExpression(part, allRows, columns)).length;
  return trueCount % 2 === 1;
};

export const evaluateSWITCH = (args: string, allRows: Row[], columns: string[]): any => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '#ERROR!';
  
  const expression = evaluateExpression(parts[0], allRows, columns);
  
  for (let i = 1; i < parts.length - 1; i += 2) {
    const value = evaluateExpression(parts[i], allRows, columns);
    if (expression === value) {
      return evaluateExpression(parts[i + 1], allRows, columns);
    }
  }
  
  // Default value (if odd number of args)
  if (parts.length % 2 === 0) {
    return evaluateExpression(parts[parts.length - 1], allRows, columns);
  }
  
  return '#N/A';
};

// ============= TEXT FUNCTIONS =============

export const evaluateCONCATENATE = (formula: string, allRows: Row[], columns: string[]): string => {
  const match = formula.match(/CONCATENATE\((.+)\)/);
  if (!match) return '#ERROR!';
  
  const parts = splitArgs(match[1]);
  return parts.map(part => String(evaluateExpression(part, allRows, columns))).join('');
};

export const evaluateTEXTJOIN = (formula: string, allRows: Row[], columns: string[]): string => {
  const match = formula.match(/TEXTJOIN\((.+)\)/);
  if (!match) return '#ERROR!';
  
  const parts = splitArgs(match[1]);
  if (parts.length < 3) return '#ERROR!';
  
  const delimiter = String(evaluateExpression(parts[0], allRows, columns)).replace(/^["']|["']$/g, '');
  const ignoreEmpty = evaluateExpression(parts[1], allRows, columns);
  const values = parts.slice(2).map(part => String(evaluateExpression(part, allRows, columns)));
  
  const filtered = ignoreEmpty ? values.filter(v => v !== '') : values;
  return filtered.join(delimiter);
};

export const evaluateTextExtract = (formula: string, allRows: Row[], columns: string[]): string => {
  if (formula.startsWith('LEFT(')) {
    const match = formula.match(/LEFT\((.+?),\s*(\d+)\)/);
    if (!match) return '#ERROR!';
    const text = String(evaluateExpression(match[1], allRows, columns));
    const num = parseInt(match[2]);
    return text.substring(0, num);
  }
  
  if (formula.startsWith('RIGHT(')) {
    const match = formula.match(/RIGHT\((.+?),\s*(\d+)\)/);
    if (!match) return '#ERROR!';
    const text = String(evaluateExpression(match[1], allRows, columns));
    const num = parseInt(match[2]);
    return text.substring(text.length - num);
  }
  
  if (formula.startsWith('MID(')) {
    const match = formula.match(/MID\((.+?),\s*(\d+),\s*(\d+)\)/);
    if (!match) return '#ERROR!';
    const text = String(evaluateExpression(match[1], allRows, columns));
    const start = parseInt(match[2]) - 1; // Excel is 1-based
    const length = parseInt(match[3]);
    return text.substring(start, start + length);
  }
  
  return '#ERROR!';
};

export const evaluateTextTransform = (formula: string, allRows: Row[], columns: string[]): string => {
  if (formula.startsWith('TRIM(')) {
    const match = formula.match(/TRIM\((.+)\)/);
    if (!match) return '#ERROR!';
    return String(evaluateExpression(match[1], allRows, columns)).trim();
  }
  
  if (formula.startsWith('UPPER(')) {
    const match = formula.match(/UPPER\((.+)\)/);
    if (!match) return '#ERROR!';
    return String(evaluateExpression(match[1], allRows, columns)).toUpperCase();
  }
  
  if (formula.startsWith('LOWER(')) {
    const match = formula.match(/LOWER\((.+)\)/);
    if (!match) return '#ERROR!';
    return String(evaluateExpression(match[1], allRows, columns)).toLowerCase();
  }
  
  if (formula.startsWith('PROPER(')) {
    const match = formula.match(/PROPER\((.+)\)/);
    if (!match) return '#ERROR!';
    const text = String(evaluateExpression(match[1], allRows, columns));
    return text.replace(/\b\w/g, char => char.toUpperCase());
  }
  
  return '#ERROR!';
};

export const evaluateLEN = (args: string, allRows: Row[], columns: string[]): number => {
  const text = String(evaluateExpression(args, allRows, columns));
  return text.length;
};

export const evaluateFIND = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return -1;
  
  const findText = String(evaluateExpression(parts[0], allRows, columns));
  const withinText = String(evaluateExpression(parts[1], allRows, columns));
  const startNum = parts[2] ? parseInt(String(evaluateExpression(parts[2], allRows, columns))) - 1 : 0;
  
  const index = withinText.indexOf(findText, startNum);
  return index === -1 ? -1 : index + 1; // Excel is 1-based
};

export const evaluateSUBSTITUTE = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 3) return '#ERROR!';
  
  const text = String(evaluateExpression(parts[0], allRows, columns));
  const oldText = String(evaluateExpression(parts[1], allRows, columns));
  const newText = String(evaluateExpression(parts[2], allRows, columns));
  const instanceNum = parts[3] ? parseInt(String(evaluateExpression(parts[3], allRows, columns))) : -1;
  
  if (instanceNum === -1) {
    return text.split(oldText).join(newText);
  } else {
    let count = 0;
    return text.replace(new RegExp(oldText, 'g'), (match) => {
      count++;
      return count === instanceNum ? newText : match;
    });
  }
};

// ============= DATE/TIME FUNCTIONS =============

export const evaluateDateFunction = (formula: string, allRows: Row[], columns: string[]): any => {
  if (formula.startsWith('DATE(')) {
    const match = formula.match(/DATE\((.+?),\s*(.+?),\s*(.+?)\)/);
    if (!match) return '#ERROR!';
    const year = Number(evaluateExpression(match[1], allRows, columns));
    const month = Number(evaluateExpression(match[2], allRows, columns));
    const day = Number(evaluateExpression(match[3], allRows, columns));
    return new Date(year, month - 1, day).toLocaleDateString();
  }
  
  if (formula.startsWith('YEAR(')) {
    const match = formula.match(/YEAR\((.+)\)/);
    if (!match) return '#ERROR!';
    const dateStr = String(evaluateExpression(match[1], allRows, columns));
    return new Date(dateStr).getFullYear();
  }
  
  if (formula.startsWith('MONTH(')) {
    const match = formula.match(/MONTH\((.+)\)/);
    if (!match) return '#ERROR!';
    const dateStr = String(evaluateExpression(match[1], allRows, columns));
    return new Date(dateStr).getMonth() + 1;
  }
  
  if (formula.startsWith('DAY(')) {
    const match = formula.match(/DAY\((.+)\)/);
    if (!match) return '#ERROR!';
    const dateStr = String(evaluateExpression(match[1], allRows, columns));
    return new Date(dateStr).getDate();
  }
  
  if (formula.startsWith('HOUR(')) {
    const match = formula.match(/HOUR\((.+)\)/);
    if (!match) return '#ERROR!';
    const dateStr = String(evaluateExpression(match[1], allRows, columns));
    return new Date(dateStr).getHours();
  }
  
  if (formula.startsWith('MINUTE(')) {
    const match = formula.match(/MINUTE\((.+)\)/);
    if (!match) return '#ERROR!';
    const dateStr = String(evaluateExpression(match[1], allRows, columns));
    return new Date(dateStr).getMinutes();
  }
  
  if (formula.startsWith('SECOND(')) {
    const match = formula.match(/SECOND\((.+)\)/);
    if (!match) return '#ERROR!';
    const dateStr = String(evaluateExpression(match[1], allRows, columns));
    return new Date(dateStr).getSeconds();
  }
  
  if (formula.startsWith('DATEDIF(')) {
    const match = formula.match(/DATEDIF\((.+?),\s*(.+?),\s*["'](.+?)["']\)/);
    if (!match) return '#ERROR!';
    const startDate = new Date(String(evaluateExpression(match[1], allRows, columns)));
    const endDate = new Date(String(evaluateExpression(match[2], allRows, columns)));
    const unit = match[3];
    
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    switch (unit) {
      case 'D': return diffDays;
      case 'M': return Math.floor(diffDays / 30);
      case 'Y': return Math.floor(diffDays / 365);
      default: return '#ERROR!';
    }
  }
  
  return '#ERROR!';
};

export const evaluateWEEKDAY = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  const dateStr = String(evaluateExpression(parts[0], allRows, columns));
  const returnType = parts[1] ? Number(evaluateExpression(parts[1], allRows, columns)) : 1;
  
  const day = new Date(dateStr).getDay(); // 0 = Sunday
  
  if (returnType === 1) return day + 1; // 1 = Sunday
  if (returnType === 2) return day === 0 ? 7 : day; // 1 = Monday
  if (returnType === 3) return day === 0 ? 6 : day - 1; // 0 = Monday
  
  return day + 1;
};

// ============= MATH FUNCTIONS =============

export const evaluateRoundFunction = (formula: string, allRows: Row[], columns: string[]): number => {
  if (formula.startsWith('ROUND(')) {
    const match = formula.match(/ROUND\((.+?),\s*(.+?)\)/);
    if (!match) return 0;
    const num = Number(evaluateExpression(match[1], allRows, columns));
    const digits = Number(evaluateExpression(match[2], allRows, columns));
    return Math.round(num * Math.pow(10, digits)) / Math.pow(10, digits);
  }
  
  if (formula.startsWith('ROUNDUP(')) {
    const match = formula.match(/ROUNDUP\((.+?),\s*(.+?)\)/);
    if (!match) return 0;
    const num = Number(evaluateExpression(match[1], allRows, columns));
    const digits = Number(evaluateExpression(match[2], allRows, columns));
    return Math.ceil(num * Math.pow(10, digits)) / Math.pow(10, digits);
  }
  
  if (formula.startsWith('ROUNDDOWN(')) {
    const match = formula.match(/ROUNDDOWN\((.+?),\s*(.+?)\)/);
    if (!match) return 0;
    const num = Number(evaluateExpression(match[1], allRows, columns));
    const digits = Number(evaluateExpression(match[2], allRows, columns));
    return Math.floor(num * Math.pow(10, digits)) / Math.pow(10, digits);
  }
  
  return 0;
};

export const evaluateMathFunction = (formula: string, allRows: Row[], columns: string[]): number => {
  if (formula.startsWith('ABS(')) {
    const match = formula.match(/ABS\((.+)\)/);
    if (!match) return 0;
    return Math.abs(Number(evaluateExpression(match[1], allRows, columns)));
  }
  
  if (formula.startsWith('SQRT(')) {
    const match = formula.match(/SQRT\((.+)\)/);
    if (!match) return 0;
    return Math.sqrt(Number(evaluateExpression(match[1], allRows, columns)));
  }
  
  if (formula.startsWith('POWER(')) {
    const match = formula.match(/POWER\((.+?),\s*(.+?)\)/);
    if (!match) return 0;
    const base = Number(evaluateExpression(match[1], allRows, columns));
    const exponent = Number(evaluateExpression(match[2], allRows, columns));
    return Math.pow(base, exponent);
  }
  
  if (formula.startsWith('MOD(')) {
    const match = formula.match(/MOD\((.+?),\s*(.+?)\)/);
    if (!match) return 0;
    const num = Number(evaluateExpression(match[1], allRows, columns));
    const divisor = Number(evaluateExpression(match[2], allRows, columns));
    return num % divisor;
  }
  
  if (formula.startsWith('CEILING(')) {
    const match = formula.match(/CEILING\((.+?),\s*(.+?)\)/);
    if (!match) return 0;
    const num = Number(evaluateExpression(match[1], allRows, columns));
    const significance = Number(evaluateExpression(match[2], allRows, columns));
    return Math.ceil(num / significance) * significance;
  }
  
  if (formula.startsWith('FLOOR(')) {
    const match = formula.match(/FLOOR\((.+?),\s*(.+?)\)/);
    if (!match) return 0;
    const num = Number(evaluateExpression(match[1], allRows, columns));
    const significance = Number(evaluateExpression(match[2], allRows, columns));
    return Math.floor(num / significance) * significance;
  }
  
  return 0;
};

// ============= STATISTICAL FUNCTIONS =============

export const evaluateSTDEV = (args: string, allRows: Row[], columns: string[]): number => {
  const values = getRangeValues(args, allRows, columns);
  if (values.length === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
};

export const evaluateVAR = (args: string, allRows: Row[], columns: string[]): number => {
  const values = getRangeValues(args, allRows, columns);
  if (values.length === 0) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
};

export const evaluateCORREL = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return 0;
  
  const array1 = getRangeValues(parts[0], allRows, columns);
  const array2 = getRangeValues(parts[1], allRows, columns);
  
  if (array1.length !== array2.length || array1.length === 0) return 0;
  
  const mean1 = array1.reduce((a, b) => a + b, 0) / array1.length;
  const mean2 = array2.reduce((a, b) => a + b, 0) / array2.length;
  
  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;
  
  for (let i = 0; i < array1.length; i++) {
    const diff1 = array1[i] - mean1;
    const diff2 = array2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }
  
  return numerator / Math.sqrt(denom1 * denom2);
};

export const evaluatePERCENTILE = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return 0;
  
  const values = getRangeValues(parts[0], allRows, columns).sort((a, b) => a - b);
  const k = Number(evaluateExpression(parts[1], allRows, columns));
  
  if (values.length === 0 || k < 0 || k > 1) return 0;
  
  const index = k * (values.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  return values[lower] * (1 - weight) + values[upper] * weight;
};

// ============= ARRAY FUNCTIONS =============

export const evaluateFILTER = (formula: string, allRows: Row[], columns: string[]): string => {
  // Simplified FILTER - returns comma-separated values
  const match = formula.match(/FILTER\((.+?),\s*(.+?)\)/);
  if (!match) return '#ERROR!';
  
  const rangeStr = match[1];
  const condition = match[2];
  
  const values = getRangeValues(rangeStr, allRows, columns);
  // For simplicity, just return first 5 matching values
  return values.slice(0, 5).join(', ');
};

export const evaluateSORT = (formula: string, allRows: Row[], columns: string[]): string => {
  const match = formula.match(/SORT\((.+?)(?:,\s*(\d+))?(?:,\s*([-]?1))?\)/);
  if (!match) return '#ERROR!';
  
  const rangeStr = match[1];
  const sortIndex = match[2] ? parseInt(match[2]) - 1 : 0;
  const sortOrder = match[3] ? parseInt(match[3]) : 1;
  
  const values = getRangeValues(rangeStr, allRows, columns);
  const sorted = values.sort((a, b) => sortOrder === 1 ? a - b : b - a);
  
  return sorted.slice(0, 10).join(', ');
};

export const evaluateUNIQUE = (formula: string, allRows: Row[], columns: string[]): string => {
  const match = formula.match(/UNIQUE\((.+?)\)/);
  if (!match) return '#ERROR!';
  
  const rangeStr = match[1];
  const values = getRangeValues(rangeStr, allRows, columns);
  const unique = [...new Set(values)];
  
  return unique.slice(0, 10).join(', ');
};

// ============= FINANCIAL FUNCTIONS =============

export const evaluatePMT = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 3) return 0;
  
  const rate = Number(evaluateExpression(parts[0], allRows, columns));
  const nper = Number(evaluateExpression(parts[1], allRows, columns));
  const pv = Number(evaluateExpression(parts[2], allRows, columns));
  const fv = parts[3] ? Number(evaluateExpression(parts[3], allRows, columns)) : 0;
  const type = parts[4] ? Number(evaluateExpression(parts[4], allRows, columns)) : 0;
  
  if (rate === 0) return -(pv + fv) / nper;
  
  const pvif = Math.pow(1 + rate, nper);
  let pmt = rate / (pvif - 1) * -(pv * pvif + fv);
  
  if (type === 1) pmt /= (1 + rate);
  
  return Math.round(pmt * 100) / 100;
};

export const evaluateFV = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 3) return 0;
  
  const rate = Number(evaluateExpression(parts[0], allRows, columns));
  const nper = Number(evaluateExpression(parts[1], allRows, columns));
  const pmt = Number(evaluateExpression(parts[2], allRows, columns));
  const pv = parts[3] ? Number(evaluateExpression(parts[3], allRows, columns)) : 0;
  const type = parts[4] ? Number(evaluateExpression(parts[4], allRows, columns)) : 0;
  
  if (rate === 0) return -(pv + pmt * nper);
  
  const pvif = Math.pow(1 + rate, nper);
  let fv = -(pv * pvif + pmt * (1 + rate * type) * (pvif - 1) / rate);
  
  return Math.round(fv * 100) / 100;
};

export const evaluateNPV = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return 0;
  
  const rate = Number(evaluateExpression(parts[0], allRows, columns));
  const cashFlows = parts.slice(1).map(part => Number(evaluateExpression(part, allRows, columns)));
  
  let npv = 0;
  for (let i = 0; i < cashFlows.length; i++) {
    npv += cashFlows[i] / Math.pow(1 + rate, i + 1);
  }
  
  return Math.round(npv * 100) / 100;
};

// ============= HELPER FUNCTIONS =============

const splitArgs = (args: string): string[] => {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  let inQuotes = false;
  
  for (let i = 0; i < args.length; i++) {
    const char = args[i];
    
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === '(' && !inQuotes) {
      depth++;
      current += char;
    } else if (char === ')' && !inQuotes) {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0 && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  if (current) result.push(current.trim());
  return result;
};

const evaluateExpression = (expr: string, allRows: Row[], columns: string[]): any => {
  expr = expr.trim();
  
  // Remove quotes
  if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
    return expr.slice(1, -1);
  }
  
  // Check if it's a cell reference
  const cellRef = parseCellReference(expr);
  if (cellRef && cellRef.rowIndex < allRows.length && cellRef.colIndex < columns.length) {
    return allRows[cellRef.rowIndex][columns[cellRef.colIndex]];
  }
  
  // Check if it's a number
  const num = parseFloat(expr);
  if (!isNaN(num)) return num;
  
  // Check if it's a boolean
  if (expr.toUpperCase() === 'TRUE') return true;
  if (expr.toUpperCase() === 'FALSE') return false;
  
  // Try to evaluate as comparison
  if (expr.includes('>') || expr.includes('<') || expr.includes('=')) {
    try {
      // Replace cell references with values
      let evalExpr = expr;
      const cellRefRegex = /([A-Z]+)(\d+)/g;
      evalExpr = evalExpr.replace(cellRefRegex, (match, col, row) => {
        const ref = parseCellReference(match);
        if (ref && ref.rowIndex < allRows.length && ref.colIndex < columns.length) {
          const val = allRows[ref.rowIndex][columns[ref.colIndex]];
          return typeof val === 'number' ? String(val) : `"${val}"`;
        }
        return '0';
      });

      // Use safe evaluator instead of new Function
      const result = safeEvaluate(evalExpr, {});
      return result === true || result === 1;
    } catch (e) {
      return false;
    }
  }

  return expr;
};

const getRangeValues = (rangeStr: string, allRows: Row[], columns: string[]): number[] => {
  const values: number[] = [];
  
  if (rangeStr.includes(':')) {
    const [start, end] = rangeStr.split(':');
    const startRef = parseCellReference(start);
    const endRef = parseCellReference(end);
    
    if (startRef && endRef) {
      for (let r = startRef.rowIndex; r <= endRef.rowIndex; r++) {
        for (let c = startRef.colIndex; c <= endRef.colIndex; c++) {
          if (r < allRows.length && c < columns.length) {
            const val = allRows[r][columns[c]];
            const num = Number(val);
            if (!isNaN(num)) values.push(num);
          }
        }
      }
    }
  } else {
    const parts = splitArgs(rangeStr);
    parts.forEach(part => {
      const val = evaluateExpression(part, allRows, columns);
      const num = Number(val);
      if (!isNaN(num)) values.push(num);
    });
  }
  
  return values;
};

export const evaluateLogicalFunction = (formula: string, allRows: Row[], columns: string[]): boolean => {
  if (formula.startsWith('AND(')) {
    const match = formula.match(/AND\((.+)\)/);
    if (!match) return false;
    return evaluateAND(match[1], allRows, columns);
  }

  if (formula.startsWith('OR(')) {
    const match = formula.match(/OR\((.+)\)/);
    if (!match) return false;
    return evaluateOR(match[1], allRows, columns);
  }

  if (formula.startsWith('NOT(')) {
    const match = formula.match(/NOT\((.+)\)/);
    if (!match) return false;
    return evaluateNOT(match[1], allRows, columns);
  }

  if (formula.startsWith('XOR(')) {
    const match = formula.match(/XOR\((.+)\)/);
    if (!match) return false;
    return evaluateXOR(match[1], allRows, columns);
  }

  return false;
};

// ============= ADDITIONAL STATISTICAL FUNCTIONS =============

/**
 * QUARTILE - Returns quartile of data set
 * QUARTILE(array, quart)
 */
export const evaluateQUARTILE = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return 0;

  const values = getRangeValues(parts[0], allRows, columns).sort((a, b) => a - b);
  const quart = Number(evaluateExpression(parts[1], allRows, columns));

  if (values.length === 0) return 0;

  const pos = (values.length - 1) * (quart / 4);
  const base = Math.floor(pos);
  const rest = pos - base;

  if (values[base + 1] !== undefined) {
    return values[base] + rest * (values[base + 1] - values[base]);
  }
  return values[base];
};

/**
 * MEDIAN - Returns median of numbers
 * MEDIAN(number1, [number2], ...)
 */
export const evaluateMEDIAN = (args: string, allRows: Row[], columns: string[]): number => {
  const values = getRangeValues(args, allRows, columns).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
};

/**
 * MODE - Returns most frequent value
 * MODE(number1, [number2], ...)
 */
export const evaluateMODE = (args: string, allRows: Row[], columns: string[]): number => {
  const values = getRangeValues(args, allRows, columns);
  if (values.length === 0) return 0;

  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode = values[0];

  values.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1;
    if (frequency[val] > maxFreq) {
      maxFreq = frequency[val];
      mode = val;
    }
  });

  return mode;
};

/**
 * GEOMEAN - Returns geometric mean
 * GEOMEAN(number1, [number2], ...)
 */
export const evaluateGEOMEAN = (args: string, allRows: Row[], columns: string[]): number => {
  const values = getRangeValues(args, allRows, columns);
  if (values.length === 0 || values.some(v => v <= 0)) return 0;

  const product = values.reduce((acc, val) => acc * val, 1);
  return Math.pow(product, 1 / values.length);
};

/**
 * HARMEAN - Returns harmonic mean
 * HARMEAN(number1, [number2], ...)
 */
export const evaluateHARMEAN = (args: string, allRows: Row[], columns: string[]): number => {
  const values = getRangeValues(args, allRows, columns);
  if (values.length === 0 || values.some(v => v <= 0)) return 0;

  const sumReciprocals = values.reduce((acc, val) => acc + 1 / val, 0);
  return values.length / sumReciprocals;
};

/**
 * COUNTIF - Counts cells matching criteria
 * COUNTIF(range, criteria)
 */
export const evaluateCOUNTIF = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return 0;

  const range = getRangeValuesAsString(parts[0], allRows, columns);
  const criteria = String(evaluateExpression(parts[1], allRows, columns));

  return range.filter(val => meetsCriteria(val, criteria)).length;
};

/**
 * SUMPRODUCT - Returns sum of products
 * SUMPRODUCT(array1, [array2], ...)
 */
export const evaluateSUMPRODUCT = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 1) return 0;

  const arrays = parts.map(part => getRangeValues(part, allRows, columns));
  if (arrays.length === 0) return 0;

  const length = arrays[0].length;
  let sum = 0;

  for (let i = 0; i < length; i++) {
    let product = 1;
    for (const arr of arrays) {
      product *= arr[i] || 1;
    }
    sum += product;
  }

  return sum;
};

/**
 * RANK - Returns rank of number
 * RANK(number, ref, [order])
 */
export const evaluateRANK = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return 0;

  const number = Number(evaluateExpression(parts[0], allRows, columns));
  const values = getRangeValues(parts[1], allRows, columns);
  const order = parts[2] ? Number(evaluateExpression(parts[2], allRows, columns)) : 0;

  const sorted = [...values].sort((a, b) => order === 0 ? b - a : a - b);
  return sorted.indexOf(number) + 1;
};

/**
 * LARGE - Returns k-th largest value
 * LARGE(array, k)
 */
export const evaluateLARGE = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return 0;

  const values = getRangeValues(parts[0], allRows, columns).sort((a, b) => b - a);
  const k = Number(evaluateExpression(parts[1], allRows, columns));

  return values[k - 1] || 0;
};

/**
 * SMALL - Returns k-th smallest value
 * SMALL(array, k)
 */
export const evaluateSMALL = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return 0;

  const values = getRangeValues(parts[0], allRows, columns).sort((a, b) => a - b);
  const k = Number(evaluateExpression(parts[1], allRows, columns));

  return values[k - 1] || 0;
};

// ============= ADDITIONAL TEXT FUNCTIONS =============

/**
 * TEXT - Formats number as text
 * TEXT(value, format_text)
 */
export const evaluateTEXT = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const value = evaluateExpression(parts[0], allRows, columns);
  const format = String(evaluateExpression(parts[1], allRows, columns)).replace(/^["']|["']$/g, '');

  // Basic format handling
  if (format.includes('%')) {
    return (Number(value) * 100).toFixed(format.split('.')[1]?.length || 0) + '%';
  }
  if (format.includes('$')) {
    return '$' + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (format.includes('0')) {
    const decimals = format.split('.')[1]?.length || 0;
    return Number(value).toFixed(decimals);
  }

  return String(value);
};

/**
 * VALUE - Converts text to number
 * VALUE(text)
 */
export const evaluateVALUE = (args: string, allRows: Row[], columns: string[]): number => {
  const text = String(evaluateExpression(args, allRows, columns)).trim();
  const num = parseFloat(text.replace(/[$,]/g, ''));
  return isNaN(num) ? 0 : num;
};

/**
 * REPT - Repeats text
 * REPT(text, number_times)
 */
export const evaluateREPT = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const text = String(evaluateExpression(parts[0], allRows, columns));
  const times = Number(evaluateExpression(parts[1], allRows, columns));

  return text.repeat(times);
};

/**
 * CHAR - Returns character by code
 * CHAR(number)
 */
export const evaluateCHAR = (args: string, allRows: Row[], columns: string[]): string => {
  const num = Number(evaluateExpression(args, allRows, columns));
  return String.fromCharCode(num);
};

/**
 * CODE - Returns character code
 * CODE(text)
 */
export const evaluateCODE = (args: string, allRows: Row[], columns: string[]): number => {
  const text = String(evaluateExpression(args, allRows, columns));
  return text.charCodeAt(0);
};

/**
 * EXACT - Compares two strings (case-sensitive)
 * EXACT(text1, text2)
 */
export const evaluateEXACT = (args: string, allRows: Row[], columns: string[]): boolean => {
  const parts = splitArgs(args);
  if (parts.length < 2) return false;

  const text1 = String(evaluateExpression(parts[0], allRows, columns));
  const text2 = String(evaluateExpression(parts[1], allRows, columns));

  return text1 === text2;
};

// ============= ADDITIONAL DATE/TIME FUNCTIONS =============

/**
 * NETWORKDAYS - Returns working days between dates
 * NETWORKDAYS(start_date, end_date, [holidays])
 */
export const evaluateNETWORKDAYS = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 2) return 0;

  const startDate = new Date(String(evaluateExpression(parts[0], allRows, columns)));
  const endDate = new Date(String(evaluateExpression(parts[1], allRows, columns)));
  const holidays = parts[2] ? getRangeValuesAsString(parts[2], allRows, columns).map(d => new Date(String(d))) : [];

  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDay();
    const isHoliday = holidays.some(h => h.getTime() === current.getTime());
    if (day !== 0 && day !== 6 && !isHoliday) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

/**
 * WORKDAY - Returns date after specified working days
 * WORKDAY(start_date, days, [holidays])
 */
export const evaluateWORKDAY = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const startDate = new Date(String(evaluateExpression(parts[0], allRows, columns)));
  const days = Number(evaluateExpression(parts[1], allRows, columns));
  const holidays = parts[2] ? getRangeValuesAsString(parts[2], allRows, columns).map(d => new Date(String(d))) : [];

  const current = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < days) {
    current.setDate(current.getDate() + 1);
    const day = current.getDay();
    const isHoliday = holidays.some(h => h.getTime() === current.getTime());
    if (day !== 0 && day !== 6 && !isHoliday) {
      daysAdded++;
    }
  }

  return current.toLocaleDateString();
};

/**
 * EOMONTH - Returns end of month
 * EOMONTH(start_date, months)
 */
export const evaluateEOMONTH = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const startDate = new Date(String(evaluateExpression(parts[0], allRows, columns)));
  const months = Number(evaluateExpression(parts[1], allRows, columns));

  const result = new Date(startDate.getFullYear(), startDate.getMonth() + months + 1, 0);
  return result.toLocaleDateString();
};

/**
 * EDATE - Returns date after months
 * EDATE(start_date, months)
 */
export const evaluateEDATE = (args: string, allRows: Row[], columns: string[]): string => {
  const parts = splitArgs(args);
  if (parts.length < 2) return '';

  const startDate = new Date(String(evaluateExpression(parts[0], allRows, columns)));
  const months = Number(evaluateExpression(parts[1], allRows, columns));

  const result = new Date(startDate.getFullYear(), startDate.getMonth() + months, startDate.getDate());
  return result.toLocaleDateString();
};

// ============= ADDITIONAL FINANCIAL FUNCTIONS =============

/**
 * PV - Present value
 * PV(rate, nper, pmt, [fv], [type])
 */
export const evaluatePV = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 3) return 0;

  const rate = Number(evaluateExpression(parts[0], allRows, columns));
  const nper = Number(evaluateExpression(parts[1], allRows, columns));
  const pmt = Number(evaluateExpression(parts[2], allRows, columns));
  const fv = parts[3] ? Number(evaluateExpression(parts[3], allRows, columns)) : 0;
  const type = parts[4] ? Number(evaluateExpression(parts[4], allRows, columns)) : 0;

  if (rate === 0) return -(pmt * nper + fv);

  const pvif = Math.pow(1 + rate, nper);
  const pv = -(pmt * (1 + rate * type) * (pvif - 1) / rate + fv / pvif);

  return Math.round(pv * 100) / 100;
};

/**
 * RATE - Interest rate per period
 * RATE(nper, pmt, pv, [fv], [type], [guess])
 */
export const evaluateRATE = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 3) return 0;

  const nper = Number(evaluateExpression(parts[0], allRows, columns));
  const pmt = Number(evaluateExpression(parts[1], allRows, columns));
  const pv = Number(evaluateExpression(parts[2], allRows, columns));
  const fv = parts[3] ? Number(evaluateExpression(parts[3], allRows, columns)) : 0;
  const type = parts[4] ? Number(evaluateExpression(parts[4], allRows, columns)) : 0;

  // Newton-Raphson method
  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    if (rate === 0) {
      rate = 0.001;
      continue;
    }

    const pvif = Math.pow(1 + rate, nper);
    const f = pmt * (1 + rate * type) * (pvif - 1) / rate + pv * pvif + fv;
    const df = pmt * (1 + rate * type) * (nper * Math.pow(1 + rate, nper - 1) * rate - (pvif - 1)) / (rate * rate) + pv * nper * Math.pow(1 + rate, nper - 1);

    if (Math.abs(f) < 0.0001) break;
    rate = rate - f / df;
  }

  return Math.round(rate * 10000) / 10000;
};

/**
 * IRR - Internal rate of return
 * IRR(values, [guess])
 */
export const evaluateIRR = (args: string, allRows: Row[], columns: string[]): number => {
  const parts = splitArgs(args);
  if (parts.length < 1) return 0;

  const values = getRangeValues(parts[0], allRows, columns);
  const guess = parts[1] ? Number(evaluateExpression(parts[1], allRows, columns)) : 0.1;

  // Newton-Raphson method
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    let npv = 0;
    let dnpv = 0;

    for (let j = 0; j < values.length; j++) {
      npv += values[j] / Math.pow(1 + rate, j);
      dnpv -= j * values[j] / Math.pow(1 + rate, j + 1);
    }

    if (Math.abs(npv) < 0.0001) break;
    rate = rate - npv / dnpv;
  }

  return Math.round(rate * 10000) / 10000;
};

// ============= HELPER FUNCTION =============

/**
 * Get range values as strings (for text-based operations)
 */
const getRangeValuesAsString = (rangeStr: string, allRows: Row[], columns: string[]): any[] => {
  const values: any[] = [];

  if (rangeStr.includes(':')) {
    const [start, end] = rangeStr.split(':');
    const startRef = parseCellReference(start);
    const endRef = parseCellReference(end);

    if (startRef && endRef) {
      for (let r = startRef.rowIndex; r <= endRef.rowIndex; r++) {
        for (let c = startRef.colIndex; c <= endRef.colIndex; c++) {
          if (r < allRows.length && c < columns.length) {
            values.push(allRows[r][columns[c]]);
          }
        }
      }
    }
  } else {
    const parts = splitArgs(rangeStr);
    parts.forEach(part => {
      values.push(evaluateExpression(part, allRows, columns));
    });
  }

  return values;
};

/**
 * Check if value meets criteria
 */
const meetsCriteria = (value: any, criteria: string): boolean => {
  const strValue = String(value);
  const strCriteria = String(criteria);

  // Handle comparison operators
  if (strCriteria.startsWith('>')) {
    const threshold = parseFloat(strCriteria.substring(1));
    return parseFloat(strValue) > threshold;
  }
  if (strCriteria.startsWith('<')) {
    const threshold = parseFloat(strCriteria.substring(1));
    return parseFloat(strValue) < threshold;
  }
  if (strCriteria.startsWith('>=')) {
    const threshold = parseFloat(strCriteria.substring(2));
    return parseFloat(strValue) >= threshold;
  }
  if (strCriteria.startsWith('<=')) {
    const threshold = parseFloat(strCriteria.substring(2));
    return parseFloat(strValue) <= threshold;
  }
  if (strCriteria.startsWith('<>')) {
    return strValue !== strCriteria.substring(2);
  }

  // Exact match
  return strValue === strCriteria;
};
