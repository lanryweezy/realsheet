import { SheetData, FindReplaceOptions, SearchResult } from '../types';

export const findInSheet = (
  sheetData: SheetData,
  options: FindReplaceOptions
): SearchResult[] => {
  const results: SearchResult[] = [];
  const findText = options.matchCase ? options.findText : options.findText.toLowerCase();

  for (let rowIndex = 0; rowIndex < sheetData.rows.length; rowIndex++) {
    const row = sheetData.rows[rowIndex];
    
    for (let colIndex = 0; colIndex < sheetData.columns.length; colIndex++) {
      const colKey = sheetData.columns[colIndex];
      const cellValue = row[colKey];
      
      if (cellValue === null || cellValue === undefined) continue;
      
      let cellText = String(cellValue);
      let searchText = options.matchCase ? cellText : cellText.toLowerCase();
      
      // Check if we should search in values, formulas, or both
      if (options.searchWithin === 'formulas' && !String(cellValue).startsWith('=')) {
        continue;
      }
      
      // Perform the search
      if (options.matchWholeCell) {
        if (searchText === findText) {
          results.push({
            rowIndex,
            colIndex,
            sheetIndex: 0, // Assuming single sheet context for now
            oldValue: String(cellValue)
          });
        }
      } else {
        if (searchText.includes(findText)) {
          results.push({
            rowIndex,
            colIndex,
            sheetIndex: 0,
            oldValue: String(cellValue)
          });
        }
      }
    }
  }
  
  return results;
};

export const replaceInSheet = (
  sheetData: SheetData,
  options: FindReplaceOptions
): { updatedSheet: SheetData, count: number } => {
  let updatedRows = [...sheetData.rows];
  let count = 0;
  
  const findText = options.matchCase ? options.findText : options.findText.toLowerCase();
  
  for (let rowIndex = 0; rowIndex < sheetData.rows.length; rowIndex++) {
    const row = { ...sheetData.rows[rowIndex] };
    let rowUpdated = false;
    
    for (let colIndex = 0; colIndex < sheetData.columns.length; colIndex++) {
      const colKey = sheetData.columns[colIndex];
      const cellValue = row[colKey];
      
      if (cellValue === null || cellValue === undefined) continue;
      
      let cellText = String(cellValue);
      let searchText = options.matchCase ? cellText : cellText.toLowerCase();
      
      // Check if we should search in values, formulas, or both
      if (options.searchWithin === 'formulas' && !String(cellValue).startsWith('=')) {
        continue;
      }
      
      let newValue = cellValue;
      
      if (options.matchWholeCell) {
        if (searchText === findText) {
          newValue = options.replaceText || '';
          rowUpdated = true;
          count++;
        }
      } else {
        if (searchText.includes(findText)) {
          if (options.matchCase) {
            newValue = cellText.replace(new RegExp(findText, 'g'), options.replaceText || '');
          } else {
            // Case-insensitive replace
            newValue = cellText.replace(new RegExp(findText, 'gi'), options.replaceText || '');
          }
          rowUpdated = true;
          count++;
        }
      }
      
      if (newValue !== cellValue) {
        row[colKey] = newValue;
      }
    }
    
    if (rowUpdated) {
      updatedRows[rowIndex] = row;
    }
  }
  
  return {
    updatedSheet: {
      ...sheetData,
      rows: updatedRows
    },
    count
  };
};

export const replaceAllInSheet = (
  sheetData: SheetData,
  options: FindReplaceOptions
): { updatedSheet: SheetData, count: number } => {
  let updatedRows = [...sheetData.rows];
  let count = 0;
  
  const findText = options.matchCase ? options.findText : options.findText.toLowerCase();
  
  for (let rowIndex = 0; rowIndex < sheetData.rows.length; rowIndex++) {
    const row = { ...sheetData.rows[rowIndex] };
    let rowUpdated = false;
    
    for (let colIndex = 0; colIndex < sheetData.columns.length; colIndex++) {
      const colKey = sheetData.columns[colIndex];
      const cellValue = row[colKey];
      
      if (cellValue === null || cellValue === undefined) continue;
      
      let cellText = String(cellValue);
      let searchText = options.matchCase ? cellText : cellText.toLowerCase();
      
      // Check if we should search in values, formulas, or both
      if (options.searchWithin === 'formulas' && !String(cellValue).startsWith('=')) {
        continue;
      }
      
      let newValue = cellValue;
      
      if (options.matchWholeCell) {
        if (searchText === findText) {
          newValue = options.replaceText || '';
          rowUpdated = true;
          count++;
        }
      } else {
        if (searchText.includes(findText)) {
          if (options.matchCase) {
            newValue = cellText.replace(new RegExp(findText, 'g'), options.replaceText || '');
          } else {
            // Case-insensitive replace
            newValue = cellText.replace(new RegExp(findText, 'gi'), options.replaceText || '');
          }
          rowUpdated = true;
          count++;
        }
      }
      
      if (newValue !== cellValue) {
        row[colKey] = newValue;
      }
    }
    
    if (rowUpdated) {
      updatedRows[rowIndex] = row;
    }
  }
  
  return {
    updatedSheet: {
      ...sheetData,
      rows: updatedRows
    },
    count
  };
};