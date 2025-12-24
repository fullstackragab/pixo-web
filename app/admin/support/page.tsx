'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

// API response types (using strings as returned by backend)
interface SupportMessageListItem {
  id: string;
  subject: string;
  userType?: string;
  status: string;
  createdAt: string;
}

interface PaginatedResponse {
  items: SupportMessageListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<SupportMessageListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = `/admin/support/messages?page=${page}&pageSize=${pageSize}`;
      const res = await api.get<PaginatedResponse | SupportMessageListItem[]>(url);
      if (res.success && res.data) {
        // Handle both paginated response and direct array response
        if (Array.isArray(res.data)) {
          setMessages(res.data);
          setTotalCount(res.data.length);
        } else {
          setMessages(res.data.items || []);
          setTotalCount(res.data.totalCount || 0);
        }
      } else {
        setMessages([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Failed to load support messages:', error);
      setMessages([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Support Messages</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">{totalCount} total messages</p>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length > 0 ? (
          <>
            {/* Mobile card view */}
            <div className="md:hidden space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => router.push(`/admin/support/${message.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-gray-900 line-clamp-1">{message.subject}</p>
                    {getStatusBadge(message.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{getUserTypeLabel(message.userType)}</span>
                    <span>{formatDate(message.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {messages.map((message) => (
                    <tr
                      key={message.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/admin/support/${message.id}`)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{message.subject}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {getUserTypeLabel(message.userType)}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(message.status)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {formatDate(message.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 pt-4 mt-4">
                <p className="text-sm text-gray-500 order-2 sm:order-1">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount}
                </p>
                <div className="flex gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-500 text-center py-8">No support messages yet</p>
        )}
      </Card>
    </div>
  );
}
