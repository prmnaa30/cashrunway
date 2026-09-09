import { describe, it, expect } from 'vitest';
import {
  evaluateExpression,
  processKeypadInput,
  MAX_TRANSACTION_AMOUNT,
} from '@/lib/utils/calculator';

describe('Calculator Engine & Keypad Logic', () => {
  describe('evaluateExpression', () => {
    it('returns 0 for empty or invalid expressions', () => {
      expect(evaluateExpression('')).toBe(0);
      expect(evaluateExpression('   ')).toBe(0);
      expect(evaluateExpression('+')).toBe(0);
      expect(evaluateExpression('-')).toBe(0);
    });

    it('evaluates simple single numbers', () => {
      expect(evaluateExpression('50000')).toBe(50000);
      expect(evaluateExpression('0')).toBe(0);
    });

    it('evaluates addition correctly', () => {
      expect(evaluateExpression('25000 + 15000')).toBe(40000);
      expect(evaluateExpression('10 + 20 + 30')).toBe(60);
    });

    it('evaluates subtraction correctly', () => {
      expect(evaluateExpression('50000 - 15000')).toBe(35000);
    });

    it('evaluates chained addition and subtraction left-to-right', () => {
      expect(evaluateExpression('100000 - 30000 + 15000 - 5000')).toBe(80000);
    });

    it('safely handles trailing operators by ignoring them', () => {
      expect(evaluateExpression('50000 + ')).toBe(50000);
      expect(evaluateExpression('50000 - ')).toBe(50000);
    });

    it('clamps negative result to 0', () => {
      expect(evaluateExpression('10000 - 50000')).toBe(0);
    });

    it('clamps result to MAX_TRANSACTION_AMOUNT', () => {
      expect(evaluateExpression(`${MAX_TRANSACTION_AMOUNT} + 1000`)).toBe(MAX_TRANSACTION_AMOUNT);
    });
  });

  describe('processKeypadInput', () => {
    it('appends digits when typing fresh', () => {
      let state = processKeypadInput('0', '5');
      expect(state.expression).toBe('5');
      expect(state.amount).toBe(5);

      state = processKeypadInput(state.expression, '0');
      expect(state.expression).toBe('50');
      expect(state.amount).toBe(50);
    });

    it('handles 000 shortcut properly', () => {
      // 000 on 0 does not expand
      let state = processKeypadInput('0', '000');
      expect(state.expression).toBe('0');
      expect(state.amount).toBe(0);

      // 000 on 50 expands to 50000
      state = processKeypadInput('50', '000');
      expect(state.expression).toBe('50000');
      expect(state.amount).toBe(50000);
    });

    it('handles addition and displays pending operator', () => {
      let state = processKeypadInput('50000', '+');
      expect(state.expression).toBe('50000 + ');
      expect(state.amount).toBe(50000);
      expect(state.hasPendingOperator).toBe(true);

      state = processKeypadInput(state.expression, '2');
      state = processKeypadInput(state.expression, '5');
      state = processKeypadInput(state.expression, '000');
      expect(state.expression).toBe('50000 + 25000');
      expect(state.amount).toBe(75000);
      expect(state.hasPendingOperator).toBe(false);
    });

    it('replaces operator if user changes mind (+ to -)', () => {
      let state = processKeypadInput('50000', '+');
      expect(state.expression).toBe('50000 + ');

      state = processKeypadInput(state.expression, '-');
      expect(state.expression).toBe('50000 - ');
      expect(state.hasPendingOperator).toBe(true);
    });

    it('resolves calculation upon pressing =', () => {
      const state = processKeypadInput('50000 + 25000', '=');
      expect(state.expression).toBe('75000');
      expect(state.amount).toBe(75000);
      expect(state.hasPendingOperator).toBe(false);
    });

    it('handles backspace correctly', () => {
      // Backspace on digit
      let state = processKeypadInput('50000', 'backspace');
      expect(state.expression).toBe('5000');
      expect(state.amount).toBe(5000);

      // Backspace on single digit returns 0
      state = processKeypadInput('5', 'backspace');
      expect(state.expression).toBe('0');
      expect(state.amount).toBe(0);

      // Backspace on pending operator removes operator
      state = processKeypadInput('50000 + ', 'backspace');
      expect(state.expression).toBe('50000');
      expect(state.amount).toBe(50000);
      expect(state.hasPendingOperator).toBe(false);
    });

    it('resets to 0 upon clear', () => {
      const state = processKeypadInput('123456 + 789', 'clear');
      expect(state.expression).toBe('0');
      expect(state.amount).toBe(0);
      expect(state.hasPendingOperator).toBe(false);
    });
  });
});
