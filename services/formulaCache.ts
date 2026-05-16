/**
 * Formula Caching Service
 * Dramatically improves performance by caching formula results
 */

import { Row } from '../types';

interface CacheEntry {
  value: any;
  timestamp: number;
  dependencies: string[]; // Cell references this formula depends on
}

export class FormulaCache {
  private cache: Map<string, CacheEntry> = new Map();
  private cellValues: Map<string, any> = new Map();
  private maxCacheSize = 10000;
  private cacheTTL = 60000; // 1 minute

  /**
   * Generate cache key from formula and context
   */
  private generateKey(formula: string, rowIndex: number, colIndex: number): string {
    return `${formula}|${rowIndex}|${colIndex}`;
  }

  /**
   * Extract cell dependencies from formula
   */
  private extractDependencies(formula: string): string[] {
    const dependencies: string[] = [];
    const cellRefRegex = /([A-Z]+)(\d+)/g;
    let match;
    
    while ((match = cellRefRegex.exec(formula)) !== null) {
      dependencies.push(match[0]);
    }
    
    return dependencies;
  }

  /**
   * Check if cached value is still valid
   */
  private isValid(entry: CacheEntry, currentCellValues: Map<string, any>): boolean {
    // Check TTL
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      return false;
    }
    
    // Check if any dependencies changed
    for (const dep of entry.dependencies) {
      const currentValue = currentCellValues.get(dep);
      const cachedValue = this.cellValues.get(dep);
      
      if (currentValue !== cachedValue) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get cached formula result
   */
  get(formula: string, rowIndex: number, colIndex: number, currentCellValues: Map<string, any>): any | null {
    const key = this.generateKey(formula, rowIndex, colIndex);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (!this.isValid(entry, currentCellValues)) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * Set cached formula result
   */
  set(formula: string, rowIndex: number, colIndex: number, value: any, currentCellValues: Map<string, any>): void {
    // Enforce cache size limit
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entries (simple FIFO)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    const key = this.generateKey(formula, rowIndex, colIndex);
    const dependencies = this.extractDependencies(formula);
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      dependencies,
    });
    
    // Update cell values snapshot
    currentCellValues.forEach((val, cellRef) => {
      this.cellValues.set(cellRef, val);
    });
  }

  /**
   * Invalidate cache for specific cell
   */
  invalidateCell(cellRef: string): void {
    // Remove all entries that depend on this cell
    for (const [key, entry] of this.cache.entries()) {
      if (entry.dependencies.includes(cellRef)) {
        this.cache.delete(key);
      }
    }
    
    this.cellValues.delete(cellRef);
  }

  /**
   * Invalidate entire cache
   */
  invalidateAll(): void {
    this.cache.clear();
    this.cellValues.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; hitRate: number; memoryUsage: number } {
    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses
      memoryUsage: this.cache.size * 100, // Rough estimate
    };
  }

  /**
   * Optimize cache by removing expired entries
   */
  optimize(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.cacheTTL) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => this.cache.delete(key));
  }
}

// Global cache instance
export const formulaCache = new FormulaCache();

// Optimize cache every 5 minutes
setInterval(() => {
  formulaCache.optimize();
}, 5 * 60 * 1000);
