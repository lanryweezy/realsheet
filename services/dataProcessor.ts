/**
 * Advanced Data Processing Service
 * High-performance data transformation and analysis
 */

import { Row, SheetData } from '../types';
import { PerformanceOptimizer } from './performanceOptimizer';

export class DataProcessor {
  /**
   * Efficient data filtering with multiple conditions
   */
  static filter(
    data: Row[],
    conditions: Array<{
      column: string;
      operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'startsWith' | 'endsWith';
      value: any;
    }>
  ): Row[] {
    return data.filter(row => {
      return conditions.every(({ column, operator, value }) => {
        const cellValue = row[column];
        
        switch (operator) {
          case '=':
            return cellValue === value;
          case '!=':
            return cellValue !== value;
          case '>':
            return Number(cellValue) > Number(value);
          case '<':
            return Number(cellValue) < Number(value);
          case '>=':
            return Number(cellValue) >= Number(value);
          case '<=':
            return Number(cellValue) <= Number(value);
          case 'contains':
            return String(cellValue).toLowerCase().includes(String(value).toLowerCase());
          case 'startsWith':
            return String(cellValue).toLowerCase().startsWith(String(value).toLowerCase());
          case 'endsWith':
            return String(cellValue).toLowerCase().endsWith(String(value).toLowerCase());
          default:
            return true;
        }
      });
    });
  }

  /**
   * Advanced sorting with multiple keys
   */
  static sort(
    data: Row[],
    sortKeys: Array<{ column: string; direction: 'asc' | 'desc' }>
  ): Row[] {
    return [...data].sort((a, b) => {
      for (const { column, direction } of sortKeys) {
        const aVal = a[column];
        const bVal = b[column];
        
        let comparison = 0;
        
        // Handle different types
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        
        if (comparison !== 0) {
          return direction === 'asc' ? comparison : -comparison;
        }
      }
      
      return 0;
    });
  }

  /**
   * Group data by column with aggregations
   */
  static groupBy(
    data: Row[],
    groupColumn: string,
    aggregations: Array<{
      column: string;
      operation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'first' | 'last';
      alias?: string;
    }>
  ): Row[] {
    const groups = new Map<any, Row[]>();
    
    // Group rows
    for (const row of data) {
      const key = row[groupColumn];
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    }
    
    // Aggregate
    const result: Row[] = [];
    
    for (const [key, rows] of groups) {
      const aggregated: Row = { [groupColumn]: key };
      
      for (const { column, operation, alias } of aggregations) {
        const outputColumn = alias || `${operation}_${column}`;
        const values = rows.map(r => Number(r[column])).filter(v => !isNaN(v));
        
        switch (operation) {
          case 'sum':
            aggregated[outputColumn] = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            aggregated[outputColumn] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            break;
          case 'min':
            aggregated[outputColumn] = values.length ? Math.min(...values) : null;
            break;
          case 'max':
            aggregated[outputColumn] = values.length ? Math.max(...values) : null;
            break;
          case 'count':
            aggregated[outputColumn] = rows.length;
            break;
          case 'first':
            aggregated[outputColumn] = rows[0][column];
            break;
          case 'last':
            aggregated[outputColumn] = rows[rows.length - 1][column];
            break;
        }
      }
      
      result.push(aggregated);
    }
    
    return result;
  }

  /**
   * Join two datasets
   */
  static join(
    left: Row[],
    right: Row[],
    leftKey: string,
    rightKey: string,
    type: 'inner' | 'left' | 'right' | 'outer' = 'inner'
  ): Row[] {
    const result: Row[] = [];
    const rightIndex = new Map<any, Row[]>();
    
    // Index right dataset
    for (const row of right) {
      const key = row[rightKey];
      if (!rightIndex.has(key)) {
        rightIndex.set(key, []);
      }
      rightIndex.get(key)!.push(row);
    }
    
    // Perform join
    const matchedRightKeys = new Set<any>();
    
    for (const leftRow of left) {
      const key = leftRow[leftKey];
      const rightRows = rightIndex.get(key) || [];
      
      if (rightRows.length > 0) {
        for (const rightRow of rightRows) {
          result.push({ ...leftRow, ...rightRow });
          matchedRightKeys.add(key);
        }
      } else if (type === 'left' || type === 'outer') {
        result.push({ ...leftRow });
      }
    }
    
    // Add unmatched right rows for outer join
    if (type === 'right' || type === 'outer') {
      for (const rightRow of right) {
        const key = rightRow[rightKey];
        if (!matchedRightKeys.has(key)) {
          result.push({ ...rightRow });
        }
      }
    }
    
    return result;
  }

