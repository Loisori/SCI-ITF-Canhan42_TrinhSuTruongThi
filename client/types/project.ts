export type ProjectCategory = {
  id: number;
  name: string;
  slug: string;
  iconUrl?: string | null;
};

export type ProjectOwner = {
  id: number;
  slug?: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
  } | null;
  address?: string | null;
};

export type ProjectMilestone = {
  id: number;
  title: string;
  content?: string | null;
  percentage: number;
  stage: number;
  status:
    | "pending"
    | "uploading_proof"
    | "voting"
    | "admin_review"
    | "disbursed"
    | "completed"
    | "rejected"
    | "disputed";
  evidenceUrls?: string[] | null;
  disbursementDate?: string | null;
  votingEndsAt?: string | null;
  nextDisbursementDate?: string | null;
  createdAt: string;
};

export type ProjectDispute = {
  id: number;
  userId: number;
  reason: string;
  evidenceUrl: string | null;
  status: "open" | "resolved" | "refunded";
  createdAt: string;
};

export type Project = {
  id: number;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  slug?: string;
  targetCapital: number | string;
  currentCapital: number | string;
  currentAmount?: number | string;
  fundingProgress: number;
  interestRate: number | string;
  durationMonths: number;
  status: string;
  endDate?: string | null;
  category?: ProjectCategory | null;
  owner?: ProjectOwner | null;
  address?: string | null;
};

export type ProjectDetail = {
  id: number;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  images: string[];
  targetCapital: number | string;
  currentCapital: number | string;
  currentAmount?: number | string;
  fundingProgress: number;
  interestRate: number | string;
  durationMonths: number;
  minInvestment: number | string;
  status: string;
  endDate: string | null;
  totalDebt?: number | string;
  content: string | null;
  category?: ProjectCategory | null;
  owner?: ProjectOwner | null;
  isFrozen?: boolean;
  milestones?: ProjectMilestone[];
  disputes?: ProjectDispute[];
  createdAt: string;
  address?: string | null;
};

export type PendingProject = {
  id: number;
  title: string;
  shortDescription: string | null;
  status: string;
  targetCapital: number;
  currentCapital: number;
  owner: ProjectOwner | null;
  category: ProjectCategory | null;
  createdAt: string;
};
