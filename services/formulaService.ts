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
 * Evaluates a cell value. If it starts with '=', it tries to parse it as a formula.
 * Supports basic math (+ - * /) and functions SUM, AVG, AVERAGE, MIN, MAX, COUNT over ranges.
 */
export const evaluateCellValue = (value: string | number | null, allRows: Row[], columns: string[]): string | number | null => {
    if (value === null || value === undefined) return null;
    const strVal = String(value);
    
    if (!strVal.startsWith('=')) {
        const num = parseFloat(strVal);
        if (!isNaN(num) && isFinite(num) && strVal.trim() === String(num)) return num;
        return value;
    }

    let formula = strVal.substring(1).toUpperCase(); // Remove '='
    
    try {
        // 1. Handle Range Functions: SUM(A1:B2)
        // Regex looks for FUNCTION(RANGE)
        const rangeFuncRegex = /(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\(([A-Z]+[0-9]+:[A-Z]+[0-9]+)\)/g;

        formula = formula.replace(rangeFuncRegex, (match, funcName, rangeStr) => {
            const values = getValuesFromRange(rangeStr, allRows, columns);
            
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
                default:
                    return '0';
            }
        });

        // 2. Handle Single Cell References (e.g., A1, Z99)
        const cellRegex = /([A-Z]+)([0-9]+)/g;
        
        const parsedFormula = formula.replace(cellRegex, (match, colLetters, rowNumStr) => {
            // Avoid double replacement if the match was part of a function call we just replaced
            // (The previous step replaces the whole function string, so this regex runs on the result)
            
            const rowIdx = parseInt(rowNumStr) - 1;
            const colIndex = excelColToIndex(colLetters);
            
            if (colIndex >= 0 && colIndex < columns.length && rowIdx >= 0 && rowIdx < allRows.length) {
                const colKey = columns[colIndex];
                const cellVal = allRows[rowIdx][colKey];
                
                if (cellVal === null || cellVal === undefined || cellVal === '') return '0';
                // Prevent infinite recursion for simple cases
                if (String(cellVal).startsWith('=')) return '0'; 
                
                const numVal = parseFloat(String(cellVal));
                return isNaN(numVal) ? '0' : String(numVal);
            }
            return '0';
        });

        // 3. Safe evaluation
        // eslint-disable-next-line no-new-func
        const result = new Function(`return (${parsedFormula})`)();
        
        if (typeof result === 'number') {
            return Math.round(result * 10000) / 10000;
        }
        return result;

    } catch (e) {
        return "#ERROR";
    }
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