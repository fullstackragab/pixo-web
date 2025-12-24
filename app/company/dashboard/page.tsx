'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { CompanyProfile, ShortlistRequest, ShortlistStatus } from '@/types';

export default function CompanyDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [shortlists, setShortlists] = useState<ShortlistRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user]);

  const loadData = async () => {
    setIsLoading(true);
    const [profileRes, shortlistsRes] = await Promise.all([
      api.get<CompanyProfile>('/companies/profile'),
      api.get<ShortlistRequest[]>('/shortlists')
    ]);

    if (profileRes.success && profileRes.data) {
      setProfile(profileRes.data);
    }
    if (shortlistsRes.success && shortlistsRes.data) {
      setShortlists(shortlistsRes.data.slice(0, 5));
    }
    setIsLoading(false);
  };

  const getShortlistStatusBadge = (status: ShortlistStatus) => {
    switch (status) {
      case ShortlistStatus.Pending:
        return <Badge variant="warning">Pending</Badge>;
      case ShortlistStatus.Processing:
        return <Badge variant="primary">Processing</Badge>;
      case ShortlistStatus.Completed:
        return <Badge variant="success">Completed</Badge>;
      case ShortlistStatus.Cancelled:
        return <Badge variant="danger">Cancelled</Badge>;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome{profile?.companyName ? `, ${profile.companyName}` : ''}!
            </h1>
            <p className="text-gray-600 mt-1">
              Find and connect with top tech talent
            </p>
          </div>
          <Link href="/company/talent">
            <Button>Browse Talent</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stats */}
          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Active Shortlists</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {shortlists.filter(s => s.status !== ShortlistStatus.Completed && s.status !== ShortlistStatus.Cancelled).length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">Total Shortlists</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{shortlists.length}</p>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <Card className="hover:shadow-md transition-shadow">
            <Link href="/company/talent" className="block">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">Browse Talent</p>
                  <p className="text-sm text-gray-500">Search and filter candidates</p>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <Link href="/company/shortlists" className="block">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">Request Shortlist</p>
                  <p className="text-sm text-gray-500">Get curated candidates</p>
                </div>
              </div>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <Link href="/company/saved" className="block">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">Saved Candidates</p>
                  <p className="text-sm text-gray-500">View your bookmarks</p>
                </div>
              </div>
            </Link>
          </Card>
        </div>

        {/* Recent Shortlists */}
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Shortlists</h2>
            <Link href="/company/shortlists" className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>

          {shortlists.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidates</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {shortlists.map((shortlist) => (
                    <tr key={shortlist.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Link href={`/company/shortlists/${shortlist.id}`} className="text-blue-600 hover:underline">
                          {shortlist.roleTitle}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{getShortlistStatusBadge(shortlist.status)}</td>
                      <td className="px-4 py-3 text-gray-600">{shortlist.candidatesCount}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {new Date(shortlist.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No shortlists yet</p>
              <Link href="/company/shortlists">
                <Button className="mt-4">Request Your First Shortlist</Button>
              </Link>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
