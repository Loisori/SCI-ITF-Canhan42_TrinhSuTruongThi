export type Profile = {
  role: string;
};

export type Me = Profile;

export type UserProfile = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  isVerified?: boolean;
  balance?: number | string;
  favoriteCategories?: { id: number; name: string }[];
  blacklistCategories?: { id: number; name: string }[];
  notificationSettings?: Record<string, boolean>;
  createdAt: string;
};
