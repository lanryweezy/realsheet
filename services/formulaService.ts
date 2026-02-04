import { Row, SheetData } from '../types';

/**
 * Helper: "A" -> 0, "Z" -> 25, "AA" -> 26
 */
export const excelColToIndex = (colName: string): number => {
    let num = 0;
    for (let i = 0; i < colName.length; i++) {
        num = num * 26 + (colName.charCodeAt(i) - 64);
    }
    return num - 1;
};

/**
 * Helper: 0 -> "A", 25 -> "Z"
 */
export const indexToExcelCol = (index: number): string => {
    let temp = index + 1;
    let colName = '';
    while (temp > 0) {
        let remainder = (temp - 1) % 26;
        colName = String.fromCharCode(65 + remainder) + colName;
        temp = Math.floor((temp - 1) / 26);
    }
    return colName;
};

/**
 * Parses a cell reference like "A1" into { rowIndex, colIndex }
 */
export const parseCellReference = (ref: string): { rowIndex: number, colIndex: number } | null => {
    const match = ref.toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
    if (!match) return null;
    const colIndex = excelColToIndex(match[1]);
    const rowIndex = parseInt(match[2]) - 1;
    return { rowIndex, colIndex };
};

/**
 * Extracts numeric values from a range string like "A1:B5"
 */
const getValuesFromRange = (rangeStr: string, allRows: Row[], columns: string[]): number[] => {
    try {
        const [start, end] = rangeStr.split(':');
        
        // Parse start
        const startMatch = start.match(/([A-Z]+)([0-9]+)/);
        if (!startMatch) return [];
        const startCol = excelColToIndex(startMatch[1]);
        const startRow = parseInt(startMatch[2]) - 1;

        // Parse end
        const endMatch = end.match(/([A-Z]+)([0-9]+)/);
        if (!endMatch) return [];
        const endCol = excelColToIndex(endMatch[1]);
        const endRow = parseInt(endMatch[2]) - 1;

        const values: number[] = [];

        const minRow = Math.min(startRow, endRow);
        const maxRow = Math.max(startRow, endRow);
        const minCol = Math.min(startCol, endCol);
        const maxCol = Math.max(startCol, endCol);

        for (let r = minRow; r <= maxRow; r++) {
            if (r < 0 || r >= allRows.length) continue;
            for (let c = minCol; c <= maxCol; c++) {
                if (c < 0 || c >= columns.length) continue;
                
                const colKey = columns[c];
                const cellVal = allRows[r][colKey];
                
                // Recursively evaluate if needed, or just take value
                // For simplicity, we assume values are already numbers or simple strings
                const num = parseFloat(String(cellVal));
                if (!isNaN(num)) {
                    values.push(num);
                }
            }
        }
        return values;
    } catch (e) {
        return [];
    }
};

/**
 * Enhanced cell evaluation that supports Excel-style formulas
 */
export const evaluateCellValue = (value: string | number | null, allRows: Row[], columns: string[]): string | number | null => {
    if (value === null || value === undefined) return null;
    const strVal = String(value);
    
    // Handle formulas starting with =
    if (strVal.startsWith('=')) {
        return evaluateFormula(strVal.substring(1), allRows, columns);
    }
    
    // Handle numbers
    if (!isNaN(Number(strVal)) && strVal.trim() !== '') {
        return Number(strVal);
    }
    
    // Handle booleans
    if (strVal.toLowerCase() === 'true') return 1;
    if (strVal.toLowerCase() === 'false') return 0;
    
    return strVal;
};

