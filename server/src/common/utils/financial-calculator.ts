/**
 * Financial Calculator Utility
 * Centralizes all mathematical formulas used for money logic in the platform.
 */
export class FinancialCalculator {
  /**
   * Rounds a money value to 2 decimal places using fixed precision.
   * Prevents penny gaps and floating point errors.
   */
  static round(amount: number): number {
    return Math.round(amount);
  }

  /**
   * Converts a commission rate to a fraction for multiplication.
   * Handles both percentage input (5) and fraction input (0.05).
   */
  static toCommissionFraction(rate: number | null | undefined): number {
    const raw = Number(rate || 0);
    if (!Number.isFinite(raw) || raw <= 0) return 0;
    // Auto-detect: if > 1, assume it's percentage (5 -> 5%). If <= 1, assume fraction (0.05).
    return raw > 1 ? raw / 100 : raw;
  }

  /**
   * Calculates platform commission amount from a gross total.
   */
  static calculateCommission(
    amount: number,
    rate: number | null | undefined,
  ): number {
    const fraction = this.toCommissionFraction(rate);
    return Math.round(amount * fraction);
  }

  /**
   * Calculates total debt:
   * Principal + Interest + (Interest * PlatformFeeRate)
   */
  static calculateTotalDebt(
    principal: number,
    interestRatePercent: number,
    durationMonths: number,
    commissionRate?: number | null,
  ): number {
    const P = Number(principal) || 0;
    const R = (Number(interestRatePercent) || 0) / 100;
    const T = (Number(durationMonths) || 0) / 12;
    const feeRate = this.toCommissionFraction(commissionRate);

    const totalInterest = P * R * T;
    const platformFee = totalInterest * feeRate;

    return Math.round(P + totalInterest + platformFee);
  }

  /**
   * Calculates the net amount after platform fee.
   */
  static calculateNetAfterFee(
    gross: number,
    rate: number | null | undefined,
  ): number {
    const fee = this.calculateCommission(gross, rate);
    return this.round(gross - fee);
  }
}
