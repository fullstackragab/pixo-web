'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import api from '@/lib/api';
import { Notification } from '@/types';

export default function CandidateNotificationsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      loadNotifications();
    }
  }, [authLoading, user]);

  const loadNotifications = async () => {
    setIsLoading(true);
    const res = await api.get<Notification[]>('/candidates/notifications');
    if (res.success && res.data) {
      setNotifications(res.data);
    }
    setIsLoading(false);
  };

  const markAsRead = async (notificationId: string) => {
    // Optimistically update UI first for immediate feedback
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    ));
    // Then persist to backend
    await api.put(`/notifications/${notificationId}/read`);
  };

  const markAllAsRead = async () => {
    // Optimistically update UI first for immediate feedback
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    // Then persist to backend
    await api.put('/notifications/read-all');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <PageWrapper>
      <Header />

      <PageContainer variant="default">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Mark all as read
            </button>
          )}
        </div>

        <Card>
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.isRead && markAsRead(notification.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    notification.isRead ? 'bg-white' : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && <Badge variant="primary">New</Badge>}
                      </div>
                      {notification.message && (
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-gray-500 mt-2">No notifications yet</p>
            </div>
          )}
        </Card>
      </PageContainer>
    </PageWrapper>
  );
}