const evaluateFormula = (formula: string, allRows: Row[], columns: string[]): any => {
    try {
        // Clean formula
        let cleanedFormula = formula.trim().toUpperCase();
        
        // Handle range functions like SUM(A1:B2)
        const rangeFuncRegex = /(SUM|AVG|AVERAGE|MIN|MAX|COUNT|SUMIF)\(([A-Z]+\d+:[A-Z]+\d+(?:,\s*[A-Z]+\d+:[A-Z]+\d+)*)\)/gi;
        
        cleanedFormula = cleanedFormula.replace(rangeFuncRegex, (match, funcName, rangeStr) => {
            const ranges = rangeStr.split(',').map(r => r.trim());
            let result = 0;
            
            if (funcName === 'SUMIF') {
                // Handle SUMIF(A1:A10,">5",B1:B10)
                if (ranges.length >= 2) {
                    const conditionRange = ranges[0];
                    const condition = ranges[1];
                    const sumRange = ranges[2] || conditionRange; // If no sum range, use condition range
                    
                    const [startRef, endRef] = parseRange(conditionRange);
                    const [sumStartRef, sumEndRef] = parseRange(sumRange);
                    
                    if (startRef && endRef && sumStartRef && sumEndRef) {
                        let sum = 0;
                        let conditionCol = 0;
                        let sumCol = 0;
                        
                        for (let row = startRef.rowIndex; row <= endRef.rowIndex; row++) {
                            if (row < allRows.length) {
                                const conditionValue = allRows[row][columns[startRef.colIndex]];
                                
                                // Check if condition is met
                                if (meetsCondition(conditionValue, condition)) {
                                    // Add corresponding value from sum range
                                    const sumRow = row - startRef.rowIndex + sumStartRef.rowIndex;
                                    if (sumRow < allRows.length) {
                                        const sumValue = allRows[sumRow][columns[sumStartRef.colIndex]];
                                        const numValue = parseFloat(String(sumValue));
                                        if (!isNaN(numValue)) {
                                            sum += numValue;
                                        }
                                    }
                                }
                            }
                        }
                        return String(sum);
                    }
                }
            } else {
                // Handle regular range functions
                for (const range of ranges) {
                    const [startRef, endRef] = parseRange(range);
                    if (startRef && endRef) {
                        const values = getValuesFromRangeRef(startRef, endRef, allRows, columns);
                        
                        if (values.length === 0 && funcName !== 'COUNT') return '0';
                        
                        switch (funcName) {
                            case 'SUM':
                                return String(values.reduce((a, b) => a + b, 0));
                            case 'AVG':
                            case 'AVERAGE':
                                return String(values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
                            case 'MAX':
                                return String(values.length ? Math.max(...values) : 0);
                            case 'MIN':
                                return String(values.length ? Math.min(...values) : 0);
                            case 'COUNT':
                                return String(values.length);
                        }
                    }
                }
            }
        });

        // Handle cell references like A1, B2
        const cellRefRegex = /([A-Z]+)(\d+)/g;
        cleanedFormula = cleanedFormula.replace(cellRefRegex, (match, colLetters, rowNumStr) => {
            const rowIdx = parseInt(rowNumStr) - 1;
            const colIdx = excelColToIndex(colLetters);
            
            if (colIdx >= 0 && colIdx < columns.length && rowIdx >= 0 && rowIdx < allRows.length) {
                const cellValue = allRows[rowIdx][columns[colIdx]];
                if (cellValue === null || cellValue === undefined || cellValue === '') return '0';
                
                const numValue = parseFloat(String(cellValue));
                return isNaN(numValue) ? '0' : String(numValue);
            }
            return '0';
        });

        // Evaluate the resulting expression
        // eslint-disable-next-line no-new-func
        const evaluated = new Function(`return (${cleanedFormula})`)();
        return typeof evaluated === 'number' ? Math.round(evaluated * 10000) / 10000 : evaluated;
    } catch (e) {
        return "#ERROR!";
    }
};

const parseRange = (rangeStr: string): [{ rowIndex: number; colIndex: number } | null, { rowIndex: number; colIndex: number } | null] => {
    const parts = rangeStr.split(':');
    if (parts.length !== 2) return [null, null];
    
    return [parseCellReference(parts[0]), parseCellReference(parts[1])];
};

const getValuesFromRangeRef = (
    startRef: { rowIndex: number; colIndex: number },
    endRef: { rowIndex: number; colIndex: number },
    allRows: Row[],
    columns: string[]
): number[] => {
    const values: number[] = [];
    
    for (let r = startRef.rowIndex; r <= endRef.rowIndex; r++) {
        for (let c = startRef.colIndex; c <= endRef.colIndex; c++) {
            if (r < allRows.length && c < columns.length) {
                const cellValue = allRows[r][columns[c]];
                if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                    const numValue = parseFloat(String(cellValue));
                    if (!isNaN(numValue)) {
                        values.push(numValue);
                    }
                }
            }
        }
    }
    
    return values;
};

