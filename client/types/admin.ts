export type AdminOverview = {
  pendingCount: number;
  fundingCount: number;
  completedCount: number;
  totalFundingCapital: number;
  totalUsers: number;
  totalProjects: number;
  totalTransactions: number;
  systemRevenue: number;
  commissionRate: number;
};

// export type OwnerProject = Project & {
//   investorsCount: number;
//   netAfterFeeEstimate: number;
// };

export type AdminDashboardUser = {
  id: number;
  fullName: string;
  email: string;
  balance: number | string;
  totalInvested: number;
  totalReceived: number;
  feeCollected: number;
  role: string;
  createdAt: string;
  participatingProjects: Array<{
    id: number;
    title: string;
    fundingProgress: number;
    status: string;
  }>;
};
