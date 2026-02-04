import { DataValidation, ValidationType } from '../types';

export const validateCell = (
  value: any,
  validations: DataValidation[],
  rowIndex: number,
  colIndex: number
): { isValid: boolean; error?: string } => {
  // Find applicable validation for this cell
  const applicableValidation = validations.find(v => {
    const range = parseRange(v.range);
    if (!range) return false;
    
    const { startRow, endRow, startCol, endCol } = range;
    return rowIndex >= startRow && rowIndex <= endRow && 
           colIndex >= startCol && colIndex <= endCol;
  });

  if (!applicableValidation) {
    return { isValid: true };
  }

  const validation = applicableValidation;
  
  switch (validation.type) {
    case 'list':
      if (!validation.criteria.listValues) {
        return { isValid: true };
      }
      const isValidList = validation.criteria.listValues.includes(String(value));
      return {
        isValid: isValidList,
        error: !isValidList ? validation.errorMessage || 'Value not in list' : undefined
      };

    case 'number':
      const numValue = parseFloat(String(value));
      if (isNaN(numValue)) {
        return {
          isValid: false,
          error: validation.errorMessage || 'Must be a number'
        };
      }
      
      if (validation.criteria.operator && validation.criteria.value1 !== undefined) {
        const threshold = parseFloat(String(validation.criteria.value1));
        let isValid = false;
        
        switch (validation.criteria.operator) {
          case '>':
            isValid = numValue > threshold;
            break;
          case '<':
            isValid = numValue < threshold;
            break;
          case '>=':
            isValid = numValue >= threshold;
            break;
          case '<=':
            isValid = numValue <= threshold;
            break;
          case '=':
            isValid = numValue === threshold;
            break;
          case '<>':
            isValid = numValue !== threshold;
            break;
        }
        
        return {
          isValid,
          error: !isValid ? validation.errorMessage || `Number must be ${validation.criteria.operator} ${threshold}` : undefined
        };
      }
      break;

    case 'date':
      const dateValue = new Date(String(value));
      if (isNaN(dateValue.getTime())) {
        return {
          isValid: false,
          error: validation.errorMessage || 'Must be a valid date'
        };
      }
      
      if (validation.criteria.operator && validation.criteria.value1) {
        const thresholdDate = new Date(String(validation.criteria.value1));
        let isValid = false;
        
        switch (validation.criteria.operator) {
          case '>':
            isValid = dateValue > thresholdDate;
            break;
          case '<':
            isValid = dateValue < thresholdDate;
            break;
          case '>=':
            isValid = dateValue >= thresholdDate;
            break;
          case '<=':
            isValid = dateValue <= thresholdDate;
            break;
          case '=':
            isValid = dateValue.toDateString() === thresholdDate.toDateString();
            break;
        }
        
        return {
          isValid,
          error: !isValid ? validation.errorMessage || `Date must be ${validation.criteria.operator} ${thresholdDate.toDateString()}` : undefined
        };
      }
      break;

    case 'textLength':
      const length = String(value).length;
      if (validation.criteria.operator && validation.criteria.value1 !== undefined) {
        const threshold = parseInt(String(validation.criteria.value1));
        let isValid = false;
        
        switch (validation.criteria.operator) {
          case '>':
            isValid = length > threshold;
            break;
          case '<':
            isValid = length < threshold;
            break;
          case '>=':
            isValid = length >= threshold;
            break;
          case '<=':
            isValid = length <= threshold;
            break;
          case '=':
            isValid = length === threshold;
            break;
        }
        
        return {
          isValid,
          error: !isValid ? validation.errorMessage || `Text length must be ${validation.criteria.operator} ${threshold}` : undefined
        };
      }
      break;
  }

  return { isValid: true };
};

const parseRange = (rangeStr: string): { startRow: number; endRow: number; startCol: number; endCol: number } | null => {
  const parts = rangeStr.split(':');
  if (parts.length !== 2) return null;
  
  const startRef = parseCellReference(parts[0]);
  const endRef = parseCellReference(parts[1]);
  
  if (!startRef || !endRef) return null;
  
  return {
    startRow: startRef.rowIndex,
    endRow: endRef.rowIndex,
    startCol: startRef.colIndex,
    endCol: endRef.colIndex
  };
};

const parseCellReference = (ref: string): { rowIndex: number; colIndex: number } | null => {
  const match = ref.toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const colIndex = excelColToIndex(match[1]);
  const rowIndex = parseInt(match[2]) - 1;
  return { rowIndex, colIndex };
};

const excelColToIndex = (colName: string): number => {
  let num = 0;
  for (let i = 0; i < colName.length; i++) {
    num = num * 26 + (colName.charCodeAt(i) - 64);
  }
  return num - 1;
};