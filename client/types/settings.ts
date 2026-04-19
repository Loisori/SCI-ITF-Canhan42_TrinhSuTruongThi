export type SettingsCategoryRef = {
  id: number;
  name: string;
};

export type SettingsUser = {
  id: string;
  fullName: string;
  email: string;
  balance: number;
  role: string;
  avatarUrl?: string;
  bio?: string | null;
  address?: string | null;
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
  } | null;
  favoriteCategories?: SettingsCategoryRef[];
  blacklistCategories?: SettingsCategoryRef[];
};
