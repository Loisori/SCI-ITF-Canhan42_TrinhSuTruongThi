export type Profile = {
  role: string;
};

export type Me = Profile;

export type UserProfile = {
  id: number;
  fullName: string;
  email: string;
  balance: number | string;
  role: string;
  createdAt: string;
};
