import React from "react";

export type Notification = {
  id: number;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

export type NotificationProviderProps = {
  children: React.ReactNode;
};
