/**
 * Safe Formula Parser
 * Provides secure formula evaluation without using eval() or new Function()
 * 
 * This is a simplified implementation. For production, consider using math.js
 * npm install mathjs
 */

export interface FormulaContext {
  [key: string]: number | string | boolean | null;
}

/**
 * Token types for formula parsing
 */
enum TokenType {
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  OPERATOR = 'OPERATOR',
  LPAREN = 'LPAREN',
  RPAREN = 'RPAREN',
  COMMA = 'COMMA',
  CELL_REF = 'CELL_REF',
  BOOLEAN = 'BOOLEAN',
  NULL = 'NULL',
}

interface Token {
  type: TokenType;
  value: string | number | boolean;
}

/**
 * Safe operators with precedence
 */
const OPERATORS: Record<string, { precedence: number; assoc: 'L' | 'R'; fn: (...args: number[]) => number }> = {
  '+': { precedence: 2, assoc: 'L', fn: (a, b) => a + b },
  '-': { precedence: 2, assoc: 'L', fn: (a, b) => a - b },
  '*': { precedence: 3, assoc: 'L', fn: (a, b) => a * b },
  '/': { precedence: 3, assoc: 'L', fn: (a, b) => a / b },
  '%': { precedence: 3, assoc: 'L', fn: (a, b) => a % b },
  '^': { precedence: 4, assoc: 'R', fn: (a, b) => Math.pow(a, b) },
  '=': { precedence: 1, assoc: 'L', fn: (a, b) => a === b ? 1 : 0 },
  '<': { precedence: 1, assoc: 'L', fn: (a, b) => a < b ? 1 : 0 },
  '>': { precedence: 1, assoc: 'L', fn: (a, b) => a > b ? 1 : 0 },
  '<=': { precedence: 1, assoc: 'L', fn: (a, b) => a <= b ? 1 : 0 },
  '>=': { precedence: 1, assoc: 'L', fn: (a, b) => a >= b ? 1 : 0 },
  '<>': { precedence: 1, assoc: 'L', fn: (a, b) => a !== b ? 1 : 0 },
};

/**
 * Tokenize formula string
 */
function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < formula.length) {
    const char = formula[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Numbers
    if (/[\d.]/.test(char)) {
      let num = '';
      while (i < formula.length && /[\d.]/.test(formula[i])) {
        num += formula[i];
        i++;
      }
      tokens.push({ type: TokenType.NUMBER, value: parseFloat(num) });
      continue;
    }

    // Strings
    if (char === '"' || char === "'") {
      const quote = char;
      let str = '';
      i++;
      while (i < formula.length && formula[i] !== quote) {
        str += formula[i];
        i++;
      }
      i++; // Skip closing quote
      tokens.push({ type: TokenType.STRING, value: str });
      continue;
    }

    // Cell references (e.g., A1, B2, AA100)
    if (/[A-Z]/i.test(char)) {
      let ref = '';
      while (i < formula.length && /[A-Z0-9]/i.test(formula[i])) {
        ref += formula[i];
        i++;
      }
      if (/^[A-Z]+[0-9]+$/.test(ref)) {
        tokens.push({ type: TokenType.CELL_REF, value: ref.toUpperCase() });
      } else {
        // Could be a boolean or function name
        if (ref.toUpperCase() === 'TRUE') {
          tokens.push({ type: TokenType.BOOLEAN, value: true });
        } else if (ref.toUpperCase() === 'FALSE') {
          tokens.push({ type: TokenType.BOOLEAN, value: false });
        }
      }
      continue;
    }

    // Multi-character operators
    if (char === '<' || char === '>') {
      const next = formula[i + 1];
      if (next === '=' || next === '>') {
        tokens.push({ type: TokenType.OPERATOR, value: char + next });
        i += 2;
        continue;
      }
    }

    // Single-character operators
    if (OPERATORS[char]) {
      tokens.push({ type: TokenType.OPERATOR, value: char });
      i++;
      continue;
    }

    // Parentheses and commas
    if (char === '(') {
      tokens.push({ type: TokenType.LPAREN, value: '(' });
      i++;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: TokenType.RPAREN, value: ')' });
      i++;
      continue;
    }
    if (char === ',') {
      tokens.push({ type: TokenType.COMMA, value: ',' });
      i++;
      continue;
    }

    // Unknown character - skip
    i++;
  }

  return tokens;
}

/**
 * Convert infix tokens to postfix (Reverse Polish Notation)
 */
