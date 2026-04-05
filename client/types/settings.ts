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
  favoriteCategories?: SettingsCategoryRef[];
  blacklistCategories?: SettingsCategoryRef[];
};
