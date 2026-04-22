export type Profile = {
  id: number;
  role: string;
};

export type Me = Profile;

export type UserProfile = {
  id: number;
  slug: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  bio?: string;
  address?: string;
  isVerified?: boolean;
  balance?: number | string;
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  favoriteCategories?: { id: number; name: string }[];
  blacklistCategories?: { id: number; name: string }[];
  notificationSettings?: Record<string, boolean>;
  createdAt: string;
};
