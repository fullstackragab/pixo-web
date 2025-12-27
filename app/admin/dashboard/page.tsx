'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

interface AdminDashboard {
  totalCandidates: number;
  activeCandidates: number;
  totalCompanies: number;
  activeSubscriptions: number;
  pendingShortlists: number;
  completedShortlists: number;
  totalRevenue: number;
  pendingRecommendations?: number;
  pendingCandidates?: number;
  newCompanies?: number;
  recentShortlists: Array<{
    id: string;
    companyName: string;
    roleTitle: string;
    status: string;
    createdAt: string;
  }>;
}

interface ActionItem {
  label: string;
  count: number;
  href: string;
  color: 'amber' | 'blue' | 'purple' | 'green';
  icon: React.ReactNode;
}

const colorClasses = {
  amber: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
  blue: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
  purple: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100',
  green: 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100',
};

function ActionRequiredSection({ items }: { items: ActionItem[] }) {
  if (items.length === 0) {
    return (
      <div className="mb-6 sm:mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 text-gray-600">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>All caught up! No pending actions.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Action Required</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${colorClasses[item.color]}`}>
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-sm truncate">{item.label}</p>
              </div>
              <svg className="w-5 h-5 flex-shrink-0 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<AdminDashboard>('/admin/dashboard');
      if (res.success && res.data) {
        setDashboard(res.data);
      } else {
        setError(res.error || 'Failed to load dashboard');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'processing':
        return <Badge variant="primary">Processing</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button
            onClick={() => { setError(null); loadDashboard(); }}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      {/* Action Required Section */}
      {dashboard && (
        <ActionRequiredSection
          items={[
            {
              label: 'Shortlists to review',
              count: dashboard.pendingShortlists || 0,
              href: '/admin/shortlists?status=pending',
              color: 'amber' as const,
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
            },
            {
              label: 'Candidates to approve',
              count: dashboard.pendingCandidates || 0,
              href: '/admin/candidates?status=pending_review',
              color: 'blue' as const,
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              ),
            },
            {
              label: 'Recommendations pending',
              count: dashboard.pendingRecommendations || 0,
              href: '/admin/recommendations',
              color: 'purple' as const,
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ),
            },
            {
              label: 'New companies',
              count: dashboard.newCompanies || 0,
              href: '/admin/companies',
              color: 'green' as const,
              icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ),
            },
          ].filter(item => item.count > 0)}
        />
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Link href="/admin/candidates">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Candidates</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard?.totalCandidates || 0}</p>
                <p className="text-xs text-gray-500">{dashboard?.activeCandidates || 0} active</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/companies">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Companies</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard?.totalCompanies || 0}</p>
                <p className="text-xs text-gray-500">{dashboard?.activeSubscriptions || 0} subscribed</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/shortlists">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Shortlists</p>
                <p className="text-2xl font-bold text-gray-900">{dashboard?.pendingShortlists || 0}</p>
                <p className="text-xs text-gray-500">pending review</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/shortlists?status=completed">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${(dashboard?.totalRevenue || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500">{dashboard?.completedShortlists || 0} shortlists</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Recent Shortlists */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Shortlist Requests</h2>
          <Link href="/admin/shortlists">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>

        {dashboard?.recentShortlists && dashboard.recentShortlists.length > 0 ? (
          <>
            {/* Mobile card view */}
            <div className="sm:hidden space-y-3">
              {dashboard.recentShortlists.map((shortlist) => (
                <Link key={shortlist.id} href={`/admin/shortlists/${shortlist.id}`}>
                  <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{shortlist.companyName}</p>
                        <p className="text-sm text-gray-600">{shortlist.roleTitle}</p>
                      </div>
                      {getStatusBadge(shortlist.status)}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        {new Date(shortlist.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dashboard.recentShortlists.map((shortlist) => (
                    <tr
                      key={shortlist.id}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/admin/shortlists/${shortlist.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{shortlist.companyName}</td>
                      <td className="px-4 py-3 text-gray-600">{shortlist.roleTitle}</td>
                      <td className="px-4 py-3">{getStatusBadge(shortlist.status)}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {new Date(shortlist.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-center py-8">No shortlist requests yet</p>
        )}
      </Card>
    </div>
  );
}