const meetsCondition = (value: any, condition: string): boolean => {
    const strValue = String(value);
    const strCondition = String(condition).trim();
    
    // Handle conditions like ">5", "<=10", "=text", etc.
    if (strCondition.startsWith('>=')) {
        const threshold = parseFloat(strCondition.substring(2));
        return parseFloat(strValue) >= threshold;
    }
    if (strCondition.startsWith('<=')) {
        const threshold = parseFloat(strCondition.substring(2));
        return parseFloat(strValue) <= threshold;
    }
    if (strCondition.startsWith('>')) {
        const threshold = parseFloat(strCondition.substring(1));
        return parseFloat(strValue) > threshold;
    }
    if (strCondition.startsWith('<')) {
        const threshold = parseFloat(strCondition.substring(1));
        return parseFloat(strValue) < threshold;
    }
    if (strCondition.startsWith('=')) {
        const target = strCondition.substring(1);
        return strValue === target;
    }
    
    // Default: exact match
    return strValue === strCondition;
};

/**
 * Performs a Goal Seek operation.
 * Finds the value of `changingCellRef` that makes `targetCellRef` equal to `targetValue`.
 */
export const goalSeek = (
    targetRef: string,
    targetValue: number,
    changingRef: string,
    data: SheetData
): { success: boolean, newValue: number, error?: string } => {
    const target = parseCellReference(targetRef);
    const changing = parseCellReference(changingRef);

    if (!target || !changing) return { success: false, newValue: 0, error: "Invalid cell reference" };
    
    // Bounds check
    if (target.rowIndex >= data.rows.length || target.colIndex >= data.columns.length) return { success: false, newValue: 0, error: "Target cell out of bounds" };
    if (changing.rowIndex >= data.rows.length || changing.colIndex >= data.columns.length) return { success: false, newValue: 0, error: "Changing cell out of bounds" };

    const targetColKey = data.columns[target.colIndex];
    const changingColKey = data.columns[changing.colIndex];
    
    // Check if target is formula
    const targetRaw = data.rows[target.rowIndex][targetColKey];
    if (!String(targetRaw).startsWith('=')) {
         return { success: false, newValue: 0, error: "Target cell must contain a formula" };
    }

    // Solver Settings
    const MAX_ITERATIONS = 100;
    const EPSILON = 0.001;
    
    // Initial Value
    let x0 = Number(data.rows[changing.rowIndex][changingColKey]);
    if (isNaN(x0)) x0 = 0;

    // Helper to evaluate function f(x)
    // f(x) is the value of target cell when changing cell = x
    const evaluateAt = (x: number): number => {
        // Create a shallow copy of the changing row to inject x
        // We can reuse the rest of the rows array references since evaluateCellValue only reads
        const tempRows = [...data.rows];
        tempRows[changing.rowIndex] = { ...tempRows[changing.rowIndex], [changingColKey]: x };
        
        const res = evaluateCellValue(targetRaw, tempRows, data.columns);
        return Number(res) || 0;
    };

    let y0 = evaluateAt(x0);
    if (Math.abs(y0 - targetValue) < EPSILON) return { success: true, newValue: x0 };

    // Secant Method Initialization
    // Perturb x0 slightly to get x1
    let x1 = x0 + (Math.abs(x0) < 0.1 ? 0.1 : x0 * 0.01);
    let y1 = evaluateAt(x1);

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        if (Math.abs(y1 - targetValue) < EPSILON) {
            return { success: true, newValue: x1 };
        }
        
        if (Math.abs(y1 - y0) < 1e-9) {
            // Slope is zero, cannot proceed with Secant. Try random jump.
             x1 = x1 + 1;
             y1 = evaluateAt(x1);
             continue;
        }

        // x_next = x1 - (y1 - target) * (x1 - x0) / (y1 - y0)
        const x_next = x1 - (y1 - targetValue) * (x1 - x0) / (y1 - y0);
        
        x0 = x1;
        y0 = y1;
        x1 = x_next;
        y1 = evaluateAt(x1);
    }

    return { success: false, newValue: x1, error: "Could not converge" };
};

