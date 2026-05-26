import { SheetData, Row } from '../types';

export interface AutomationSuggestion {
  id: string;
  type: 'repetitive_edit' | 'pattern_detected' | 'data_cleanup' | 'formatting';
  title: string;
  description: string;
  action: string;
  confidence: number;
}

export const detectRepetitiveEdits = (history: SheetData[]): AutomationSuggestion[] => {
  if (history.length < 5) return [];

  const suggestions: AutomationSuggestion[] = [];

  // Logic to detect repetitive patterns in edits
  // e.g., user updates a "Status" column every Monday

  // This is a placeholder for more complex pattern recognition
  return suggestions;
};

export const suggestDataCleaning = (sheetData: SheetData): AutomationSuggestion[] => {
  const suggestions: AutomationSuggestion[] = [];

  sheetData.columns.forEach(col => {
    let emptyCount = 0;
    let inconsistentTypes = 0;
    let types = new Set();

    sheetData.rows.forEach(row => {
      const val = row[col];
      if (val === "" || val === null) emptyCount++;
      else types.add(typeof val);
    });

    if (emptyCount > sheetData.rows.length * 0.2) {
      suggestions.push({
        id: `clean_${col}`,
        type: 'data_cleanup',
        title: `Fill empty cells in ${col}`,
        description: `I noticed ${emptyCount} empty cells in the "${col}" column. Want me to predict these values?`,
        action: `fill_empty_${col}`,
        confidence: 0.8
      });
    }

    if (types.size > 1) {
       suggestions.push({
        id: `format_${col}`,
        type: 'data_cleanup',
        title: `Standardize ${col}`,
        description: `The "${col}" column contains inconsistent data types (e.g., text and numbers). Should I standardize it?`,
        action: `standardize_${col}`,
        confidence: 0.9
      });
    }
  });

  return suggestions;
};

export const suggestAutomations = (sheetData: SheetData, history: SheetData[]): AutomationSuggestion[] => {
  return [
    ...detectRepetitiveEdits(history),
    ...suggestDataCleaning(sheetData)
  ];
};
