import { FinancialCalculator } from './financial-calculator';

describe('FinancialCalculator', () => {
  describe('calculateTotalDebt', () => {
    it('should calculate principal + interest + fee-on-interest when rate is percent', () => {
      // Principal 100,000 + Interest 12,000 + Fee 1,200 = 113,200
      const totalDebt = FinancialCalculator.calculateTotalDebt(
        100000,
        12,
        12,
        10,
      );

      expect(totalDebt).toBe(113200);
    });

    it('should support commission rate as fraction', () => {
      const totalDebt = FinancialCalculator.calculateTotalDebt(
        100000,
        12,
        12,
        0.1,
      );

      expect(totalDebt).toBe(113200);
    });

    it('should keep backward compatibility when commission rate is missing', () => {
      const totalDebt = FinancialCalculator.calculateTotalDebt(100000, 12, 12);

      expect(totalDebt).toBe(112000);
    });
  });
});
