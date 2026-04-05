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
  favoriteCategories?: SettingsCategoryRef[];
  blacklistCategories?: SettingsCategoryRef[];
};
