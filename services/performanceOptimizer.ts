/**
 * Performance Optimization Service
 * Improves calculation speed and memory usage
 */

import { SheetData, Row } from '../types';

export class PerformanceOptimizer {
  /**
   * Batch process formulas to reduce recalculation
   */
  static batchCalculate(
    formulas: Array<{ row: number; col: string; formula: string }>,
    sheetData: SheetData,
    evaluator: (formula: string, row: number, col: string) => any
  ): Map<string, any> {
    const results = new Map<string, any>();
    
    // Sort formulas by dependency order
    const sorted = this.topologicalSort(formulas, sheetData);
    
    // Calculate in order
    for (const { row, col, formula } of sorted) {
      const result = evaluator(formula, row, col);
      results.set(`${row}-${col}`, result);
    }
    
    return results;
  }

  /**
   * Topological sort for formula dependencies
   */
  private static topologicalSort(
    formulas: Array<{ row: number; col: string; formula: string }>,
    sheetData: SheetData
  ): Array<{ row: number; col: string; formula: string }> {
    // Build dependency graph
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    for (const { row, col, formula } of formulas) {
      const key = `${row}-${col}`;
      graph.set(key, []);
      inDegree.set(key, 0);
      
      // Extract dependencies
      const deps = this.extractDependencies(formula, sheetData);
      for (const dep of deps) {
        if (!graph.has(dep)) {
          graph.set(dep, []);
          inDegree.set(dep, 0);
        }
        graph.get(dep)!.push(key);
        inDegree.set(key, (inDegree.get(key) || 0) + 1);
      }
    }
    
    // Kahn's algorithm
    const queue: string[] = [];
    const result: Array<{ row: number; col: string; formula: string }> = [];
    
    for (const [key, degree] of inDegree.entries()) {
      if (degree === 0) {
        queue.push(key);
      }
    }
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const formula = formulas.find(f => `${f.row}-${f.col}` === current);
      if (formula) {
        result.push(formula);
      }
      
      for (const neighbor of graph.get(current) || []) {
        inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    return result;
  }

  /**
   * Extract cell dependencies from formula
   */
  private static extractDependencies(formula: string, sheetData: SheetData): string[] {
    const deps: string[] = [];
    const cellRefRegex = /([A-Z]+)(\d+)/g;
    let match;
    
    while ((match = cellRefRegex.exec(formula)) !== null) {
      const colIndex = this.excelColToIndex(match[1]);
      const rowIndex = parseInt(match[2]) - 1;
      
      if (rowIndex < sheetData.rows.length && colIndex < sheetData.columns.length) {
        deps.push(`${rowIndex}-${sheetData.columns[colIndex]}`);
      }
    }
    
    return deps;
  }

  private static excelColToIndex(colName: string): number {
    let num = 0;
    for (let i = 0; i < colName.length; i++) {
      num = num * 26 + (colName.charCodeAt(i) - 64);
    }
    return num - 1;
  }

  /**
   * Debounce function for expensive operations
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        timeout = null;
        func(...args);
      };
      
      if (timeout) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function for frequent operations
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return function executedFunction(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  /**
   * Memoize expensive function calls
   */
  static memoize<T extends (...args: any[]) => any>(
    func: T,
    maxSize: number = 1000
  ): T {
    const cache = new Map<string, any>();
    
    return ((...args: Parameters<T>) => {
      const key = JSON.stringify(args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = func(...args);
      
      // Enforce cache size limit
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      
      cache.set(key, result);
      return result;
    }) as T;
  }

  /**
   * Chunk large arrays for processing
   */
  static* chunkArray<T>(array: T[], chunkSize: number): Generator<T[]> {
    for (let i = 0; i < array.length; i += chunkSize) {
      yield array.slice(i, i + chunkSize);
    }
  }

  /**
   * Process array in parallel chunks
   */
  static async processInParallel<T, R>(
    array: T[],
    processor: (item: T) => Promise<R>,
    concurrency: number = 4
  ): Promise<R[]> {
    const results: R[] = [];
    const chunks = Array.from(this.chunkArray(array, concurrency));
    
    for (const chunk of chunks) {
      const chunkResults = await Promise.all(chunk.map(processor));
      results.push(...chunkResults);
    }
    
    return results;
  }

  /**
   * Measure function execution time
   */
  static measure<T extends (...args: any[]) => any>(
    func: T,
    label: string
  ): T {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = func(...args);
      const end = performance.now();
      
      console.log(`[Performance] ${label}: ${(end - start).toFixed(2)}ms`);
      
      return result;
    }) as T;
  }

  /**
   * Optimize large dataset operations
   */
  static optimizeDataset(data: Row[]): {
    indexed: Map<string, Row>;
    sorted: Row[];
    stats: { size: number; memoryEstimate: number };
  } {
    // Create index for fast lookups
    const indexed = new Map<string, Row>();
    data.forEach((row, index) => {
      indexed.set(String(index), row);
    });
    
    // Pre-sort for range queries
    const sorted = [...data];
    
    // Calculate memory estimate
    const memoryEstimate = JSON.stringify(data).length;
    
    return {
      indexed,
      sorted,
      stats: {
        size: data.length,
        memoryEstimate,
      },
    };
  }

  /**
   * Lazy evaluation for expensive computations
   */
  static lazy<T>(computation: () => T): () => T {
    let cached: T | undefined;
    let computed = false;
    
    return () => {
      if (!computed) {
        cached = computation();
        computed = true;
      }
      return cached!;
    };
  }

  /**
   * Virtual scrolling helper for large datasets
   */
  static getVisibleRange(
    scrollTop: number,
    containerHeight: number,
    rowHeight: number,
    totalRows: number,
    overscan: number = 5
  ): { start: number; end: number } {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleRows = Math.ceil(containerHeight / rowHeight);
    const end = Math.min(totalRows, start + visibleRows + overscan * 2);
    
    return { start, end };
  }

  /**
   * Compress data for storage
   */
  static compressData(data: any): string {
    // Simple compression using JSON + base64
    // In production, use a proper compression library
    const json = JSON.stringify(data);
    return btoa(json);
  }

  /**
   * Decompress data from storage
   */
  static decompressData(compressed: string): any {
    try {
      const json = atob(compressed);
      return JSON.parse(json);
    } catch (error) {
      console.error('Decompression error:', error);
      return null;
    }
  }

  /**
   * Memory usage estimation
   */
  static estimateMemoryUsage(data: any): number {
    return new Blob([JSON.stringify(data)]).size;
  }

  /**
   * Garbage collection hint (for large operations)
   */
  static gcHint(): void {
    // Force garbage collection if available (Chrome with --expose-gc flag)
    if (global.gc) {
      global.gc();
    }
  }
}

/**
 * Performance Monitor
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  record(metric: string, value: number): void {
    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }
    
    const values = this.metrics.get(metric)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getStats(metric: string): {
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const values = this.metrics.get(metric);
    if (!values || values.length === 0) {
      return null;
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    
    return {
      avg: sum / values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }

  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [metric, _] of this.metrics) {
      stats[metric] = this.getStats(metric);
    }
    
    return stats;
  }

  clear(): void {
    this.metrics.clear();
  }
}

// Global performance monitor
export const perfMonitor = new PerformanceMonitor();
