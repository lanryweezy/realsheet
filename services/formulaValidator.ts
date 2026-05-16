/**
 * Formula Validation Service
 * Validates formulas before execution to prevent errors
 */

import { SheetData } from '../types';
import { ErrorFactory } from './errorHandler';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class FormulaValidator {
  private static readonly VALID_FUNCTIONS = [
    // Math
    'SUM', 'AVG', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'ROUND', 'ROUNDUP', 'ROUNDDOWN',
    'ABS', 'SQRT', 'POWER', 'MOD', 'CEILING', 'FLOOR',
    // Logical
    'IF', 'IFS', 'AND', 'OR', 'NOT', 'XOR', 'SWITCH',
    // Text
    'CONCATENATE', 'TEXTJOIN', 'LEFT', 'RIGHT', 'MID', 'TRIM',
    'UPPER', 'LOWER', 'PROPER', 'LEN', 'FIND', 'SUBSTITUTE',
    // Date
    'TODAY', 'NOW', 'DATE', 'YEAR', 'MONTH', 'DAY',
    'HOUR', 'MINUTE', 'SECOND', 'DATEDIF', 'WEEKDAY',
    // Lookup
    'VLOOKUP', 'HLOOKUP', 'INDEX', 'MATCH', 'XLOOKUP',
    // Statistical
    'STDEV', 'VAR', 'CORREL', 'PERCENTILE', 'SUMIF',
    // Array
    'FILTER', 'SORT', 'UNIQUE',
    // Financial
    'PMT', 'FV', 'NPV', 'PV', 'RATE', 'IRR',
    // AI
    'AI', 'SENTIMENT', 'CLASSIFY', 'EXTRACT', 'TRANSLATE',
    'SUMMARIZE', 'GENERATE', 'FORECAST', 'INFER', 'ANALYZE',
    'EXPLAIN', 'SUGGEST_FORMULA', 'FIX_FORMULA',
    // API
    'FETCH', 'IMPORTJSON', 'IMPORTXML',
  ];

  /**
   * Validate formula syntax and structure
   */
  static validate(formula: string, sheetData?: SheetData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Must start with =
    if (!formula.startsWith('=')) {
      errors.push('Formula must start with =');
      return { valid: false, errors, warnings, suggestions };
    }

    const formulaBody = formula.substring(1).trim();

    // Check for empty formula
    if (!formulaBody) {
      errors.push('Formula cannot be empty');
      return { valid: false, errors, warnings, suggestions };
    }

    // Check parentheses balance
    const parenBalance = this.checkParenthesesBalance(formulaBody);
    if (!parenBalance.balanced) {
      errors.push(`Unbalanced parentheses: ${parenBalance.message}`);
    }

    // Check quotes balance
    const quoteBalance = this.checkQuotesBalance(formulaBody);
    if (!quoteBalance.balanced) {
      errors.push(`Unbalanced quotes: ${quoteBalance.message}`);
    }

    // Extract and validate function names
    const functions = this.extractFunctions(formulaBody);
    for (const func of functions) {
      if (!this.VALID_FUNCTIONS.includes(func.toUpperCase())) {
        errors.push(`Unknown function: ${func}`);
        suggestions.push(`Did you mean: ${this.suggestFunction(func)}?`);
      }
    }

    // Validate cell references
    if (sheetData) {
      const cellRefs = this.extractCellReferences(formulaBody);
      for (const ref of cellRefs) {
        const validation = this.validateCellReference(ref, sheetData);
        if (!validation.valid) {
          warnings.push(`Cell reference ${ref}: ${validation.message}`);
        }
      }
    }

    // Check for common mistakes
    const commonMistakes = this.checkCommonMistakes(formulaBody);
    warnings.push(...commonMistakes);

    // Check for circular references
    if (sheetData) {
      const circular = this.checkCircularReference(formulaBody, sheetData);
      if (circular) {
        errors.push('Circular reference detected');
      }
    }

    // Performance warnings
    const perfWarnings = this.checkPerformance(formulaBody);
    warnings.push(...perfWarnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Check parentheses balance
   */
  private static checkParenthesesBalance(formula: string): { balanced: boolean; message: string } {
    let count = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < formula.length; i++) {
      const char = formula[i];

      if ((char === '"' || char === "'") && !inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && inString) {
        inString = false;
      } else if (!inString) {
        if (char === '(') count++;
        if (char === ')') count--;
        
        if (count < 0) {
          return { balanced: false, message: 'Extra closing parenthesis' };
        }
      }
    }

    if (count > 0) {
      return { balanced: false, message: `Missing ${count} closing parenthesis` };
    }

    return { balanced: true, message: '' };
  }

  /**
   * Check quotes balance
   */
  private static checkQuotesBalance(formula: string): { balanced: boolean; message: string } {
    let doubleQuotes = 0;
    let singleQuotes = 0;

    for (const char of formula) {
      if (char === '"') doubleQuotes++;
      if (char === "'") singleQuotes++;
    }

    if (doubleQuotes % 2 !== 0) {
      return { balanced: false, message: 'Unbalanced double quotes' };
    }

    if (singleQuotes % 2 !== 0) {
      return { balanced: false, message: 'Unbalanced single quotes' };
    }

    return { balanced: true, message: '' };
  }

  /**
   * Extract function names from formula
   */
  private static extractFunctions(formula: string): string[] {
    const functions: string[] = [];
    const regex = /([A-Z_]+)\s*\(/gi;
    let match;

    while ((match = regex.exec(formula)) !== null) {
      functions.push(match[1]);
    }

    return functions;
  }

  /**
   * Extract cell references from formula
   */
  private static extractCellReferences(formula: string): string[] {
    const refs: string[] = [];
    const regex = /([A-Z]+)(\d+)/g;
    let match;

    while ((match = regex.exec(formula)) !== null) {
      refs.push(match[0]);
    }

    return refs;
  }

  /**
   * Validate cell reference
   */
  private static validateCellReference(
    ref: string,
    sheetData: SheetData
  ): { valid: boolean; message: string } {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) {
      return { valid: false, message: 'Invalid format' };
    }

    const colIndex = this.excelColToIndex(match[1]);
    const rowIndex = parseInt(match[2]) - 1;

    if (rowIndex < 0 || rowIndex >= sheetData.rows.length) {
      return { valid: false, message: 'Row out of bounds' };
    }

    if (colIndex < 0 || colIndex >= sheetData.columns.length) {
      return { valid: false, message: 'Column out of bounds' };
    }

    return { valid: true, message: '' };
  }

  private static excelColToIndex(colName: string): number {
    let num = 0;
    for (let i = 0; i < colName.length; i++) {
      num = num * 26 + (colName.charCodeAt(i) - 64);
    }
    return num - 1;
  }

  /**
   * Check for common mistakes
   */
  private static checkCommonMistakes(formula: string): string[] {
    const warnings: string[] = [];

    // Missing commas
    if (/\)\s*\(/.test(formula)) {
      warnings.push('Possible missing comma between arguments');
    }

    // Double operators
    if (/[+\-*/]{2,}/.test(formula)) {
      warnings.push('Double operators detected');
    }

    // Missing operators
    if (/\d+[A-Z]+\d+/.test(formula)) {
      warnings.push('Possible missing operator between number and cell reference');
    }

    // Trailing comma
    if (/,\s*\)/.test(formula)) {
      warnings.push('Trailing comma before closing parenthesis');
    }

    // Division by zero
    if (/\/\s*0(?!\d)/.test(formula)) {
      warnings.push('Possible division by zero');
    }

    return warnings;
  }

  /**
   * Check for circular references
   */
  private static checkCircularReference(formula: string, sheetData: SheetData): boolean {
    // Simplified check - would need full dependency graph in production
    const refs = this.extractCellReferences(formula);
    
    // Check if formula references itself (basic check)
    // In production, would need to traverse entire dependency chain
    return false; // Placeholder
  }

  /**
   * Check for performance issues
   */
  private static checkPerformance(formula: string): string[] {
    const warnings: string[] = [];

    // Nested functions depth
    const depth = this.calculateNestingDepth(formula);
    if (depth > 5) {
      warnings.push(`High nesting depth (${depth}). Consider simplifying.`);
    }

    // Large ranges
    const rangeMatch = formula.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
    if (rangeMatch) {
      const startRow = parseInt(rangeMatch[2]);
      const endRow = parseInt(rangeMatch[4]);
      const rowCount = Math.abs(endRow - startRow) + 1;
      
      if (rowCount > 10000) {
        warnings.push(`Large range (${rowCount} rows). May impact performance.`);
      }
    }

    // Multiple volatile functions
    const volatileFunctions = ['TODAY', 'NOW', 'RAND', 'RANDBETWEEN'];
    const volatileCount = volatileFunctions.filter(func => 
      formula.toUpperCase().includes(func)
    ).length;
    
    if (volatileCount > 2) {
      warnings.push('Multiple volatile functions. Will recalculate frequently.');
    }

    return warnings;
  }

  /**
   * Calculate nesting depth
   */
  private static calculateNestingDepth(formula: string): number {
    let maxDepth = 0;
    let currentDepth = 0;

    for (const char of formula) {
      if (char === '(') {
        currentDepth++;
        maxDepth = Math.max(maxDepth, currentDepth);
      } else if (char === ')') {
        currentDepth--;
      }
    }

    return maxDepth;
  }

  /**
   * Suggest similar function name
   */
  private static suggestFunction(input: string): string {
    const inputUpper = input.toUpperCase();
    
    // Find closest match using Levenshtein distance
    let minDistance = Infinity;
    let suggestion = '';

    for (const func of this.VALID_FUNCTIONS) {
      const distance = this.levenshteinDistance(inputUpper, func);
      if (distance < minDistance) {
        minDistance = distance;
        suggestion = func;
      }
    }

    return suggestion;
  }

  /**
   * Calculate Levenshtein distance
   */
  private static levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Auto-fix common formula errors
   */
  static autoFix(formula: string): { fixed: string; changes: string[] } {
    let fixed = formula;
    const changes: string[] = [];

    // Add missing =
    if (!fixed.startsWith('=')) {
      fixed = '=' + fixed;
      changes.push('Added missing = at start');
    }

    // Fix common function name typos
    const typos: Record<string, string> = {
      'SUMM': 'SUM',
      'AVRAGE': 'AVERAGE',
      'VLOKUP': 'VLOOKUP',
      'IFF': 'IF',
    };

    for (const [typo, correct] of Object.entries(typos)) {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      if (regex.test(fixed)) {
        fixed = fixed.replace(regex, correct);
        changes.push(`Fixed ${typo} → ${correct}`);
      }
    }

    // Balance parentheses
    const parenBalance = this.checkParenthesesBalance(fixed.substring(1));
    if (!parenBalance.balanced && parenBalance.message.includes('Missing')) {
      const missing = parseInt(parenBalance.message.match(/\d+/)?.[0] || '0');
      fixed += ')'.repeat(missing);
      changes.push(`Added ${missing} closing parenthesis`);
    }

    // Remove trailing commas
    fixed = fixed.replace(/,\s*\)/g, ')');
    if (fixed !== formula) {
      changes.push('Removed trailing commas');
    }

    return { fixed, changes };
  }
}