  /**
   * Pivot data
   */
  static pivot(
    data: Row[],
    rowKey: string,
    columnKey: string,
    valueKey: string,
    aggregation: 'sum' | 'avg' | 'count' = 'sum'
  ): Row[] {
    const pivotMap = new Map<any, Map<any, number[]>>();
    const columnValues = new Set<any>();
    
    // Build pivot structure
    for (const row of data) {
      const rowVal = row[rowKey];
      const colVal = row[columnKey];
      const value = Number(row[valueKey]);
      
      if (!pivotMap.has(rowVal)) {
        pivotMap.set(rowVal, new Map());
      }
      
      if (!pivotMap.get(rowVal)!.has(colVal)) {
        pivotMap.get(rowVal)!.set(colVal, []);
      }
      
      if (!isNaN(value)) {
        pivotMap.get(rowVal)!.get(colVal)!.push(value);
      }
      
      columnValues.add(colVal);
    }
    
    // Generate result
    const result: Row[] = [];
    
    for (const [rowVal, columns] of pivotMap) {
      const pivotRow: Row = { [rowKey]: rowVal };
      
      for (const colVal of columnValues) {
        const values = columns.get(colVal) || [];
        
        let aggregatedValue: number;
        switch (aggregation) {
          case 'sum':
            aggregatedValue = values.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            aggregatedValue = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
            break;
          case 'count':
            aggregatedValue = values.length;
            break;
        }
        
        pivotRow[String(colVal)] = aggregatedValue;
      }
      
      result.push(pivotRow);
    }
    
    return result;
  }

  /**
   * Unpivot data (melt)
   */
  static unpivot(
    data: Row[],
    idColumns: string[],
    valueColumns: string[],
    variableName: string = 'variable',
    valueName: string = 'value'
  ): Row[] {
    const result: Row[] = [];
    
    for (const row of data) {
      for (const valueCol of valueColumns) {
        const unpivotedRow: Row = {};
        
        // Copy ID columns
        for (const idCol of idColumns) {
          unpivotedRow[idCol] = row[idCol];
        }
        
        // Add variable and value
        unpivotedRow[variableName] = valueCol;
        unpivotedRow[valueName] = row[valueCol];
        
        result.push(unpivotedRow);
      }
    }
    
    return result;
  }

  /**
   * Remove duplicates
   */
  static removeDuplicates(data: Row[], columns: string[]): Row[] {
    const seen = new Set<string>();
    const result: Row[] = [];
    
    for (const row of data) {
      const key = columns.map(col => String(row[col])).join('|');
      
      if (!seen.has(key)) {
        seen.add(key);
        result.push(row);
      }
    }
    
    return result;
  }

  /**
   * Fill missing values
   */
  static fillMissing(
    data: Row[],
    column: string,
    method: 'forward' | 'backward' | 'value' | 'mean' | 'median',
    fillValue?: any
  ): Row[] {
    const result = [...data];
    
    if (method === 'value' && fillValue !== undefined) {
      return result.map(row => ({
        ...row,
        [column]: row[column] ?? fillValue,
      }));
    }
    
    if (method === 'mean' || method === 'median') {
      const values = result
        .map(r => Number(r[column]))
        .filter(v => !isNaN(v));
      
      let fillVal: number;
      if (method === 'mean') {
        fillVal = values.reduce((a, b) => a + b, 0) / values.length;
      } else {
        const sorted = values.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        fillVal = sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];
      }
      
      return result.map(row => ({
        ...row,
        [column]: row[column] ?? fillVal,
      }));
    }
    
