'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { SeniorityLevel, Availability, ShortlistPricingType } from '@/types';

interface ShortlistCandidate {
  id: string;
  candidateId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  desiredRole: string | null;
  seniorityEstimate: SeniorityLevel | null;
  availability: Availability;
  matchScore: number;
  matchReason: string | null;
  rank: number;
  adminApproved: boolean;
  skills: string[];
  // Versioning fields
  isNew?: boolean;
  previouslyRecommendedIn?: string | null;
  reInclusionReason?: string | null;
  statusLabel?: string;
}

interface ShortlistChainItem {
  id: string;
  roleTitle: string;
  createdAt: string;
  candidatesCount: number;
}

interface ShortlistDetail {
  id: string;
  companyId: string;
  companyName: string;
  roleTitle: string;
  techStackRequired?: string[];
  seniorityRequired?: SeniorityLevel | null;
  locationPreference?: string | null;
  remoteAllowed?: boolean;
  additionalNotes?: string | null;
  status: string; // Normalized to lowercase string
  pricePaid: number | null;
  createdAt: string;
  completedAt: string | null;
  candidates?: ShortlistCandidate[];
  // Versioning fields
  previousRequestId?: string | null;
  pricingType?: ShortlistPricingType;
  followUpDiscount?: number;
  isFollowUp?: boolean;
  newCandidatesCount?: number;
  repeatedCandidatesCount?: number;
  chain?: ShortlistChainItem[];
}

// Helper to normalize status to lowercase string
const normalizeStatus = (status: string | number): string => {
  if (typeof status === 'number') {
    const statusMap: Record<number, string> = {
      0: 'pending',
      1: 'processing',
      2: 'completed',
      3: 'cancelled'
    };
    return statusMap[status] || 'pending';
  }
  return status.toLowerCase();
};

// Helper to normalize seniority from string to enum
const normalizeSeniority = (seniority: string | SeniorityLevel | null | undefined): SeniorityLevel | null => {
  if (seniority === null || seniority === undefined) return null;
  if (typeof seniority === 'number') return seniority;
  const seniorityMap: Record<string, SeniorityLevel> = {
    'junior': SeniorityLevel.Junior,
    'mid': SeniorityLevel.Mid,
    'senior': SeniorityLevel.Senior,
    'lead': SeniorityLevel.Lead,
    'principal': SeniorityLevel.Principal
  };
  return seniorityMap[seniority.toLowerCase()] ?? null;
};

