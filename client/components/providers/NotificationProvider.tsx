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
    let currentSocket: Socket | null = null;

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

    const connectSocket = () => {
      const token = Cookies.get('access_token');
      if (!token) return null;

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const urlObject = new URL(backendUrl);
      const socketUrl = `${urlObject.protocol}//${urlObject.host}`;

      if (currentSocket) {
        currentSocket.disconnect();
      }

      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => {
        console.log('Socket connected successfully:', newSocket.id);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
      });

      newSocket.on('notification', (newNotification: Notification) => {
        console.log('Received notification via socket:', newNotification);
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show toast popup
        import('react-hot-toast').then((module) => {
          module.default.success(`Thông báo mới: ${newNotification.message}`, {
            duration: 5000,
            icon: '🔔',
          });
        });
      });

      setSocket(newSocket);
      currentSocket = newSocket;
      return newSocket;
    };

    // Initial setup
    if (Cookies.get('access_token')) {
      fetchNotifications();
      connectSocket();
    }

    const handleAuthChange = () => {
      if (!Cookies.get('access_token')) {
        setNotifications([]);
        setUnreadCount(0);
        if (currentSocket) {
          currentSocket.disconnect();
          currentSocket = null;
          setSocket(null);
        }
      } else {
        fetchNotifications();
        connectSocket();
      }
    };

    window.addEventListener('auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
      if (currentSocket) {
        currentSocket.disconnect();
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
