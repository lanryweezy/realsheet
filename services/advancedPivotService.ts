/**
 * Advanced Pivot Table & Chart Service
 * Enhanced pivot functionality with charts, slicers, and timelines
 */

import { SheetData, Row, ChartConfig } from '../types';

export interface PivotField {
  field: string;
  operation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last';
}

export interface PivotConfig {
  rowFields: string[];
  columnFields: string[];
  valueFields: PivotField[];
  filterFields?: Record<string, any>; // Slicer filters
  dateField?: string; // For timeline
  dateRange?: { start: string; end: string }; // Timeline range
}

export interface PivotResult {
  columns: string[];
  rows: Row[];
  chartConfigs?: ChartConfig[];
}

/**
 * Create advanced pivot table with multiple row/column fields
 */
export const createAdvancedPivot = (
  data: SheetData,
  config: PivotConfig
): PivotResult => {
  const { rowFields, columnFields, valueFields, filterFields = {}, dateField, dateRange } = config;

  // Apply filters (slicers)
  let filteredRows = data.rows;
  
  if (Object.keys(filterFields).length > 0) {
    filteredRows = data.rows.filter(row => {
      return Object.entries(filterFields).every(([field, allowedValues]) => {
        if (!Array.isArray(allowedValues)) return true;
        return allowedValues.includes(row[field]);
      });
    });
  }

  // Apply date range filter (timeline)
  if (dateField && dateRange) {
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    filteredRows = filteredRows.filter(row => {
      const date = new Date(row[dateField] as string);
      return date >= startDate && date <= endDate;
    });
  }

  // Group data
  const groups: Map<string, Map<string, Row[]>> = new Map();

  filteredRows.forEach(row => {
    // Create row key
    const rowKey = rowFields.map(f => String(row[f] || '(Blank)')).join(' | ');
    
    // Create column key
    const colKey = columnFields.length > 0 
      ? columnFields.map(f => String(row[f] || '(Blank)')).join(' | ')
      : 'Values';

    if (!groups.has(rowKey)) {
      groups.set(rowKey, new Map());
    }
    
    const rowGroup = groups.get(rowKey)!;
    if (!rowGroup.has(colKey)) {
      rowGroup.set(colKey, []);
    }
    
    rowGroup.get(colKey)!.push(row);
  });

  // Build pivot result
  const resultColumns = [
    ...rowFields,
    ...columnFields.length > 0 ? columnFields.map(f => `${f} Value`) : [],
    ...valueFields.map(v => `${v.operation}(${v.field})`)
  ];

  const resultRows: Row[] = [];

  groups.forEach((colGroups, rowKey) => {
    colGroups.forEach((groupRows, colKey) => {
      const resultRow: Row = {};
      
      // Add row field values
      rowFields.forEach((field, i) => {
        resultRow[field] = rowKey.split(' | ')[i];
      });

      // Add aggregated values
      valueFields.forEach(valueField => {
        const values = groupRows.map(r => Number(r[valueField.field]) || 0);
        const aggregated = aggregate(values, valueField.operation);
        resultRow[`${valueField.operation}(${valueField.field})`] = aggregated;
      });

      resultRows.push(resultRow);
    });
  });

  // Generate chart configs
  const chartConfigs: ChartConfig[] = [];
  
  if (rowFields.length > 0 && valueFields.length > 0) {
    chartConfigs.push({
      type: 'bar',
      dataKey: `${valueFields[0].operation}(${valueFields[0].field})`,
      xAxisKey: rowFields[0],
      title: `Pivot Chart: ${valueFields[0].operation} by ${rowFields[0]}`,
      description: 'Aggregated view of pivot data'
    });
  }

  return {
    columns: resultColumns,
    rows: resultRows,
    chartConfigs
  };
};

/**
 * Aggregate values based on operation
 */
const aggregate = (values: number[], operation: string): number => {
  if (values.length === 0) return 0;

  switch (operation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count':
      return values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'first':
      return values[0];
    case 'last':
      return values[values.length - 1];
    default:
      return values.reduce((a, b) => a + b, 0);
  }
};

/**
 * Create slicer options for a field
 */
export const createSlicerOptions = (data: SheetData, field: string): Array<{ value: any; count: number }> => {
  const counts: Map<any, number> = new Map();

  data.rows.forEach(row => {
    const value = row[field];
    counts.set(value, (counts.get(value) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => String(a.value).localeCompare(String(b.value)));
};

/**
 * Create timeline data for date field
 */
export const createTimelineData = (
  data: SheetData,
  dateField: string
): { min: string; max: string; groups: Array<{ date: string; count: number }> } => {
  const dates = data.rows
    .map(row => new Date(row[dateField] as string))
    .filter(d => !isNaN(d.getTime()));

  if (dates.length === 0) {
    return { min: '', max: '', groups: [] };
  }

  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // Group by month
  const groups: Map<string, number> = new Map();
  dates.forEach(date => {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  });

  return {
    min: minDate.toISOString().split('T')[0],
    max: maxDate.toISOString().split('T')[0],
    groups: Array.from(groups.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  };
};

/**
 * Apply slicer filter to data
 */
export const applySlicerFilter = (
  data: SheetData,
  field: string,
  selectedValues: any[]
): SheetData => {
  if (selectedValues.length === 0) return data;

  return {
    ...data,
    rows: data.rows.filter(row => selectedValues.includes(row[field]))
  };
};

/**
 * Apply timeline filter to data
 */
export const applyTimelineFilter = (
  data: SheetData,
  dateField: string,
  startDate: string,
  endDate: string
): SheetData => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return {
    ...data,
    rows: data.rows.filter(row => {
      const date = new Date(row[dateField] as string);
      return date >= start && date <= end;
    })
  };
};

/**
 * Get pivot table summary statistics
 */
export const getPivotSummary = (pivotResult: PivotResult): {
  totalRows: number;
  totalColumns: number;
  uniqueRowGroups: number;
  uniqueColumnGroups: number;
} => {
  return {
    totalRows: pivotResult.rows.length,
    totalColumns: pivotResult.columns.length,
    uniqueRowGroups: new Set(pivotResult.rows.map(r => 
      pivotResult.columns.slice(0, pivotResult.columns.length - 1).map(c => String(r[c])).join('|')
    )).size,
    uniqueColumnGroups: new Set(pivotResult.columns).size
  };
};

export default {
  createAdvancedPivot,
  createSlicerOptions,
  createTimelineData,
  applySlicerFilter,
  applyTimelineFilter,
  getPivotSummary
};