// Helper to parse techStackRequired which may come as JSON string
const parseTechStack = (techStack: string[] | string | undefined): string[] => {
  if (!techStack) return [];
  if (Array.isArray(techStack)) return techStack;
  try {
    const parsed = JSON.parse(techStack);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function ShortlistDetailPage() {
  const params = useParams();
  const shortlistId = params.id as string;

  const [shortlist, setShortlist] = useState<ShortlistDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShortlist();
  }, [shortlistId]);

  const loadShortlist = async () => {
    setIsLoading(true);
    setError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await api.get<any>(`/admin/shortlists/${shortlistId}`);
    if (res.success && res.data) {
      // Normalize the data from backend
      const data = res.data;
      const normalizedData: ShortlistDetail = {
        ...data,
        status: normalizeStatus(data.status),
        techStackRequired: parseTechStack(data.techStackRequired),
        seniorityRequired: normalizeSeniority(data.seniorityRequired),
        remoteAllowed: data.remoteAllowed ?? data.isRemote ?? false,
        candidates: (data.candidates || []).map((c: ShortlistCandidate & { seniorityEstimate?: string | SeniorityLevel }) => ({
          ...c,
          seniorityEstimate: normalizeSeniority(c.seniorityEstimate),
          skills: c.skills || [],
          availability: c.availability ?? Availability.Open
        }))
      };
      setShortlist(normalizedData);
    } else {
      setError(res.error || 'Failed to load shortlist');
    }
    setIsLoading(false);
  };

  const toggleCandidateApproval = (candidateId: string) => {
    if (!shortlist || !shortlist.candidates) return;
    setShortlist({
      ...shortlist,
      candidates: shortlist.candidates.map(c =>
        c.candidateId === candidateId ? { ...c, adminApproved: !c.adminApproved } : c
      )
    });
  };

  const updateRank = (candidateId: string, newRank: number) => {
    if (!shortlist || !shortlist.candidates) return;
    setShortlist({
      ...shortlist,
      candidates: shortlist.candidates.map(c =>
        c.candidateId === candidateId ? { ...c, rank: newRank } : c
      )
    });
  };

  const saveChanges = async () => {
    if (!shortlist || !shortlist.candidates) return;
    setIsSaving(true);
    setError(null);

    const rankings = shortlist.candidates.map(c => ({
      candidateId: c.candidateId,
      rank: c.rank,
      adminApproved: c.adminApproved
    }));

    const res = await api.put(`/admin/shortlists/${shortlistId}/rankings`, { rankings });
    if (res.success) {
      setError(null);
    } else {
      setError(res.error || 'Failed to save changes');
    }
    setIsSaving(false);
  };

  const updateStatus = async (newStatus: string) => {
    setError(null);
    const res = await api.put(`/admin/shortlists/${shortlistId}/status`, { status: newStatus });
    if (res.success) {
      setShortlist(prev => prev ? { ...prev, status: newStatus } : null);
    } else {
      setError(res.error || 'Failed to update status');
    }
  };

  const deliverShortlist = async () => {
    if (!confirm('Are you sure you want to deliver this shortlist to the company? This action cannot be undone.')) {
      return;
    }

    setError(null);
    const res = await api.post(`/admin/shortlists/${shortlistId}/deliver`);
    if (res.success) {
      setShortlist(prev => prev ? { ...prev, status: 'completed' } : null);
    } else {
      setError(res.error || 'Failed to deliver shortlist');
    }
  };

  const runMatchingAlgorithm = async () => {
    setIsMatching(true);
    setError(null);
    const res = await api.post(`/admin/shortlists/${shortlistId}/match`);
    if (res.success) {
      await loadShortlist();
    } else {
      setError(res.error || 'Failed to run matching algorithm');
    }
    setIsMatching(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  const getSeniorityLabel = (seniority: SeniorityLevel | null | undefined) => {
    if (seniority === null || seniority === undefined) return 'Any';
    const labels = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'];
    return labels[seniority] || 'Any';
  };

  const getAvailabilityBadge = (availability: Availability | undefined | null) => {
    if (availability === undefined || availability === null) {
      return <Badge variant="default">Unknown</Badge>;
    }
    switch (availability) {
      case Availability.Open:
        return <Badge variant="success">Open</Badge>;
      case Availability.Passive:
        return <Badge variant="warning">Passive</Badge>;
      case Availability.NotNow:
        return <Badge variant="default">Not Looking</Badge>;
      default:
        return <Badge variant="default">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shortlist) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Shortlist not found</p>
        <Link href="/admin/shortlists">
          <Button className="mt-4">Back to Shortlists</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin/shortlists" className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">{shortlist.roleTitle}</h1>
            {getStatusBadge(shortlist.status)}
            {shortlist.isFollowUp && (
              <Badge variant="primary">
                Follow-up {shortlist.followUpDiscount ? `(${shortlist.followUpDiscount}% discount)` : ''}
              </Badge>
            )}
          </div>
          <p className="text-gray-500">
            Requested by <span className="font-medium text-gray-700">{shortlist.companyName}</span> on{' '}
            {new Date(shortlist.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {shortlist.status === 'pending' && (
            <Button onClick={() => updateStatus('processing')}>
              Start Processing
            </Button>
          )}
          {shortlist.status === 'processing' && (
            <>
              <Button variant="outline" onClick={saveChanges} isLoading={isSaving}>
                Save Changes
              </Button>
              <Button onClick={deliverShortlist}>
                Deliver to Company
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Request Details */}
      <Card className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Required Tech Stack</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {shortlist.techStackRequired?.map((tech, i) => (
                <Badge key={i} variant="primary">{tech}</Badge>
              )) || <span className="text-gray-600">Not specified</span>}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Seniority Level</p>
            <p className="font-medium text-gray-900">{getSeniorityLabel(shortlist.seniorityRequired)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium text-gray-900">
              {shortlist.locationPreference || 'Any'}
              {shortlist.remoteAllowed && <span className="text-green-600 ml-2">(Remote OK)</span>}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Price Paid</p>
            <p className="font-medium text-gray-900">
              {shortlist.pricePaid ? `$${shortlist.pricePaid}` : 'Not paid'}
            </p>
          </div>
        </div>
        {shortlist.additionalNotes && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">Additional Notes</p>
            <p className="text-gray-700 mt-1">{shortlist.additionalNotes}</p>
          </div>
        )}
      </Card>

      {/* Matched Candidates */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Matched Candidates ({shortlist.candidates?.length || 0})
          </h2>
          <p className="text-sm text-gray-500">
            {shortlist.candidates?.filter(c => c.adminApproved).length || 0} approved
          </p>
        </div>

        {shortlist.candidates && shortlist.candidates.length > 0 ? (
          <div className="space-y-4">
            {shortlist.candidates
              .sort((a, b) => a.rank - b.rank)
              .map((candidate) => (
                <div
                  key={candidate.candidateId}
                  className={`p-4 rounded-lg border ${
                    candidate.adminApproved
                      ? 'border-green-200 bg-green-50'
                      : candidate.isNew === false
                        ? 'border-yellow-200 bg-yellow-50/30'
                        : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-gray-400">#{candidate.rank}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {candidate.firstName && candidate.lastName
                                ? `${candidate.firstName} ${candidate.lastName}`
                                : candidate.email}
                            </p>
                            {candidate.isNew !== undefined && (
                              <Badge variant={candidate.isNew ? 'success' : 'warning'}>
                                {candidate.statusLabel || (candidate.isNew ? 'New' : 'Repeated')}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{candidate.email}</p>
                        </div>
                        {getAvailabilityBadge(candidate.availability)}
                        <Badge variant="primary">{getSeniorityLabel(candidate.seniorityEstimate)}</Badge>
                        <div className="ml-2 px-2 py-1 bg-blue-100 rounded text-sm font-medium text-blue-700">
                          {candidate.matchScore}% match
                        </div>
                      </div>

                      {/* Re-inclusion reason for repeated candidates */}
                      {!candidate.isNew && candidate.reInclusionReason && (
                        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-200 rounded text-sm text-yellow-800">
                          <span className="font-medium">Re-included because:</span> {candidate.reInclusionReason}
                        </div>
                      )}

                      {candidate.desiredRole && (
                        <p className="text-sm text-gray-600 mt-2">Looking for: {candidate.desiredRole}</p>
                      )}
                      {candidate.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {candidate.skills.slice(0, 8).map((skill, i) => (
                            <Badge key={i} variant="default">{skill}</Badge>
                          ))}
                          {candidate.skills.length > 8 && (
                            <Badge variant="default">+{candidate.skills.length - 8} more</Badge>
                          )}
                        </div>
                      )}
                      {candidate.matchReason && (
                        <p className="text-sm text-gray-500 mt-2 italic">{candidate.matchReason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-500">Rank:</label>
                        <input
                          type="number"
                          min="1"
                          value={candidate.rank}
                          onChange={(e) => updateRank(candidate.candidateId, parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                          disabled={shortlist.status !== 'processing'}
                        />
                      </div>
                      <Button
                        variant={candidate.adminApproved ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => toggleCandidateApproval(candidate.candidateId)}
                        disabled={shortlist.status.toLowerCase() !== 'processing'}
                      >
                        {candidate.adminApproved ? 'Approved' : 'Approve'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No candidates matched yet</p>
            <Button className="mt-4" onClick={runMatchingAlgorithm} isLoading={isMatching}>
              Run Matching Algorithm
            </Button>
          </div>
        )}
      </Card>

      {/* Related Shortlists Chain */}
      {shortlist.chain && shortlist.chain.length > 1 && (
        <Card className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Related Shortlists</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            <div className="space-y-4">
              {shortlist.chain.map((item, index) => (
                <div key={item.id} className="relative flex items-start gap-4 pl-8">
                  <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                    item.id === shortlist.id
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300'
                  }`}></div>
                  <div className={`flex-1 p-3 rounded-lg ${
                    item.id === shortlist.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        {item.id === shortlist.id ? (
                          <span className="font-medium text-blue-700">{item.roleTitle}</span>
                        ) : (
                          <Link
                            href={`/admin/shortlists/${item.id}`}
                            className="font-medium text-gray-900 hover:text-blue-600"
                          >
                            {item.roleTitle}
                          </Link>
                        )}
                        <p className="text-sm text-gray-500">
                          {new Date(item.createdAt).toLocaleDateString()} - {item.candidatesCount} candidates
                        </p>
                      </div>
                      {item.id === shortlist.id && (
                        <Badge variant="primary">Current</Badge>
                      )}
                      {index === 0 && item.id !== shortlist.id && (
                        <Badge variant="default">Original</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
