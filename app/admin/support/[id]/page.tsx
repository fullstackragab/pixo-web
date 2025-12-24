'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

// API response types (using strings as returned by backend)
interface SupportMessageDetail {
  id: string;
  userId?: string;
  userType?: string;
  userEmail?: string;
  contactEmail?: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function AdminSupportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const messageId = params.id as string;

  const [message, setMessage] = useState<SupportMessageDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadMessage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<SupportMessageDetail>(`/admin/support/messages/${messageId}`);
      if (res.success && res.data) {
        setMessage(res.data);
      } else {
        setError(res.error || 'Failed to load message');
      }
    } catch (err) {
      console.error('Failed to load support message:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [messageId]);

  useEffect(() => {
    if (messageId) {
      loadMessage();
    }
  }, [messageId, loadMessage]);

  const updateStatus = async (newStatus: string) => {
    if (!message) return;
    setIsUpdating(true);
    try {
      const res = await api.put(`/admin/support/messages/${messageId}/status`, { status: newStatus });
      if (res.success) {
        setMessage({ ...message, status: newStatus });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="primary">New</Badge>;
      case 'read':
        return <Badge variant="warning">Read</Badge>;
      case 'replied':
        return <Badge variant="success">Replied</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getUserTypeLabel = (userType: string | undefined) => {
    if (!userType) return 'Guest';
    switch (userType) {
      case 'candidate':
        return 'Candidate';
      case 'company':
        return 'Company';
      case 'admin':
        return 'Admin';
      case 'anonymous':
        return 'Guest';
      default:
        return userType;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Button variant="ghost" onClick={() => router.push('/admin/support')} className="mb-4">
          &larr; Back to Messages
        </Button>
        <Card>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadMessage}>Try Again</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!message) {
    return (
      <div>
        <Button variant="ghost" onClick={() => router.push('/admin/support')} className="mb-4">
          &larr; Back to Messages
        </Button>
        <Card>
          <p className="text-gray-500 text-center py-8">Message not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" onClick={() => router.push('/admin/support')} className="mb-4">
        &larr; Back to Messages
      </Button>

      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{message.subject}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                <span>{getUserTypeLabel(message.userType)}</span>
                <span className="hidden sm:inline">&bull;</span>
                <span>{formatDate(message.createdAt)}</span>
              </div>
              {message.userEmail && (
                <p className="text-sm text-gray-600">User: {message.userEmail}</p>
              )}
              {message.contactEmail && (
                <p className="text-sm text-gray-600">Contact email: {message.contactEmail}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(message.status)}
            </div>
          </div>
        </Card>

        {/* Message Content Card */}
        <Card>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Message</h2>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-900 whitespace-pre-wrap">{message.message}</p>
          </div>
        </Card>

        {/* Status Update Card */}
        <Card>
          <h2 className="text-sm font-medium text-gray-500 mb-3">Update Status</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={message.status === 'new' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => updateStatus('new')}
              disabled={isUpdating || message.status === 'new'}
            >
              New
            </Button>
            <Button
              variant={message.status === 'read' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => updateStatus('read')}
              disabled={isUpdating || message.status === 'read'}
            >
              Read
            </Button>
            <Button
              variant={message.status === 'replied' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => updateStatus('replied')}
              disabled={isUpdating || message.status === 'replied'}
            >
              Replied
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