function toPostfix(tokens: Token[]): Token[] {
  const output: Token[] = [];
  const stack: Token[] = [];

  for (const token of tokens) {
    if (token.type === TokenType.NUMBER || 
        token.type === TokenType.STRING || 
        token.type === TokenType.BOOLEAN ||
        token.type === TokenType.CELL_REF) {
      output.push(token);
    } else if (token.type === TokenType.OPERATOR) {
      const op1 = token.value as string;
      while (stack.length > 0 && stack[stack.length - 1].type === TokenType.OPERATOR) {
        const op2 = stack[stack.length - 1].value as string;
        const o1 = OPERATORS[op1];
        const o2 = OPERATORS[op2];
        if ((o1.assoc === 'L' && o1.precedence <= o2.precedence) ||
            (o1.assoc === 'R' && o1.precedence < o2.precedence)) {
          output.push(stack.pop()!);
        } else {
          break;
        }
      }
      stack.push(token);
    } else if (token.type === TokenType.LPAREN) {
      stack.push(token);
    } else if (token.type === TokenType.RPAREN) {
      while (stack.length > 0 && stack[stack.length - 1].type !== TokenType.LPAREN) {
        output.push(stack.pop()!);
      }
      stack.pop(); // Remove '('
    }
  }

  while (stack.length > 0) {
    output.push(stack.pop()!);
  }

  return output;
}

/**
 * Evaluate postfix expression
 */
function evaluatePostfix(
  postfix: Token[],
  context: FormulaContext
): number | string | boolean | null {
  const stack: Array<number | string | boolean | null> = [];

  for (const token of postfix) {
    if (token.type === TokenType.NUMBER) {
      stack.push(token.value as number);
    } else if (token.type === TokenType.STRING) {
      stack.push(token.value as string);
    } else if (token.type === TokenType.BOOLEAN) {
      stack.push(token.value as boolean);
    } else if (token.type === TokenType.CELL_REF) {
      const value = context[token.value as string];
      stack.push(value !== undefined ? value : 0);
    } else if (token.type === TokenType.OPERATOR) {
      const b = stack.pop();
      const a = stack.pop();
      
      const op = OPERATORS[token.value as string];
      if (op && typeof a === 'number' && typeof b === 'number') {
        stack.push(op.fn(a, b));
      } else {
        stack.push(0); // Error case
      }
    }
  }

  return stack[0] ?? null;
}

/**
 * Safely evaluate a mathematical expression
 * 
 * @param expression - The expression to evaluate (e.g., "A1 + B2 * 2")
 * @param context - Cell values context (e.g., { A1: 10, B2: 20 })
 * @returns The result of the evaluation
 * 
 * @example
 * safeEvaluate("A1 + B2", { A1: 10, B2: 20 }) // returns 30
 * safeEvaluate("A1 * 2 + B2", { A1: 5, B2: 10 }) // returns 20
 */
export function safeEvaluate(
  expression: string,
  context: FormulaContext = {}
): number | string | boolean | null {
  try {
    // Remove leading '=' if present
    const cleanExpr = expression.startsWith('=') ? expression.slice(1) : expression;
    
    // Tokenize
    const tokens = tokenize(cleanExpr);
    
    // Convert to postfix
    const postfix = toPostfix(tokens);
    
    // Evaluate
    return evaluatePostfix(postfix, context);
  } catch (error) {
    console.error('Safe formula evaluation error:', error);
    return '#ERROR!';
  }
}

/**
 * Validate if a formula is safe to evaluate
 * 
 * @param formula - The formula to validate
 * @returns true if safe, false otherwise
 */
export function isFormulaSafe(formula: string): boolean {
  // Check for dangerous patterns
  const dangerousPatterns = [
    /\b(eval|function|constructor|prototype|__proto__|alert|confirm|prompt)\b/i,
    /[;{}]/,
    /\/\/|\/\*/,
    /window|document|localStorage|sessionStorage/i,
    /fetch|XMLHttpRequest|WebSocket/i,
    /import|require|module/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(formula));
}

/**
 * Parse and validate a filter expression
 * 
 * @param expression - Filter expression (e.g., "value > 100")
 * @param value - The value to test
 * @returns true if the value matches the filter
 */
export function safeFilterEvaluate(
  expression: string,
  value: number | string
): boolean {
  try {
    const cleanExpr = expression.replace(/value/g, String(value));
    const result = safeEvaluate(cleanExpr, {});
    return result === true || result === 1;
  } catch {
    return false;
  }
}

/**
 * Evaluate a comparison expression
 * 
 * @param left - Left operand
 * @param operator - Comparison operator
 * @param right - Right operand
 * @returns true if the comparison is valid
 */
export function safeCompare(
  left: number | string,
  operator: string,
  right: number | string
): boolean {
  switch (operator) {
    case '=':
    case '==':
      return left === right;
    case '<>':
    case '!=':
      return left !== right;
    case '<':
      return Number(left) < Number(right);
    case '>':
      return Number(left) > Number(right);
    case '<=':
      return Number(left) <= Number(right);
    case '>=':
      return Number(left) >= Number(right);
    default:
      return false;
  }
}

export default {
  safeEvaluate,
  isFormulaSafe,
  safeFilterEvaluate,
  safeCompare,
};
