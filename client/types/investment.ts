export type PaymentSchedule = {
  id: number;
  dueDate: string;
  amount: number | string;
  status: string;
  paidAt: string | null;
};

export type Investment = {
  id: number;
  amount: number | string;
  status: string;
  investedAt: string;
  project: {
    id: number;
    title: string;
    slug: string;
    thumbnailUrl: string | null;
    interestRate: number | string;
    durationMonths: number;
  } | null;
  paymentSchedules: PaymentSchedule[];
};
