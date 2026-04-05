export type ProjectOwner = {
  id: number;
  fullName: string;
  email: string;
};

export type PendingProject = {
  id: number;
  title: string;
  shortDescription: string | null;
  status: string;
  targetCapital: number;
  currentCapital: number;
  owner: ProjectOwner | null;
  category: {
    id: number;
    name: string;
    slug: string;
    iconUrl?: string | null;
  } | null;
  createdAt: string;
};
