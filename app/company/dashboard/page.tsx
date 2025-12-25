'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Breadcrumb, { companyBreadcrumbs } from '@/components/ui/Breadcrumb';
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

  // Calculate stats
  const pendingCount = shortlists.filter(
    s => s.status === ShortlistStatus.Pending || s.status === ShortlistStatus.Processing
  ).length;
  const completedShortlists = shortlists.filter(s => s.status === ShortlistStatus.Completed);
  const totalCandidatesToReview = completedShortlists.reduce((sum, s) => sum + s.candidatesCount, 0);
  const readyShortlist = completedShortlists.find(s => s.candidatesCount > 0);

  // Dynamic welcome hint based on state
  const getDashboardHint = (): string => {
    if (shortlists.length === 0) {
      return "Request your first shortlist to discover matched candidates";
    }
    if (pendingCount > 0) {
      return `${pendingCount} shortlist${pendingCount > 1 ? 's' : ''} being curated for you`;
    }
    if (readyShortlist) {
      return `${totalCandidatesToReview} candidate${totalCandidatesToReview !== 1 ? 's' : ''} ready for review`;
    }
    return "Browse talent or request a new shortlist to find your next hire";
  };

  // Contextual primary CTA
  const getPrimaryCTA = () => {
    if (readyShortlist) {
      return (
        <div className="flex gap-3">
          <Link href={`/company/shortlists/${readyShortlist.id}`}>
            <Button>Review {readyShortlist.candidatesCount} Candidates</Button>
          </Link>
          <Link href="/company/talent">
            <Button variant="outline">Browse Talent</Button>
          </Link>
        </div>
      );
    }
    if (shortlists.length === 0) {
      return (
        <Link href="/company/shortlists">
          <Button>Request Your First Shortlist</Button>
        </Link>
      );
    }
    return (
      <Link href="/company/talent">
        <Button>Browse Talent</Button>
      </Link>
    );
  };

  // Format relative date
  const formatRelativeDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Get row action based on status
  const getRowAction = (shortlist: ShortlistRequest) => {
    if (shortlist.status === ShortlistStatus.Completed && shortlist.candidatesCount > 0) {
      return (
        <Link href={`/company/shortlists/${shortlist.id}`}>
          <Button size="sm">Review</Button>
        </Link>
      );
    }
    if (shortlist.status === ShortlistStatus.Pending || shortlist.status === ShortlistStatus.Processing) {
      return (
        <span className="text-sm text-gray-400 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          In progress
        </span>
      );
    }
    return (
      <Link href={`/company/shortlists/${shortlist.id}`}>
        <Button variant="outline" size="sm">View</Button>
      </Link>
    );
  };

  const getShortlistStatusBadge = (status: ShortlistStatus) => {
    switch (status) {
      case ShortlistStatus.Pending:
        return (
          <Badge variant="warning" className="gap-1">
            <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
            Pending Review
          </Badge>
        );
      case ShortlistStatus.Processing:
        return (
          <Badge variant="primary" className="gap-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            Being Curated
          </Badge>
        );
      case ShortlistStatus.Completed:
        return <Badge variant="success">Ready</Badge>;
      case ShortlistStatus.Cancelled:
        return <Badge variant="default">Cancelled</Badge>;
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
    <PageWrapper>
      <Header />

      <PageContainer variant="wide">
        <Breadcrumb items={companyBreadcrumbs.dashboard()} />

        {/* Welcome Header with Dynamic CTA */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back{profile?.companyName ? `, ${profile.companyName}` : ''}!
            </h1>
            <p className="text-gray-600 mt-1">
              {getDashboardHint()}
            </p>
          </div>
          <div className="shrink-0">
            {getPrimaryCTA()}
          </div>
        </div>

        {/* Processing Status Banner */}
        {pendingCount > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100">
            <div className="flex items-center gap-4">
              <div className="shrink-0 p-3 bg-blue-100 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-blue-900">
                  {pendingCount === 1 ? 'Your shortlist is being curated' : `${pendingCount} shortlists are being curated`}
                </p>
                <p className="text-sm text-blue-700">
                  Our team is reviewing candidates. You&apos;ll be notified when ready.
                </p>
              </div>
              <Badge variant="primary">Usually within 24h</Badge>
            </div>
          </Card>
        )}

        {/* Recent Shortlists */}
        <Card>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Recent Shortlists</h2>
              {shortlists.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  {shortlists.length}
                </span>
              )}
            </div>
            <Link href="/company/shortlists" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {shortlists.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidates</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {shortlists.map((shortlist) => (
                    <tr
                      key={shortlist.id}
                      className={`group hover:bg-gray-50 transition-colors ${
                        shortlist.status === ShortlistStatus.Completed && shortlist.candidatesCount > 0
                          ? 'bg-green-50/30'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-4">
                        <Link
                          href={`/company/shortlists/${shortlist.id}`}
                          className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors"
                        >
                          {shortlist.roleTitle}
                        </Link>
                        {shortlist.techStackRequired && shortlist.techStackRequired.length > 0 && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {shortlist.techStackRequired.slice(0, 3).join(', ')}
                            {shortlist.techStackRequired.length > 3 && ` +${shortlist.techStackRequired.length - 3}`}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">{getShortlistStatusBadge(shortlist.status)}</td>
                      <td className="px-4 py-4">
                        <span className={`font-medium ${shortlist.candidatesCount > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                          {shortlist.candidatesCount}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatRelativeDate(shortlist.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        {getRowAction(shortlist)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Start your first talent search</h3>
              <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                Tell us what you&apos;re looking for and we&apos;ll curate a shortlist of matched candidates within 24 hours.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/company/shortlists">
                  <Button>Request a Shortlist</Button>
                </Link>
                <Link href="/company/talent">
                  <Button variant="outline">Browse Talent First</Button>
                </Link>
              </div>

              {/* Social Proof */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Trusted by <span className="font-medium text-gray-700">200+ companies</span> to find senior engineers
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Tip for sparse state */}
        {shortlists.length > 0 && shortlists.length < 3 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-blue-900">Tip: Run multiple searches</p>
                <p className="text-sm text-blue-700">Companies that run 3+ shortlists find candidates 2x faster</p>
              </div>
            </div>
            <Link href="/company/shortlists">
              <Button size="sm" variant="outline">New Shortlist</Button>
            </Link>
          </div>
        )}
      </PageContainer>
    </PageWrapper>
  );
}
