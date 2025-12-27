'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api from '@/lib/api';

interface AdminCandidate {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  desiredRole: string | null;
  availability: string | number;
  seniorityEstimate: string | number | null;
  profileVisible: boolean;
  profileStatus: 'pending_review' | 'approved' | 'rejected' | null;
  hasCv: boolean;
  cvFileName: string | null;
  skillsCount: number;
  profileViewsCount: number;
  recommendationsCount: number;
  createdAt: string;
  lastActiveAt: string;
}

// Normalize availability to lowercase string
const normalizeAvailability = (availability: string | number): string => {
  if (typeof availability === 'number') {
    const availabilityMap: Record<number, string> = {
      0: 'open',
      1: 'notnow',
      2: 'passive'
    };
    return availabilityMap[availability] || 'open';
  }
  return availability.toLowerCase().replace(/\s+/g, '');
};

// Normalize seniority to lowercase string
const normalizeSeniority = (seniority: string | number | null): string | null => {
  if (seniority === null || seniority === undefined) return null;
  if (typeof seniority === 'number') {
    const seniorityMap: Record<number, string> = {
      0: 'junior',
      1: 'mid',
      2: 'senior',
      3: 'lead',
      4: 'principal'
    };
    return seniorityMap[seniority] || null;
  }
  return seniority.toLowerCase();
};

