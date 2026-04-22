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
    return Number(Number(amount).toFixed(2));
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
    return this.round(amount * fraction);
  }

  /**
   * Calculates total debt:
   * Principal + Interest + Platform fee on interest.
   */
  static calculateTotalDebt(
    principal: number,
    interestRatePercent: number,
    durationMonths: number,
    commissionRate?: number | null,
  ): number {
    const normalizedPrincipal = Number(principal) || 0;
    const normalizedInterestRate = Number(interestRatePercent) || 0;
    const normalizedDuration = Number(durationMonths) || 0;
    const interest =
      normalizedPrincipal *
      (normalizedInterestRate / 100) *
      (normalizedDuration / 12);
    const feeOnInterest = interest * this.toCommissionFraction(commissionRate);

    return this.round(normalizedPrincipal + interest + feeOnInterest);
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
