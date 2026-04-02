export type ProjectCategory = {
  id: number;
  name: string;
  slug: string;
  iconUrl?: string | null;
};

export type ProjectOwner = {
  id: number;
  fullName: string;
  email: string;
};

export type ProjectMilestone = {
  id: number;
  title: string;
  percentage: number;
  stage: number;
  status: 'pending' | 'uploading_proof' | 'admin_review' | 'disbursed';
  proofUrl: string | null;
  createdAt: string;
};

export type ProjectDispute = {
  id: number;
  userId: number;
  reason: string;
  evidenceUrl: string | null;
  status: 'open' | 'resolved' | 'refunded';
  createdAt: string;
};

export type Project = {
  id: number;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  contentSlug?: string;
  targetCapital: number | string;
  currentCapital: number | string;
  fundingProgress: number;
  interestRate: number | string;
  durationMonths: number;
  status: string;
  category?: ProjectCategory | null;
  owner?: ProjectOwner | null;
};

export type ProjectDetail = {
  id: number;
  title: string;
  shortDescription: string | null;
  thumbnailUrl: string | null;
  images: string[];
  targetCapital: number | string;
  currentCapital: number | string;
  fundingProgress: number;
  interestRate: number | string;
  durationMonths: number;
  minInvestment: number | string;
  status: string;
  endDate: string | null;
  content: string | null;
  category?: ProjectCategory | null;
  owner?: ProjectOwner | null;
  isFrozen?: boolean;
  milestones?: ProjectMilestone[];
  disputes?: ProjectDispute[];
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
