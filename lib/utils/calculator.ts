/**
 * Pure calculator helper for Quick Entry Keypad.
 * Evaluates math expressions safely without eval() or external dependencies.
 */

export type KeypadKey =
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '000'
  | '+'
  | '-'
  | '='
  | 'backspace'
  | 'clear';

export interface CalculatorState {
  /** The full input string, e.g. "50000 + 25000" */
  expression: string;
  /** Evaluated final numeric amount */
  amount: number;
  /** Whether the expression currently has a pending operator like "+" or "-" */
  hasPendingOperator: boolean;
}

export const MAX_TRANSACTION_AMOUNT = 999_999_999_999;

/**
 * Safely evaluates an arithmetic expression consisting of non-negative integers and + / - operators.
 * Clamps result between 0 and MAX_TRANSACTION_AMOUNT.
 */
export function evaluateExpression(rawExpression: string): number {
  if (!rawExpression || rawExpression.trim() === '') {
    return 0;
  }

  // Remove spaces and any trailing operators
  let clean = rawExpression.trim();
  while (clean.endsWith('+') || clean.endsWith('-')) {
    clean = clean.slice(0, -1).trim();
  }

  if (!clean) return 0;

  // Split into tokens of numbers and operators
  const tokens: (number | '+' | '-')[] = [];
  let currentNum = '';

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (char === ' ') continue;

    if (char === '+' || char === '-') {
      if (currentNum.length > 0) {
        tokens.push(Number(currentNum));
        currentNum = '';
      }
      tokens.push(char);
    } else if (char >= '0' && char <= '9') {
      currentNum += char;
    }
  }

  if (currentNum.length > 0) {
    tokens.push(Number(currentNum));
  }

  if (tokens.length === 0) return 0;

  // Compute left-to-right
  let result = typeof tokens[0] === 'number' ? tokens[0] : 0;
  let currentOp: '+' | '-' = '+';

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '+' || token === '-') {
      currentOp = token;
    } else if (typeof token === 'number') {
      if (currentOp === '+') {
        result += token;
      } else if (currentOp === '-') {
        result -= token;
      }
    }
  }

  // Clamp result
  const clamped = Math.max(0, Math.min(result, MAX_TRANSACTION_AMOUNT));
  return Math.round(clamped);
}

/**
 * Handles keypad press and returns new expression and evaluated amount.
 */
export function processKeypadInput(currentExpression: string, key: KeypadKey): CalculatorState {
  let expr = currentExpression;
  if (expr === '' || expr === '0') {
    expr = '';
  }

  if (key === 'clear') {
    return {
      expression: '0',
      amount: 0,
      hasPendingOperator: false,
    };
  }

  if (key === 'backspace') {
    if (expr.length === 0 || expr === '0') {
      return { expression: '0', amount: 0, hasPendingOperator: false };
    }

    // Remove trailing space if any
    let trimmed = expr.endsWith(' ') ? expr.trimEnd() : expr;
    // Remove last char
    trimmed = trimmed.slice(0, -1).trimEnd();

    if (trimmed.length === 0) {
      trimmed = '0';
    }

    const hasOp = trimmed.endsWith('+') || trimmed.endsWith('-');
    const amount = evaluateExpression(trimmed);

    return {
      expression: trimmed,
      amount,
      hasPendingOperator: hasOp,
    };
  }

  if (key === '=') {
    const amount = evaluateExpression(expr);
    return {
      expression: amount.toString(),
      amount,
      hasPendingOperator: false,
    };
  }

  if (key === '+' || key === '-') {
    const trimmed = expr.trimEnd();
    if (trimmed === '' || trimmed === '0') {
      return {
        expression: '0',
        amount: 0,
        hasPendingOperator: false,
      };
    }

    // If expression ends with an operator, replace it
    if (trimmed.endsWith('+') || trimmed.endsWith('-')) {
      const replaced = trimmed.slice(0, -1).trimEnd() + ` ${key} `;
      return {
        expression: replaced,
        amount: evaluateExpression(replaced),
        hasPendingOperator: true,
      };
    }

    const newExpr = `${trimmed} ${key} `;
    return {
      expression: newExpr,
      amount: evaluateExpression(newExpr),
      hasPendingOperator: true,
    };
  }

  if (key === '000') {
    if (expr === '' || expr === '0' || expr.endsWith('+ ') || expr.endsWith('- ')) {
      // Cannot add 000 at start of a number operand
      if (expr === '' || expr === '0') {
        return { expression: '0', amount: 0, hasPendingOperator: false };
      }
      return {
        expression: expr,
        amount: evaluateExpression(expr),
        hasPendingOperator: expr.endsWith('+ ') || expr.endsWith('- '),
      };
    }

    const candidate = expr + '000';
    const evaluated = evaluateExpression(candidate);
    if (evaluated > MAX_TRANSACTION_AMOUNT) {
      return {
        expression: expr,
        amount: evaluateExpression(expr),
        hasPendingOperator: false,
      };
    }

    return {
      expression: candidate,
      amount: evaluated,
      hasPendingOperator: false,
    };
  }

  // Digits 0-9
  if (expr === '' || expr === '0') {
    if (key === '0') {
      return { expression: '0', amount: 0, hasPendingOperator: false };
    }
    return {
      expression: key,
      amount: Number(key),
      hasPendingOperator: false,
    };
  }

  const candidate = expr + key;
  const evaluated = evaluateExpression(candidate);
  if (evaluated > MAX_TRANSACTION_AMOUNT) {
    return {
      expression: expr,
      amount: evaluateExpression(expr),
      hasPendingOperator: false,
    };
  }

  return {
    expression: candidate,
    amount: evaluated,
    hasPendingOperator: false,
  };
}
