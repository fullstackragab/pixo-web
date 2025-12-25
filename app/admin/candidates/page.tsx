'use client';

import { useState, useEffect } from 'react';
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
  skillsCount: number;
  profileViewsCount: number;
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

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<AdminCandidate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<'all' | 'visible' | 'hidden'>('all');

  useEffect(() => {
    loadCandidates();
  }, [page, filterVisibility]);

  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      let url = `/admin/candidates?page=${page}&pageSize=${pageSize}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (filterVisibility !== 'all') url += `&visible=${filterVisibility === 'visible'}`;

      const res = await api.get<PaginatedResponse>(url);
      if (res.success && res.data) {
        setCandidates(res.data.items || []);
        setTotalCount(res.data.totalCount || 0);
      } else {
        setCandidates([]);
        setTotalCount(0);
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

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">{totalCount} total candidates</p>
        </div>
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
              placeholder="Name or email..."
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value as 'all' | 'visible' | 'hidden')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
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
                <div key={candidate.id} className="border border-gray-200 rounded-lg p-4">
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
                    {getAvailabilityBadge(candidate.availability)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Seniority:</span>
                      <span className="ml-1 text-gray-900">{getSeniorityLabel(candidate.seniorityEstimate)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Skills:</span>
                      <span className="ml-1 text-gray-900">{candidate.skillsCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Views:</span>
                      <span className="ml-1 text-gray-900">{candidate.profileViewsCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Visible:</span>
                      <Badge variant={candidate.profileVisible ? 'success' : 'default'} className="ml-1">
                        {candidate.profileVisible ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleVisibility(candidate.id, !candidate.profileVisible)}
                    >
                      {candidate.profileVisible ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seniority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Skills</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visible</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {candidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {candidate.firstName && candidate.lastName
                            ? `${candidate.firstName} ${candidate.lastName}`
                            : 'No name'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{candidate.email}</td>
                      <td className="px-4 py-3 text-gray-600 text-sm max-w-50 truncate">
                        {candidate.desiredRole || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {getSeniorityLabel(candidate.seniorityEstimate)}
                      </td>
                      <td className="px-4 py-3">
                        {getAvailabilityBadge(candidate.availability)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{candidate.skillsCount}</td>
                      <td className="px-4 py-3 text-gray-600">{candidate.profileViewsCount}</td>
                      <td className="px-4 py-3">
                        <Badge variant={candidate.profileVisible ? 'success' : 'default'}>
                          {candidate.profileVisible ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleVisibility(candidate.id, !candidate.profileVisible)}
                          >
                            {candidate.profileVisible ? 'Hide' : 'Show'}
                          </Button>
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
          <p className="text-gray-500 text-center py-8">No candidates found</p>
        )}
      </Card>
    </div>
  );
}
