'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { ShortlistPricingType, ScopeApprovalStatus, ShortlistStatusString, PaymentStatus } from '@/types';
import Input from '@/components/ui/Input';

interface ShortlistCandidate {
  id: string;
  candidateId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  desiredRole: string | null;
  seniorityEstimate: string | number | null;
  availability: string | number;
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
  seniorityRequired?: string | number | null;
  locationPreference?: string | null;
  remoteAllowed?: boolean;
  additionalNotes?: string | null;
  status: string | ShortlistStatusString; // Normalized to lowercase string
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
  // Scope approval (backend-driven)
  scopeApprovalStatus?: ScopeApprovalStatus;
  proposedCandidates?: number;
  proposedPrice?: number;
  scopeNotes?: string;
  scopeProposedAt?: string;
  // Payment status (backend-driven, read-only)
  paymentStatus?: PaymentStatus;
  // Legacy
  pricingApprovalStatus?: ScopeApprovalStatus;
  quotedPrice?: number;
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

// Helper to normalize seniority to lowercase string
const normalizeSeniority = (seniority: string | number | null | undefined): string | null => {
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

// Helper to normalize availability to lowercase string
const normalizeAvailability = (availability: string | number | null | undefined): string => {
  if (availability === null || availability === undefined) return 'open';
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
  const [isMatching, setIsMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Scope proposal state
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [proposedCandidates, setProposedCandidates] = useState<string>('');
  const [proposedPrice, setProposedPrice] = useState<string>('');
  const [scopeNotes, setScopeNotes] = useState<string>('');
  const [isProposing, setIsProposing] = useState(false);
  const [backgroundSaveError, setBackgroundSaveError] = useState<string | null>(null);

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
        candidates: (data.candidates || []).map((c: ShortlistCandidate) => ({
          ...c,
          seniorityEstimate: normalizeSeniority(c.seniorityEstimate),
          skills: c.skills || [],
          availability: normalizeAvailability(c.availability)
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
      setShortlist(prev => prev ? { ...prev, status: 'delivered' } : null);
    } else {
      setError(res.error || 'Failed to deliver shortlist');
    }
  };

  const markAsPaid = async () => {
    if (!confirm('Mark this shortlist as paid? This confirms payment has been received.')) {
      return;
    }

    setError(null);
    const res = await api.post(`/admin/shortlists/${shortlistId}/mark-paid`);
    if (res.success) {
      setShortlist(prev => prev ? { ...prev, status: 'completed', paymentStatus: 'captured' } : null);
    } else {
      setError(res.error || 'Failed to mark as paid');
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

  // Propose scope to company
  const handleProposeScope = async () => {
    const candidates = parseInt(proposedCandidates);
    const price = parseFloat(proposedPrice);

    if (isNaN(candidates) || candidates <= 0) {
      setError('Please enter a valid number of candidates');
      return;
    }
    if (isNaN(price) || price <= 0) {
      setError('Please enter a valid price');
      return;
    }

    setIsProposing(true);
    setError(null);

    // Propose the scope (candidates were saved in background when modal opened)
    const res = await api.post(`/admin/shortlists/${shortlistId}/scope/propose`, {
      proposedCandidates: candidates,
      proposedPrice: price,
      notes: scopeNotes || undefined
    });

    if (res.success) {
      setShowScopeModal(false);
      setProposedCandidates('');
      setProposedPrice('');
      setScopeNotes('');
      await loadShortlist();
    } else {
      setError(res.error || 'Failed to propose scope');
    }
    setIsProposing(false);
  };

  // Open scope modal with pre-filled values and save candidates in background
  const openScopeModal = async () => {
    const approvedCount = shortlist?.candidates?.filter(c => c.adminApproved).length || 0;
    setProposedCandidates(approvedCount.toString() || '');
    setProposedPrice(shortlist?.proposedPrice?.toString() || shortlist?.quotedPrice?.toString() || '299');
    setScopeNotes(shortlist?.scopeNotes || '');
    setBackgroundSaveError(null);
    setShowScopeModal(true);

    // Save approved candidates in background while admin reviews the modal
    if (shortlist?.candidates) {
      const rankings = shortlist.candidates.map(c => ({
        candidateId: c.candidateId,
        rank: c.rank,
        adminApproved: c.adminApproved
      }));
      const res = await api.put(`/admin/shortlists/${shortlistId}/rankings`, { rankings });
      if (!res.success) {
        setBackgroundSaveError(res.error || 'Failed to save candidate rankings');
      }
    }
  };

  // Check if scope can be proposed
  const canProposeScope = (): boolean => {
    if (!shortlist) return false;
    const hasApprovedCandidates = shortlist.candidates && shortlist.candidates.some(c => c.adminApproved);
    const allowedStatuses = ['matching', 'readyforpricing', 'processing'];
    const isReadyForPricing = allowedStatuses.includes(shortlist.status.toLowerCase());
    return isReadyForPricing && !!hasApprovedCandidates;
  };

  // Check if scope has been proposed (awaiting company approval or already approved)
  const isScopeProposed = (): boolean => {
    if (!shortlist) return false;
    const status = shortlist.status.toLowerCase();
    return status === 'pricingrequested' ||
           status === 'pricingpending' ||
           status === 'pricingapproved' ||
           shortlist.scopeApprovalStatus === 'pending' ||
           shortlist.scopeApprovalStatus === 'approved' ||
           shortlist.pricingApprovalStatus === 'pending' ||
           shortlist.pricingApprovalStatus === 'approved' ||
           shortlist.scopeProposedAt !== undefined ||
           shortlist.proposedPrice !== undefined;
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      case 'submitted':
        return <Badge variant="primary">Submitted</Badge>;
      case 'matching':
        return <Badge variant="primary">Matching</Badge>;
      case 'readyforpricing':
        return <Badge variant="warning">Ready for Pricing</Badge>;
      case 'pricingpending':
      case 'pricingrequested':
        return <Badge variant="warning">Pricing Pending</Badge>;
      case 'approved':
      case 'pricingapproved':
        return <Badge variant="success">Approved</Badge>;
      case 'delivered':
        return <Badge variant="warning">Delivered (Unpaid)</Badge>;
      case 'paid':
      case 'completed':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'processing':
        return <Badge variant="primary">Processing</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const getScopeStatusBadge = (scopeStatus: ScopeApprovalStatus | undefined) => {
    switch (scopeStatus) {
      case 'approved':
        return <Badge variant="success">Pricing: Approved</Badge>;
      case 'declined':
        return <Badge variant="danger">Pricing: Declined</Badge>;
      case 'pending':
        return <Badge variant="warning">Pricing: Pending</Badge>;
      default:
        return null;
    }
  };

  const getPaymentStatusBadge = (paymentStatus: PaymentStatus | undefined) => {
    switch (paymentStatus) {
      case 'authorized':
        return <Badge variant="success">Payment: Authorized</Badge>;
      case 'captured':
        return <Badge variant="success">Payment: Captured</Badge>;
      case 'pendingApproval':
        return <Badge variant="warning">Payment: Pending</Badge>;
      case 'failed':
        return <Badge variant="danger">Payment: Failed</Badge>;
      case 'canceled':
        return <Badge variant="default">Payment: Canceled</Badge>;
      case 'released':
        return <Badge variant="default">Payment: Released</Badge>;
      case 'partial':
        return <Badge variant="warning">Payment: Partial</Badge>;
      default:
        return null;
    }
  };

  // Check if delivery is allowed - enabled when status is approved
  const canDeliver = (): boolean => {
    if (!shortlist) return false;
    const status = shortlist.status.toLowerCase();
    return status === 'approved' || status === 'pricingapproved';
  };

  const getDeliveryDisabledReason = (): string | null => {
    if (!shortlist) return null;
    const status = shortlist.status.toLowerCase();
    if (status !== 'approved' && status !== 'pricingapproved') {
      return 'Awaiting pricing approval from company.';
    }
    return null;
  };

  // Check if "Mark as Paid" is allowed - enabled after delivery
  const canMarkAsPaid = (): boolean => {
    if (!shortlist) return false;
    const status = shortlist.status.toLowerCase();
    return status === 'delivered' && shortlist.paymentStatus !== 'captured';
  };

  const getSeniorityLabel = (seniority: string | number | null | undefined) => {
    const normalized = normalizeSeniority(seniority);
    if (normalized === null) return 'Any';
    const labelMap: Record<string, string> = {
      'junior': 'Junior',
      'mid': 'Mid',
      'senior': 'Senior',
      'lead': 'Lead',
      'principal': 'Principal'
    };
    return labelMap[normalized] || normalized;
  };

  const getAvailabilityBadge = (availability: string | number | undefined | null) => {
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
          {/* Read-only status badges */}
          {shortlist.status.toLowerCase() !== 'completed' && shortlist.status.toLowerCase() !== 'delivered' && (
            <div className="flex items-center gap-2 mt-1 ml-8">
              {getScopeStatusBadge(shortlist.scopeApprovalStatus || shortlist.pricingApprovalStatus)}
              {getPaymentStatusBadge(shortlist.paymentStatus)}
            </div>
          )}
          <p className="text-gray-500">
            Requested by <span className="font-medium text-gray-700">{shortlist.companyName}</span> on{' '}
            {new Date(shortlist.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {(shortlist.status === 'pending' || shortlist.status === 'draft' || shortlist.status === 'submitted') && (
            <Button onClick={() => updateStatus('processing')}>
              Start Processing
            </Button>
          )}
          {(['processing', 'matching', 'readyforpricing', 'pricingpending', 'pricingrequested', 'pricingapproved', 'approved'].includes(shortlist.status.toLowerCase())) && (
            <>
              {canProposeScope() && !isScopeProposed() && (
                <Button variant="primary" onClick={openScopeModal}>
                  Propose Scope & Price
                </Button>
              )}
              {isScopeProposed() && !canDeliver() && (
                <Button variant="outline" onClick={openScopeModal}>
                  Update Scope
                </Button>
              )}
              <div className="relative group">
                <Button
                  onClick={deliverShortlist}
                  disabled={!canDeliver()}
                  className={!canDeliver() ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  Deliver to Company
                </Button>
                {!canDeliver() && getDeliveryDisabledReason() && (
                  <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {getDeliveryDisabledReason()}
                    <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
            </>
          )}
          {/* Mark as Paid button - shown after delivery */}
          {canMarkAsPaid() && (
            <Button variant="primary" onClick={markAsPaid}>
              Mark as Paid
            </Button>
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
            <p className="text-sm text-gray-500">Quoted Price</p>
            <p className="font-medium text-gray-900">
              {shortlist.quotedPrice ? `$${shortlist.quotedPrice}` : 'Pending'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {shortlist.pricingApprovalStatus === 'approved'
                ? 'Company approved'
                : shortlist.pricingApprovalStatus === 'declined'
                  ? 'Company declined'
                  : 'Awaiting approval'}
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

      {/* Scope Proposal Modal */}
      {showScopeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Propose Scope & Price</h2>
            <p className="text-sm text-gray-600 mb-6">
              Set the expected candidate count and price. The company will need to approve before you can deliver.
            </p>

            <div className="space-y-4">
              {/* Background save error */}
              {backgroundSaveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800">Failed to save candidates</p>
                      <p className="text-sm text-red-700 mt-0.5">{backgroundSaveError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Follow-up discount reminder */}
              {shortlist.isFollowUp && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-800">Follow-up Request</p>
                      <p className="text-sm text-amber-700 mt-0.5">
                        Remember to apply the follow-up discount when setting the price.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Input
                label="Expected Candidates"
                id="proposedCandidates"
                type="number"
                min="1"
                value={proposedCandidates}
                onChange={(e) => setProposedCandidates(e.target.value)}
                placeholder="e.g., 5"
              />

              <Input
                label={shortlist.isFollowUp ? "Price (USD) - Apply discount" : "Price (USD)"}
                id="proposedPrice"
                type="number"
                min="0"
                step="0.01"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
                placeholder={shortlist.isFollowUp ? "e.g., 149.00 (discounted)" : "e.g., 299.00"}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={scopeNotes}
                  onChange={(e) => setScopeNotes(e.target.value)}
                  placeholder="Any notes about the scope..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-500">Approved candidates:</span>
                  <span className="font-medium">{shortlist?.candidates?.filter(c => c.adminApproved).length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total candidates:</span>
                  <span className="font-medium">{shortlist?.candidates?.length || 0}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowScopeModal(false)}
                disabled={isProposing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleProposeScope}
                isLoading={isProposing}
                disabled={!!backgroundSaveError}
                className="flex-1"
              >
                Send to Company
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