    if (method === 'forward') {
      let lastValue: any = null;
      return result.map(row => {
        if (row[column] != null) {
          lastValue = row[column];
        }
        return {
          ...row,
          [column]: row[column] ?? lastValue,
        };
      });
    }
    
    if (method === 'backward') {
      let nextValue: any = null;
      for (let i = result.length - 1; i >= 0; i--) {
        if (result[i][column] != null) {
          nextValue = result[i][column];
        } else {
          result[i] = {
            ...result[i],
            [column]: nextValue,
          };
        }
      }
    }
    
    return result;
  }

  /**
   * Calculate rolling window statistics
   */
  static rollingWindow(
    data: Row[],
    column: string,
    windowSize: number,
    operation: 'sum' | 'avg' | 'min' | 'max',
    outputColumn?: string
  ): Row[] {
    const output = outputColumn || `${operation}_${column}_${windowSize}`;
    const result = [...data];
    
    for (let i = 0; i < result.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = result.slice(start, i + 1);
      const values = window.map(r => Number(r[column])).filter(v => !isNaN(v));
      
      let value: number;
      switch (operation) {
        case 'sum':
          value = values.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          value = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
          break;
        case 'min':
          value = values.length ? Math.min(...values) : 0;
          break;
        case 'max':
          value = values.length ? Math.max(...values) : 0;
          break;
      }
      
      result[i] = {
        ...result[i],
        [output]: value,
      };
    }
    
    return result;
  }

  /**
   * Transpose data
   */
  static transpose(data: Row[], columns: string[]): Row[] {
    const result: Row[] = [];
    
    for (const column of columns) {
      const row: Row = { column };
      
      data.forEach((dataRow, index) => {
        row[`value_${index}`] = dataRow[column];
      });
      
      result.push(row);
    }
    
    return result;
  }

  /**
   * Sample data
   */
  static sample(
    data: Row[],
    size: number,
    method: 'random' | 'first' | 'last' | 'systematic' = 'random'
  ): Row[] {
    if (size >= data.length) {
      return [...data];
    }
    
    switch (method) {
      case 'first':
        return data.slice(0, size);
      
      case 'last':
        return data.slice(-size);
      
      case 'systematic':
        const step = Math.floor(data.length / size);
        return data.filter((_, i) => i % step === 0).slice(0, size);
      
      case 'random':
      default:
        const shuffled = [...data];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, size);
    }
  }

  /**
   * Calculate percentiles
   */
  static percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  /**
   * Detect outliers using IQR method
   */
  static detectOutliers(
    data: Row[],
    column: string,
    multiplier: number = 1.5
  ): { outliers: Row[]; clean: Row[] } {
    const values = data.map(r => Number(r[column])).filter(v => !isNaN(v));
    
    const q1 = this.percentile(values, 25);
    const q3 = this.percentile(values, 75);
    const iqr = q3 - q1;
    
    const lowerBound = q1 - multiplier * iqr;
    const upperBound = q3 + multiplier * iqr;
    
    const outliers: Row[] = [];
    const clean: Row[] = [];
    
    for (const row of data) {
      const value = Number(row[column]);
      
      if (isNaN(value) || value < lowerBound || value > upperBound) {
        outliers.push(row);
      } else {
        clean.push(row);
      }
    }
    
    return { outliers, clean };
  }

  /**
   * Normalize data
   */
  static normalize(
    data: Row[],
    column: string,
    method: 'minmax' | 'zscore',
    outputColumn?: string
  ): Row[] {
    const output = outputColumn || `${column}_normalized`;
    const values = data.map(r => Number(r[column])).filter(v => !isNaN(v));
    
    if (method === 'minmax') {
      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;
      
      return data.map(row => ({
        ...row,
        [output]: range === 0 ? 0 : (Number(row[column]) - min) / range,
      }));
    } else {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      return data.map(row => ({
        ...row,
        [output]: stdDev === 0 ? 0 : (Number(row[column]) - mean) / stdDev,
      }));
    }
  }
}
