import { HyperFormula } from 'hyperformula';
import { SheetData, Row } from '../types';
import { excelColToIndex, indexToExcelCol } from './formulaService';
import { isAIFormula, evaluateAIFormula } from './aiFormulas';

/**
 * RealSheet HyperFormula Bridge
 * This service replaces the legacy regex-based formula parser with
 * a high-performance, dependency-aware calculation engine.
 */

const options = {
  licenseKey: 'gpl-v3',
  precisionRounding: 2,
  useArrayArithmetic: true,
  useColumnIndex: true,
};

// Initialize HyperFormula
export const hf = HyperFormula.buildEmpty(options);

/**
 * Maps RealSheet's Row[] structure to a 2D array for HyperFormula
 */
const rowsTo2DArray = (rows: Row[], columns: string[]): any[][] => {
  return rows.map(row => columns.map(col => {
    const val = row[col];
    // If it's a formula, ensure it starts with '='
    if (typeof val === 'string' && val.startsWith('=')) return val;
    return val === null || val === undefined ? '' : val;
  }));
};

/**
 * Synchronizes a RealSheet workbook with HyperFormula
 */
export const syncWorkbook = (sheetData: SheetData) => {
  const sheetName = sheetData.name || 'Sheet1';
  let sheetId = hf.getSheetId(sheetName);

  if (sheetId === undefined) {
    sheetId = hf.addSheet(sheetName);
  }

  const data = rowsTo2DArray(sheetData.rows, sheetData.columns);
  hf.setSheetContent(sheetId, data);
};

/**
 * Evaluates a single cell value using HyperFormula context
 */
export const evaluateWithHF = (
  value: string | number | null,
  rowIndex: number,
  colKey: string,
  sheetData: SheetData
): any => {
  if (value === null || value === undefined) return null;
  const strVal = String(value);

  // Fallback for AI formulas (HyperFormula doesn't support async yet, 
  // so we handle AI formulas externally or as static results)
  if (isAIFormula(strVal)) {
    return "AI-PROCESSING..."; // Placeholder, App.tsx handles the actual async call
  }

  if (!strVal.startsWith('=')) {
    const num = Number(strVal);
    return isNaN(num) || strVal.trim() === '' ? strVal : num;
  }

  const sheetName = sheetData.name || 'Sheet1';
  const sheetId = hf.getSheetId(sheetName);
  if (sheetId === undefined) syncWorkbook(sheetData);

  const colIndex = excelColToIndex(colKey);
  
  // Get the calculated value from HF
  const calculatedValue = hf.getCellValue({ 
    sheet: hf.getSheetId(sheetName)!, 
    col: colIndex, 
    row: rowIndex 
  });

  // Handle HF error types
  if (calculatedValue && typeof calculatedValue === 'object' && 'type' in calculatedValue) {
    return '#VALUE!';
  }

  return calculatedValue;
};

/**
 * Traces all dependencies for a given cell.
 * Useful for the "Neural Lines" visual feature from Nexus.
 */
export const getDependencies = (rowIndex: number, colKey: string, sheetName: string = 'Sheet1') => {
  const sheetId = hf.getSheetId(sheetName);
  if (sheetId === undefined) return [];

  const col = excelColToIndex(colKey);
  return hf.getCellPrecedents({ sheet: sheetId, col, row: rowIndex });
};

/**
 * Batch update: Use this for high-performance updates
 */
export const batchUpdate = (changes: {row: number, col: string, value: any}[], sheetName: string = 'Sheet1') => {
  const sheetId = hf.getSheetId(sheetName);
  if (sheetId === undefined) return;

  hf.batch(() => {
    changes.forEach(change => {
      const colIdx = excelColToIndex(change.col);
      hf.setCellContents({ sheet: sheetId, col: colIdx, row: change.row }, change.value);
    });
  });
};
