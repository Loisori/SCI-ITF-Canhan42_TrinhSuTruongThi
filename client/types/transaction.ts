export type Transaction = {
  id: number;
  amount: number | string;
  type: string;
  status: string;
  description: string | null;
  referenceId: number | null;
  createdAt: string;
};
