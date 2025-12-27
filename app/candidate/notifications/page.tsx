'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import NotificationItem from '@/components/notifications/NotificationItem';
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
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Mark all as read
            </button>
          )}
        </div>

        <Card padding="none">
          {notifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500">
                We&apos;ll notify you only when something meaningful happens.
              </p>
            </div>
          )}
        </Card>
      </PageContainer>
    </PageWrapper>
  );
}
