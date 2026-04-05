"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import api from '@/lib/axios';
import {
  Notification,
  NotificationContextType,
  NotificationProviderProps,
} from '@/types/notification';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = Cookies.get('access_token');
        if (!token) return;

        const res = await api.get('/api/notifications');
        setNotifications(res.data.items);
        setUnreadCount(res.data.unreadCount);
      } catch (error) {
        console.error("Failed to fetch initial notifications:", error);
      }
    };

    fetchNotifications();

    const connectSocket = () => {
      const token = Cookies.get('access_token');
      if (!token) return;

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      // socket.io automatically uses the hostname if not provided, but we can specify it
      // using the URL without "/api"
      const urlObject = new URL(backendUrl);
      const socketUrl = `${urlObject.protocol}//${urlObject.host}`;

      const newSocket = io(socketUrl, {
        auth: { token },
      });

      newSocket.on('notification', (newNotification: Notification) => {
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Optional: show a browser native notification or a toaster popup here
      });

      setSocket(newSocket);

      return newSocket;
    };

    const socketInstance = connectSocket();

    const handleAuthChange = () => {
      if (!Cookies.get('access_token')) {
        setNotifications([]);
        setUnreadCount(0);
        if (socketInstance) {
          socketInstance.disconnect();
        }
      } else {
        fetchNotifications();
        connectSocket();
      }
    };

    window.addEventListener('auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  }), [notifications, unreadCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
