import {
  centsToDollars,
  dollarsToCents,
  formatCurrencyCents,
  formatNullable,
} from '../helpers';

describe('helpers', () => {
  describe('centsToDollars', () => {
    it('returns formatted dollar string for positive cents', () => {
      expect(centsToDollars(1234)).toBe('12.34');
    });

    it('returns empty string for zero', () => {
      expect(centsToDollars(0)).toBe('');
    });
  });

  describe('dollarsToCents', () => {
    it('converts dollar string to cents and rounds', () => {
      expect(dollarsToCents('12.345')).toBe(1235);
    });

    it('returns zero for blank input', () => {
      expect(dollarsToCents('   ')).toBe(0);
    });

    it('returns zero for non-numeric input', () => {
      expect(dollarsToCents('abc')).toBe(0);
    });
  });

  describe('formatCurrencyCents', () => {
    it('formats cents as currency', () => {
      expect(formatCurrencyCents(999)).toBe('$9.99');
    });
  });

  describe('formatNullable', () => {
    it('formats non-null values', () => {
      expect(formatNullable(7, (v) => `#${v}`)).toBe('#7');
    });

    it('uses default fallback for null', () => {
      expect(formatNullable(null, (v: number) => String(v))).toBe('—');
    });

    it('uses custom fallback for null', () => {
      expect(formatNullable(null, (v: number) => String(v), 'N/A')).toBe('N/A');
    });
  });
});
