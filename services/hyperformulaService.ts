import { HyperFormula } from 'hyperformula';
import { SheetData, Row } from '../types';
import { excelColToIndex } from './formulaService';
import { isAIFormula } from './aiFormulas';

const options = {
  licenseKey: 'gpl-v3',
  precisionRounding: 2,
  useArrayArithmetic: true,
  useColumnIndex: true,
};

export const hf = HyperFormula.buildEmpty(options);

const rowsTo2DArray = (rows: Row[], columns: string[]): any[][] => {
  return rows.map(row => columns.map(col => {
    const val = row[col];
    if (typeof val === 'string' && val.startsWith('=')) return val;
    return val === null || val === undefined ? '' : val;
  }));
};

const getSheetIdSafe = (name: string | undefined): number => {
  const sheetName = name || 'Sheet1';
  const id = hf.getSheetId(sheetName);
  if (typeof id === 'number') return id;

  const names = hf.getSheetNames();
  if (names.length > 0) {
      const firstId = hf.getSheetId(names[0]);
      if (typeof firstId === 'number') return firstId;
  }

  return hf.addSheet(sheetName);
};

export const syncWorkbook = (sheetData: SheetData): number => {
  if (!sheetData) return 0;
  const sheetName = sheetData.name || 'Sheet1';
  let sheetId = hf.getSheetId(sheetName);

  if (typeof sheetId !== 'number') {
    sheetId = hf.addSheet(sheetName);
  }

  if (typeof sheetId === 'number') {
    const data = rowsTo2DArray(sheetData.rows, sheetData.columns);
    hf.setSheetContent(sheetId, data);
    return sheetId;
  }
  return 0;
};

export const evaluateWithHF = (
  value: string | number | null,
  rowIndex: number,
  colKey: string,
  sheetData: SheetData
): any => {
  if (value === null || value === undefined) return null;
  if (!sheetData) return value;

  const strVal = String(value);
  if (isAIFormula(strVal)) return "AI-PROCESSING...";

  if (!strVal.startsWith('=')) {
    const num = Number(strVal);
    return isNaN(num) || strVal.trim() === '' ? strVal : num;
  }

  const sheetId = getSheetIdSafe(sheetData.name);
  const colIndex = excelColToIndex(colKey);
  
  try {
    const calculatedValue = hf.getCellValue({
      sheet: sheetId,
      col: colIndex,
      row: rowIndex
    });

    if (calculatedValue && typeof calculatedValue === 'object' && 'type' in (calculatedValue as any)) {
      return '#VALUE!';
    }

    return calculatedValue;
  } catch (e) {
    return '#ERROR!';
  }
};

export const getDependencies = (rowIndex: number, colKey: string, sheetName: string | undefined) => {
  try {
    const sheetId = getSheetIdSafe(sheetName);
    const col = excelColToIndex(colKey);
    const precedents = hf.getCellPrecedents({ sheet: sheetId, col, row: rowIndex });
    return precedents || [];
  } catch (e) {
    return [];
  }
};

export const batchUpdate = (changes: {row: number, col: string, value: any}[], sheetName: string | undefined) => {
  try {
    const sheetId = getSheetIdSafe(sheetName);
    hf.batch(() => {
      changes.forEach(change => {
        const colIdx = excelColToIndex(change.col);
        hf.setCellContents({ sheet: sheetId, col: colIdx, row: change.row }, change.value);
      });
    });
  } catch (e) {}
};
