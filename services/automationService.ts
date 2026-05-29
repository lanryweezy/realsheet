import { SheetData, Row } from '../types';
import { Statistics, MLModels } from './dataScience';

export interface AutomationSuggestion {
  id: string;
  type: 'repetitive_edit' | 'pattern_detected' | 'data_cleanup' | 'formatting' | 'visualization' | 'insight';
  title: string;
  description: string;
  action: string;
  confidence: number;
  metadata?: any;
}

export const detectTrends = (sheetData: SheetData): AutomationSuggestion[] => {
  const suggestions: AutomationSuggestion[] = [];

  sheetData.columns.forEach(col => {
    const values = sheetData.rows
      .map(row => Number(row[col]))
      .filter(val => !isNaN(val));

    if (values.length > 5) {
      const xValues = Array.from({ length: values.length }, (_, i) => i);
      const regression = MLModels.linearRegression(xValues, values);

      // If R-squared is high (simplified check here) and slope is significant
      if (Math.abs(regression.slope) > 0.1) {
        const trend = regression.slope > 0 ? 'upward' : 'downward';
        suggestions.push({
          id: `trend_${col}`,
          type: 'insight',
          title: `Detected ${trend} trend in ${col}`,
          description: `The values in "${col}" show a consistent ${trend} trend. Would you like to see a forecast?`,
          action: `forecast_${col}`,
          confidence: 0.85,
          metadata: { slope: regression.slope }
        });
      }
    }
  });

  return suggestions;
};

export const detectOutliers = (sheetData: SheetData): AutomationSuggestion[] => {
  const suggestions: AutomationSuggestion[] = [];

  sheetData.columns.forEach(col => {
    const values = sheetData.rows
      .map(row => Number(row[col]))
      .filter(val => !isNaN(val));

    if (values.length > 10) {
      const anomalies = MLModels.detectAnomalies(values);
      if (anomalies.indices.length > 0) {
        suggestions.push({
          id: `outliers_${col}`,
          type: 'data_cleanup',
          title: `Found potential outliers in ${col}`,
          description: `I detected ${anomalies.indices.length} values that seem unusual in "${col}". Should I highlight them?`,
          action: `highlight_outliers_${col}`,
          confidence: 0.8,
          metadata: { indices: anomalies.indices }
        });
      }
    }
  });

  return suggestions;
};

export const detectDuplicates = (sheetData: SheetData): AutomationSuggestion[] => {
  const suggestions: AutomationSuggestion[] = [];
  const rowStrings = sheetData.rows.map(row => JSON.stringify(row));
  const uniqueRows = new Set(rowStrings);

  const duplicateCount = rowStrings.length - uniqueRows.size;

  if (duplicateCount > 0) {
    suggestions.push({
      id: 'duplicates',
      type: 'data_cleanup',
      title: 'Duplicate rows detected',
      description: `I found ${duplicateCount} duplicate rows in your sheet. Would you like to remove them?`,
      action: 'remove_duplicates',
      confidence: 0.95
    });
  }

  return suggestions;
};

export const suggestVisualizations = (sheetData: SheetData): AutomationSuggestion[] => {
  const suggestions: AutomationSuggestion[] = [];

  // Detect if there is a 'Date' or 'Time' column and a numeric column
  const dateCol = sheetData.columns.find(col => col.toLowerCase().includes('date') || col.toLowerCase().includes('time'));
  const numericCols = sheetData.columns.filter(col => {
    const sample = sheetData.rows.slice(0, 5).map(row => Number(row[col])).filter(val => !isNaN(val));
    return sample.length > 0;
  });

  if (dateCol && numericCols.length > 0) {
    suggestions.push({
      id: 'viz_timeseries',
      type: 'visualization',
      title: 'Time Series Chart',
      description: `I can create a time series chart showing ${numericCols[0]} over ${dateCol}.`,
      action: 'create_timeseries_chart',
      confidence: 0.9
    });
  }

  // Correlation detection
  if (numericCols.length >= 2) {
    suggestions.push({
      id: 'viz_correlation',
      type: 'visualization',
      title: 'Correlation Analysis',
      description: `Should I analyze the correlation between ${numericCols.slice(0, 2).join(' and ')}?`,
      action: 'analyze_correlation',
      confidence: 0.75
    });
  }

  return suggestions;
};

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
    let types = new Set();

    sheetData.rows.forEach(row => {
      const val = row[col];
      if (val === "" || val === null || val === undefined) emptyCount++;
      else types.add(typeof val);
    });

    if (emptyCount > sheetData.rows.length * 0.1 && sheetData.rows.length > 10) {
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
    ...detectTrends(sheetData),
    ...detectOutliers(sheetData),
    ...detectDuplicates(sheetData),
    ...suggestVisualizations(sheetData),
    ...detectRepetitiveEdits(history),
    ...suggestDataCleaning(sheetData)
  ];
};