// Advanced Excel-like formulas
export const evaluateAdvancedFormula = (formula: string, sheetData: SheetData, currentRow: number): any => {
  if (!formula.startsWith('=')) return formula;
  
  const expression = formula.substring(1).toUpperCase();
  
  try {
    // SUMIF(range, criteria, [sum_range])
    if (expression.startsWith('SUMIF(')) {
      return evaluateSUMIF(expression, sheetData, currentRow);
    }
    
    // VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
    if (expression.startsWith('VLOOKUP(')) {
      return evaluateVLOOKUP(expression, sheetData, currentRow);
    }
    
    // INDEX(array, row_num, [column_num])
    if (expression.startsWith('INDEX(')) {
      return evaluateINDEX(expression, sheetData, currentRow);
    }
    
    // MATCH(lookup_value, lookup_array, [match_type])
    if (expression.startsWith('MATCH(')) {
      return evaluateMATCH(expression, sheetData, currentRow);
    }
    
    // Fallback to basic evaluation
    return evaluateCellValue(formula, sheetData.rows, sheetData.columns);
  } catch (error) {
    console.error('Formula evaluation error:', error);
    return '#ERROR!';
  }
};

const evaluateSUMIF = (expression: string, sheetData: SheetData, currentRow: number): number => {
  // Parse: SUMIF(A1:A10, ">5", B1:B10)
  const match = expression.match(/SUMIF\(([^,]+),\s*("[^"]*"|'[^']*'|[^,]+)(?:,\s*([^)]+))?\)/);
  if (!match) throw new Error('Invalid SUMIF syntax');
  
  const [_, range, criteria, sumRange] = match;
  
  // Parse range (e.g., "A1:A10")
  const rangeParts = range.split(':');
  if (rangeParts.length !== 2) throw new Error('Invalid range format');
  
  const startRef = parseCellReference(rangeParts[0]);
  const endRef = parseCellReference(rangeParts[1]);
  if (!startRef || !endRef) throw new Error('Invalid cell references');
  
  // Parse criteria
  let criteriaValue = criteria;
  if (criteria.startsWith('"') && criteria.endsWith('"')) {
    criteriaValue = criteria.slice(1, -1);
  }
  
  // Get values in range
  const values: any[] = [];
  for (let row = startRef.rowIndex; row <= endRef.rowIndex; row++) {
    for (let col = startRef.colIndex; col <= endRef.colIndex; col++) {
      if (row < sheetData.rows.length && col < sheetData.columns.length) {
        const colName = sheetData.columns[col];
        values.push(sheetData.rows[row][colName]);
      }
    }
  }
  
  // Apply criteria and sum
  let sum = 0;
  values.forEach(value => {
    if (meetsCriteria(value, criteriaValue)) {
      sum += Number(value) || 0;
    }
  });
  
  return sum;
};

const evaluateVLOOKUP = (expression: string, sheetData: SheetData, currentRow: number): any => {
  // Parse: VLOOKUP(lookup_value, table_array, col_index_num, [range_lookup])
  const match = expression.match(/VLOOKUP\(([^,]+),\s*([^,]+),\s*(\d+)(?:,\s*([^)]+))?\)/);
  if (!match) throw new Error('Invalid VLOOKUP syntax');
  
  const [_, lookupValue, tableArray, colIndexStr, rangeLookup] = match;
  const colIndex = parseInt(colIndexStr) - 1; // Convert to 0-based
  
  // Parse table array range
  const rangeParts = tableArray.split(':');
  if (rangeParts.length !== 2) throw new Error('Invalid table array format');
  
  const startRef = parseCellReference(rangeParts[0]);
  const endRef = parseCellReference(rangeParts[1]);
  if (!startRef || !endRef) throw new Error('Invalid cell references');
  
  // Find matching row
  for (let row = startRef.rowIndex; row <= endRef.rowIndex; row++) {
    if (row < sheetData.rows.length) {
      const firstColName = sheetData.columns[startRef.colIndex];
      const cellValue = sheetData.rows[row][firstColName];
      
      if (String(cellValue) === lookupValue) {
        // Return value from specified column
        if (colIndex < sheetData.columns.length) {
          const targetColName = sheetData.columns[startRef.colIndex + colIndex];
          return sheetData.rows[row][targetColName];
        }
      }
    }
  }
  
  return '#N/A';
};

const evaluateINDEX = (expression: string, sheetData: SheetData, currentRow: number): any => {
  // Parse: INDEX(array, row_num, [column_num])
  const match = expression.match(/INDEX\(([^,]+),\s*(\d+)(?:,\s*(\d+))?\)/);
  if (!match) throw new Error('Invalid INDEX syntax');
  
  const [_, array, rowStr, colStr] = match;
  const rowIndex = parseInt(rowStr) - 1; // Convert to 0-based
  const colIndex = colStr ? parseInt(colStr) - 1 : 0;
  
  // Parse array range
  const rangeParts = array.split(':');
  if (rangeParts.length !== 2) throw new Error('Invalid array format');
  
  const startRef = parseCellReference(rangeParts[0]);
  if (!startRef) throw new Error('Invalid cell reference');
  
  const targetRow = startRef.rowIndex + rowIndex;
  const targetCol = startRef.colIndex + colIndex;
  
  if (targetRow < sheetData.rows.length && targetCol < sheetData.columns.length) {
    const colName = sheetData.columns[targetCol];
    return sheetData.rows[targetRow][colName];
  }
  
  return '#REF!';
};

const evaluateMATCH = (expression: string, sheetData: SheetData, currentRow: number): number => {
  // Parse: MATCH(lookup_value, lookup_array, [match_type])
  const match = expression.match(/MATCH\(([^,]+),\s*([^,]+)(?:,\s*([^)]+))?\)/);
  if (!match) throw new Error('Invalid MATCH syntax');
  
  const [_, lookupValue, lookupArray, matchTypeStr] = match;
  const matchType = matchTypeStr ? parseInt(matchTypeStr) : 1;
  
  // Parse lookup array range
  const rangeParts = lookupArray.split(':');
  if (rangeParts.length !== 2) throw new Error('Invalid lookup array format');
  
  const startRef = parseCellReference(rangeParts[0]);
  const endRef = parseCellReference(rangeParts[1]);
  if (!startRef || !endRef) throw new Error('Invalid cell references');
  
  // Get values in lookup array
  const values: { value: any; rowIndex: number }[] = [];
  for (let row = startRef.rowIndex; row <= endRef.rowIndex; row++) {
    if (row < sheetData.rows.length) {
      const colName = sheetData.columns[startRef.colIndex];
      values.push({ value: sheetData.rows[row][colName], rowIndex: row });
    }
  }
  
  // Find match based on match type
  switch (matchType) {
    case 1: // Exact match or next smallest
      for (let i = 0; i < values.length; i++) {
        if (String(values[i].value) === lookupValue) {
          return i + 1; // 1-based index
        }
      }
      break;
    case 0: // Exact match only
      for (let i = 0; i < values.length; i++) {
        if (String(values[i].value) === lookupValue) {
          return i + 1; // 1-based index
        }
      }
      break;
    case -1: // Exact match or next largest
      for (let i = values.length - 1; i >= 0; i--) {
        if (String(values[i].value) === lookupValue) {
          return i + 1; // 1-based index
        }
      }
      break;
  }
  
  return '#N/A';
};

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
  
  // Exact match
  return strValue === strCriteria;
};