interface PaginatedResponse {
  items: AdminCandidate[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type FilterStatus = 'all' | 'pending_review' | 'approved' | 'no_cv';

export default function AdminCandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  useEffect(() => {
    loadCandidates();
  }, [page, filterStatus]);

  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      let url = `/admin/candidates?page=${page}&pageSize=${pageSize}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (filterStatus !== 'all') url += `&status=${filterStatus}`;

      const res = await api.get<PaginatedResponse>(url);
      if (res.success && res.data) {
        const loadedCandidates = res.data.items || [];
        setCandidates(loadedCandidates);
        setTotalCount(res.data.totalCount || 0);
        // Calculate pending count from loaded candidates
        const pending = loadedCandidates.filter(
          (c: AdminCandidate) => c.hasCv && c.profileStatus === 'pending_review'
        ).length;
        setPendingCount(pending);
      } else {
        setCandidates([]);
        setTotalCount(0);
        setPendingCount(0);
      }
    } catch (error) {
      console.error('Failed to load candidates:', error);
      setCandidates([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadCandidates();
  };

  const handleApprove = async (candidateId: string) => {
    const res = await api.post(`/admin/candidates/${candidateId}/approve`);
    if (res.success) {
      setCandidates(candidates.map(c =>
        c.id === candidateId ? { ...c, profileStatus: 'approved', profileVisible: true } : c
      ));
      setPendingCount(prev => Math.max(0, prev - 1));
    }
  };

  const toggleVisibility = async (candidateId: string, visible: boolean) => {
    const res = await api.put(`/admin/candidates/${candidateId}/visibility`, { visible });
    if (res.success) {
      setCandidates(candidates.map(c =>
        c.id === candidateId ? { ...c, profileVisible: visible } : c
      ));
    }
  };

  const getAvailabilityBadge = (availability: string | number) => {
    const normalized = normalizeAvailability(availability);
    switch (normalized) {
      case 'open':
        return <Badge variant="success">Open</Badge>;
      case 'passive':
        return <Badge variant="warning">Passive</Badge>;
      case 'notnow':
        return <Badge variant="default">Not Looking</Badge>;
      default:
        return <Badge variant="default">{normalized}</Badge>;
    }
  };

  const getProfileStatusBadge = (candidate: AdminCandidate) => {
    if (!candidate.hasCv) {
      return <Badge variant="danger">No CV</Badge>;
    }
    switch (candidate.profileStatus) {
      case 'pending_review':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="warning">Pending Review</Badge>;
    }
  };

  const getSeniorityLabel = (seniority: string | number | null) => {
    const normalized = normalizeSeniority(seniority);
    if (normalized === null) return '-';
    const labelMap: Record<string, string> = {
      'junior': 'Junior',
      'mid': 'Mid',
      'senior': 'Senior',
      'lead': 'Lead',
      'principal': 'Principal'
    };
    return labelMap[normalized] || normalized;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">{totalCount} total candidates</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            <p className="text-sm font-medium text-yellow-800">
              {pendingCount} pending review
            </p>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => { setFilterStatus('all'); setPage(1); }}
          className={`p-4 rounded-lg border transition-colors text-left ${
            filterStatus === 'all'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          <p className="text-sm text-gray-500">All Candidates</p>
        </button>
        <button
          onClick={() => { setFilterStatus('pending_review'); setPage(1); }}
          className={`p-4 rounded-lg border transition-colors text-left ${
            filterStatus === 'pending_review'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
          <p className="text-sm text-gray-500">Pending Review</p>
        </button>
        <button
          onClick={() => { setFilterStatus('approved'); setPage(1); }}
          className={`p-4 rounded-lg border transition-colors text-left ${
            filterStatus === 'approved'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-green-600">
            {candidates.filter(c => c.profileStatus === 'approved').length || '-'}
          </p>
          <p className="text-sm text-gray-500">Approved</p>
        </button>
        <button
          onClick={() => { setFilterStatus('no_cv'); setPage(1); }}
          className={`p-4 rounded-lg border transition-colors text-left ${
            filterStatus === 'no_cv'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 bg-white hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-red-600">
            {candidates.filter(c => !c.hasCv).length || '-'}
          </p>
          <p className="text-sm text-gray-500">No CV</p>
        </button>
      </div>

      {/* Filters */}
      <Card className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div className="flex-1 min-w-0 sm:min-w-[200px]">
            <Input
              label="Search"
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, email, or skills..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} className="w-full sm:w-auto">Search</Button>
        </div>
      </Card>

      {/* Candidates Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : candidates.length > 0 ? (
          <>
            {/* Mobile card view */}
            <div className="md:hidden space-y-4">
              {candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => router.push(`/admin/candidates/${candidate.id}`)}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    candidate.profileStatus === 'pending_review' && candidate.hasCv
                      ? 'border-yellow-300 bg-yellow-50/50 hover:bg-yellow-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900">
                        {candidate.firstName && candidate.lastName
                          ? `${candidate.firstName} ${candidate.lastName}`
                          : 'No name'}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{candidate.email}</p>
                      {candidate.desiredRole && (
                        <p className="text-sm text-gray-500 truncate">{candidate.desiredRole}</p>
                      )}
                    </div>
                    {getProfileStatusBadge(candidate)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">CV:</span>
                      <span className={`ml-1 ${candidate.hasCv ? 'text-green-600' : 'text-red-600'}`}>
                        {candidate.hasCv ? 'Uploaded' : 'Missing'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Seniority:</span>
                      <span className="ml-1 text-gray-900">{getSeniorityLabel(candidate.seniorityEstimate)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Skills:</span>
                      <span className="ml-1 text-gray-900">{candidate.skillsCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      {getAvailabilityBadge(candidate.availability)}
                    </div>
                  </div>

                  {candidate.hasCv && candidate.profileStatus === 'pending_review' && (
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(candidate.id);
                        }}
                      >
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CV</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seniority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Availability</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skills</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {candidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      onClick={() => router.push(`/admin/candidates/${candidate.id}`)}
                      className={`cursor-pointer ${
                        candidate.profileStatus === 'pending_review' && candidate.hasCv
                          ? 'bg-yellow-50/50 hover:bg-yellow-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {candidate.firstName && candidate.lastName
                              ? `${candidate.firstName} ${candidate.lastName}`
                              : 'No name'}
                          </p>
                          <p className="text-sm text-gray-500">{candidate.email}</p>
                          {candidate.desiredRole && (
                            <p className="text-xs text-gray-400 truncate max-w-xs">{candidate.desiredRole}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {candidate.hasCv ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm">Uploaded</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm">Missing</span>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {getProfileStatusBadge(candidate)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {getSeniorityLabel(candidate.seniorityEstimate)}
                      </td>
                      <td className="px-4 py-3">
                        {getAvailabilityBadge(candidate.availability)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{candidate.skillsCount}</td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {formatDate(candidate.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {candidate.hasCv && candidate.profileStatus === 'pending_review' && (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(candidate.id);
                              }}
                            >
                              Approve
                            </Button>
                          )}
                          {candidate.profileStatus === 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVisibility(candidate.id, !candidate.profileVisible);
                              }}
                            >
                              {candidate.profileVisible ? 'Hide' : 'Show'}
                            </Button>
                          )}
                        </div>
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
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500">No candidates found</p>
            {filterStatus !== 'all' && (
              <Button variant="outline" className="mt-4" onClick={() => setFilterStatus('all')}>
                Clear filters
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Info panel about review workflow */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Review Workflow</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Candidates upload their CV during onboarding</li>
          <li>2. CV is parsed to extract skills, experience, and seniority</li>
          <li>3. Admin reviews and normalizes skills into capability groups</li>
          <li>4. Upon approval, profile becomes visible to companies</li>
        </ul>
        <p className="text-xs text-blue-600 mt-2">
          Candidates without CVs cannot be matched or shown to companies.
        </p>
      </div>
    </div>
  );
}
