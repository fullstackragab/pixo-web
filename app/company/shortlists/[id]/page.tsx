'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import {
  ShortlistPricingType,
  ShortlistMessage,
  ShortlistOutcome,
  PaymentPricingType,
  ScopeApprovalStatus,
  PaymentProvider,
  PaymentAuthorizationResponse,
  ShortlistStatusString,
  PaymentStatus
} from '@/types';
import SendShortlistMessageModal from '@/components/SendShortlistMessageModal';
import ShortlistOutcomeMessage from '@/components/ShortlistOutcomeMessage';
import Breadcrumb, { companyBreadcrumbs } from '@/components/ui/Breadcrumb';

interface ShortlistCandidate {
  candidateId: string;
  firstName: string | null;
  lastName: string | null;
  desiredRole: string | null;
  seniorityEstimate: string | null;
  availability: string;
  matchScore: number;
  matchReason: string | null;
  rank: number;
  skills?: string[];
  topSkills?: string[];
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
  roleTitle: string;
  techStackRequired: string[];
  seniorityRequired: string | null;
  locationPreference: string | null;
  remoteAllowed: boolean;
  additionalNotes: string | null;
  status: string | ShortlistStatusString;
  createdAt: string;
  pricePaid?: number;
  candidates: ShortlistCandidate[];
  // Versioning fields
  previousRequestId?: string | null;
  pricingType?: ShortlistPricingType;
  followUpDiscount?: number;
  isFollowUp?: boolean;
  newCandidatesCount?: number;
  repeatedCandidatesCount?: number;
  chain?: ShortlistChainItem[];
  // Payment outcome fields (backend-driven, read-only)
  shortlistOutcome?: ShortlistOutcome;
  paymentPricingType?: PaymentPricingType;
  finalPrice?: number;
  // Scope approval fields (backend-driven)
  scopeApprovalStatus?: ScopeApprovalStatus;
  proposedCandidates?: number;
  proposedPrice?: number;
  scopeNotes?: string;
  // Payment authorization fields (backend-driven)
  paymentStatus?: PaymentStatus;
  // Legacy aliases
  pricingApprovalStatus?: ScopeApprovalStatus;
  quotedPrice?: number;
  approvedCandidatesCount?: number;
}

export default function CompanyShortlistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shortlistId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();

  const [shortlist, setShortlist] = useState<ShortlistDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<ShortlistMessage[]>([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  // Two-step flow state
  // Step 1: Pricing approval (no payment input)
  const [pricingConsentChecked, setPricingConsentChecked] = useState(false);
  // Step 2: Payment authorization (after pricing approved)
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('stripe');
  const [paymentAuthorizationPending, setPaymentAuthorizationPending] = useState(false);

  const handleRequestMore = () => {
    if (!shortlist) return;
    const queryParams = new URLSearchParams({
      previousRequestId: shortlist.id,
      roleTitle: shortlist.roleTitle,
      techStack: shortlist.techStackRequired?.join(',') || '',
      seniority: shortlist.seniorityRequired?.toString() || '',
      location: shortlist.locationPreference || '',
      remoteAllowed: shortlist.remoteAllowed ? 'true' : 'false',
    });
    router.push(`/company/shortlists?requestMore=true&${queryParams.toString()}`);
  };

  useEffect(() => {
    if (!authLoading && user && shortlistId) {
      loadShortlist();
      loadMessages();
    }
  }, [authLoading, user, shortlistId]);

  const loadShortlist = async () => {
    setIsLoading(true);
    const res = await api.get<ShortlistDetail>(`/shortlists/${shortlistId}`);
    if (res.success && res.data) {
      setShortlist(res.data);
    }
    setIsLoading(false);
  };

  const loadMessages = async () => {
    const res = await api.get<ShortlistMessage[]>(`/shortlists/${shortlistId}/messages`);
    if (res.success && res.data) {
      setMessages(res.data);
    }
  };

  // Step 1: Approve pricing (no payment input on this screen)
  const handleApprovePricing = async () => {
    if (!pricingConsentChecked) {
      setApprovalError('Please check the consent box to proceed.');
      return;
    }

    setIsApproving(true);
    setApprovalError(null);

    try {
      // Approve pricing only - no payment provider yet
      const res = await api.post(`/shortlists/${shortlistId}/pricing/approve`, {
        confirmApproval: true
      });

      if (res.success) {
        // Reload to show payment authorization step
        await loadShortlist();
        setPricingConsentChecked(false);
      } else {
        setApprovalError(res.error || 'Unable to approve pricing. Please try again.');
      }
    } catch {
      setApprovalError('An error occurred. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  // Step 2: Authorize payment (after pricing approved)
  const handleAuthorizePayment = async () => {
    setPaymentAuthorizationPending(true);
    setApprovalError(null);

    try {
      const res = await api.post<PaymentAuthorizationResponse>(`/shortlists/${shortlistId}/payment/authorize`, {
        provider: selectedProvider
      });

      if (res.success && res.data) {
        const authResponse = res.data;

        // Handle different payment providers
        if (selectedProvider === 'stripe' && authResponse.clientSecret) {
          // For Stripe, confirm the payment authorization
          const confirmRes = await api.post(`/shortlists/${shortlistId}/payment/confirm`, {
            providerReference: authResponse.providerReference
          });
          if (confirmRes.success) {
            await loadShortlist();
          } else {
            setApprovalError(confirmRes.error || 'Authorization failed. Please try again.');
          }
        } else if (selectedProvider === 'paypal' && authResponse.approvalUrl) {
          // For PayPal, redirect to approval URL
          window.location.href = authResponse.approvalUrl;
          return;
        } else if (selectedProvider === 'usdc' && authResponse.escrowAddress) {
          // For USDC, system will auto-confirm when transfer is detected
          await loadShortlist();
        } else {
          // Direct authorization
          await loadShortlist();
        }
      } else {
        setApprovalError(res.error || 'Unable to authorize. Please try again.');
      }
    } catch {
      setApprovalError('An error occurred. Please try again.');
    } finally {
      setPaymentAuthorizationPending(false);
    }
  };

  const handleDeclineScope = async () => {
    setIsDeclining(true);
    setApprovalError(null);
    try {
      const res = await api.put(`/shortlists/${shortlistId}/scope/decline`);
      if (res.success) {
        // Redirect back to shortlists list
        router.push('/company/shortlists');
      } else {
        setApprovalError(res.error || 'Failed to decline. Please try again.');
      }
    } catch {
      setApprovalError('An error occurred. Please try again.');
    } finally {
      setIsDeclining(false);
    }
  };

  // Check if pricing approval is pending (Step 1)
  // Show approval card when admin has proposed pricing
  const isPricingPending =
    shortlist?.scopeApprovalStatus === 'pending' ||
    shortlist?.pricingApprovalStatus === 'pending' ||
    shortlist?.status?.toLowerCase() === 'pricingrequested' ||
    shortlist?.status?.toLowerCase() === 'pricingpending';

  // Check if payment authorization is needed (Step 2 - after pricing approved)
  const isPaymentAuthorizationNeeded =
    (shortlist?.scopeApprovalStatus === 'approved' || shortlist?.pricingApprovalStatus === 'approved') &&
    shortlist?.paymentStatus !== 'authorized' &&
    shortlist?.status !== 'delivered' &&
    shortlist?.status !== 'paymentCaptured';

  // Combined check for any pending approval step
  const isAnyApprovalPending = isPricingPending || isPaymentAuthorizationNeeded;

  // Normalize status to handle both old and new values
  const normalizeStatus = (status: string): string => {
    // Remove underscores and lowercase for consistent comparison
    const s = status.toLowerCase().replace(/_/g, '');
    // Map old status values to new ones
    if (s === 'pending') return 'draft';
    if (s === 'submitted') return 'submitted';
    if (s === 'processing') return 'matching';
    if (s === 'completed') return 'delivered';
    return s;
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      case 'submitted':
        return <Badge variant="primary">Submitted</Badge>;
      case 'matching':
        return <Badge variant="primary">Matching Candidates</Badge>;
      case 'readyforpricing':
        return <Badge variant="warning">Ready for Pricing</Badge>;
      case 'pricingpending':
        return <Badge variant="warning">Awaiting Your Approval</Badge>;
      case 'pricingrequested':
        return <Badge variant="warning">Awaiting Your Approval</Badge>;
      case 'pricingapproved':
        return <Badge variant="primary">Being Curated</Badge>;
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'paymentcaptured':
        return <Badge variant="success">Complete</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        // Display normalized status in title case for unknown statuses
        const displayStatus = normalizedStatus.replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/^./, str => str.toUpperCase());
        return <Badge variant="default">{displayStatus}</Badge>;
    }
  };

  const isStatusDelivered = (status: string) => {
    const normalized = normalizeStatus(status);
    return normalized === 'delivered' || normalized === 'paymentcaptured';
  };

  const isStatusPendingOrProcessing = (status: string) => {
    const normalized = normalizeStatus(status);
    return ['draft', 'matching', 'readyforpricing', 'pricingapproved'].includes(normalized);
  };

  const getSeniorityLabel = (seniority: string | null) => {
    if (seniority === null) return 'Any';
    // Capitalize first letter
    return seniority.charAt(0).toUpperCase() + seniority.slice(1).toLowerCase();
  };

  const getAvailabilityBadge = (availability: string) => {
    const normalizedAvailability = availability.toLowerCase();
    switch (normalizedAvailability) {
      case 'open':
        return <Badge variant="success">Actively Looking</Badge>;
      case 'passive':
        return <Badge variant="warning">Open</Badge>;
      case 'notnow':
      case 'not_now':
        return <Badge variant="default">Not Looking</Badge>;
      default:
        return <Badge variant="default">{availability}</Badge>;
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!shortlist) {
    return (
      <PageWrapper>
        <Header />
        <PageContainer className="py-12 text-center">
          <p className="text-gray-500">Shortlist not found</p>
          <Link href="/company/shortlists">
            <Button className="mt-4">Back to Shortlists</Button>
          </Link>
        </PageContainer>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <Header />

      <PageContainer variant="wide">
        <Breadcrumb items={companyBreadcrumbs.shortlistDetail(shortlist.roleTitle)} />

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{shortlist.roleTitle}</h1>
            <div className="flex items-center gap-3 mt-2">
              {getStatusBadge(shortlist.status)}
              {shortlist.isFollowUp && (
                <Badge variant="primary">
                  Follow-up {shortlist.followUpDiscount ? `(${shortlist.followUpDiscount}% discount)` : ''}
                </Badge>
              )}
              <span className="text-gray-500">
                Created {new Date(shortlist.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          {isStatusDelivered(shortlist.status) && (
            <Button variant="outline" onClick={handleRequestMore}>
              Request More Candidates
            </Button>
          )}
        </div>

        {/* Step 1: Pricing Approval Screen - shown when pricing is pending */}
        {isPricingPending && (
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Review Your Shortlist</h2>
                <p className="text-gray-600">
                  Please review the details below and approve to continue.
                </p>
              </div>

              {/* Request Summary */}
              <div className="bg-white rounded-lg p-4 mb-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Role</span>
                    <span className="font-medium text-gray-900">{shortlist.roleTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Candidates to be delivered</span>
                    <span className="font-medium text-gray-900">
                      {shortlist.proposedCandidates || shortlist.approvedCandidatesCount || '—'}
                    </span>
                  </div>
                  {shortlist.scopeNotes && (
                    <div className="pt-2 border-t border-gray-100">
                      <span className="text-gray-500 block mb-1">Notes from Bixo</span>
                      <span className="text-gray-700">{shortlist.scopeNotes}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-gray-700 font-medium">Final Price</span>
                    <span className="font-bold text-xl text-gray-900">
                      ${(shortlist.proposedPrice || shortlist.quotedPrice)?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Consent Checkbox - exact text from spec */}
              <div className="bg-white rounded-lg p-4 mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pricingConsentChecked}
                    onChange={(e) => setPricingConsentChecked(e.target.checked)}
                    className="w-5 h-5 mt-0.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    By approving, you agree to be charged after the shortlist is delivered.
                  </span>
                </label>
              </div>

              {/* Error Message */}
              {approvalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {approvalError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={handleDeclineScope}
                  disabled={isDeclining || isApproving}
                  isLoading={isDeclining}
                >
                  Decline
                </Button>
                <Button
                  onClick={handleApprovePricing}
                  disabled={!pricingConsentChecked || isApproving || isDeclining}
                  isLoading={isApproving}
                >
                  Approve & Continue
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Payment Authorization UI - shown after pricing approved */}
        {isPaymentAuthorizationNeeded && (
          <Card className="mb-6 border-2 border-green-200 bg-green-50">
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Authorize Payment</h2>
                <p className="text-gray-600">
                  We&apos;ll place a temporary authorization. You won&apos;t be charged unless the shortlist is delivered.
                </p>
              </div>

              {/* Amount Summary */}
              <div className="bg-white rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Authorization Amount</span>
                  <span className="font-bold text-xl text-gray-900">
                    ${(shortlist.proposedPrice || shortlist.quotedPrice)?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This hold will be released if the shortlist is not delivered.
                </p>
              </div>

              {/* Payment Method Selection */}
              <div className="bg-white rounded-lg p-4 mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Payment Method</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="provider"
                      value="stripe"
                      checked={selectedProvider === 'stripe'}
                      onChange={() => setSelectedProvider('stripe')}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="font-medium text-gray-900">Credit/Debit Card</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="provider"
                      value="paypal"
                      checked={selectedProvider === 'paypal'}
                      onChange={() => setSelectedProvider('paypal')}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="font-medium text-gray-900">PayPal</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="radio"
                      name="provider"
                      value="usdc"
                      checked={selectedProvider === 'usdc'}
                      onChange={() => setSelectedProvider('usdc')}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="font-medium text-gray-900">USDC (Solana)</span>
                  </label>
                </div>
              </div>

              {/* Error Message */}
              {approvalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {approvalError}
                </div>
              )}

              {/* Processing State */}
              {paymentAuthorizationPending && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                  <span>Processing authorization...</span>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleAuthorizePayment}
                  disabled={paymentAuthorizationPending}
                  isLoading={paymentAuthorizationPending}
                  className="px-8"
                >
                  Authorize
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Payment Outcome Message - shown when delivered */}
        {isStatusDelivered(shortlist.status) && (
          <ShortlistOutcomeMessage
            outcome={shortlist.shortlistOutcome}
            pricingType={shortlist.paymentPricingType}
            finalPrice={shortlist.finalPrice}
            className="mb-6"
          />
        )}

        {/* Pricing Breakdown for Follow-ups */}
        {shortlist.isFollowUp && shortlist.pricePaid !== undefined && (
          <Card className="mb-6 bg-green-50 border-green-200">
            <h2 className="text-lg font-semibold text-green-800 mb-3">Follow-up Pricing</h2>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-green-700">Original price</p>
                <p className="text-lg text-green-600 line-through">$299</p>
              </div>
              <div>
                <p className="text-sm text-green-700">Discount ({shortlist.followUpDiscount}%)</p>
                <p className="text-lg text-green-600">-${((299 * (shortlist.followUpDiscount || 0)) / 100).toFixed(0)}</p>
              </div>
              <div>
                <p className="text-sm text-green-700">You paid</p>
                <p className="text-lg font-bold text-green-800">${shortlist.pricePaid}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Candidate Stats */}
        {isStatusDelivered(shortlist.status) && (shortlist.newCandidatesCount !== undefined || shortlist.repeatedCandidatesCount !== undefined) && (
          <Card className="mb-6">
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900">{shortlist.candidates.length}</p>
                <p className="text-sm text-gray-500">Total Candidates</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{shortlist.newCandidatesCount || 0}</p>
                <p className="text-sm text-gray-500">New</p>
              </div>
              {(shortlist.repeatedCandidatesCount || 0) > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">{shortlist.repeatedCandidatesCount}</p>
                  <p className="text-sm text-gray-500">Previously Recommended</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Requirements */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Tech Stack</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {shortlist.techStackRequired?.map((tech, i) => (
                  <Badge key={i} variant="primary">{tech}</Badge>
                )) || <span className="text-gray-600">Any</span>}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Seniority</p>
              <p className="font-medium text-gray-900">{getSeniorityLabel(shortlist.seniorityRequired)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium text-gray-900">
                {shortlist.locationPreference || 'Any'}
                {shortlist.remoteAllowed && <span className="text-green-600 ml-1">(Remote OK)</span>}
              </p>
            </div>
          </div>
          {shortlist.additionalNotes && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Notes</p>
              <p className="text-gray-700">{shortlist.additionalNotes}</p>
            </div>
          )}
        </Card>

        {/* Candidates */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Matched Candidates ({shortlist.candidates.length})
          </h2>

          {/* Locked state when any approval is pending */}
          {isAnyApprovalPending ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Candidates Locked</p>
              <p className="text-sm text-gray-500 mt-1">
                {isPricingPending
                  ? 'Approve the pricing above to continue.'
                  : 'Complete payment authorization to access your curated candidates.'}
              </p>
            </div>
          ) : isStatusDelivered(shortlist.status) && shortlist.candidates.length > 0 ? (
            <div className="space-y-4">
              {shortlist.candidates
                .sort((a, b) => a.rank - b.rank)
                .map((candidate) => {
                  const skills = candidate.skills || candidate.topSkills || [];
                  return (
                    <div
                      key={candidate.candidateId}
                      className={`p-4 border rounded-lg hover:border-blue-200 transition-colors ${
                        candidate.isNew === false ? 'border-yellow-200 bg-yellow-50/30' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-blue-600">#{candidate.rank}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900">
                                  {candidate.firstName && candidate.lastName
                                    ? `${candidate.firstName} ${candidate.lastName.charAt(0)}.`
                                    : 'Candidate'}
                                </h3>
                                {candidate.isNew !== undefined && (
                                  <Badge variant={candidate.isNew ? 'success' : 'warning'}>
                                    {candidate.statusLabel || (candidate.isNew ? 'New' : 'Previously recommended')}
                                  </Badge>
                                )}
                              </div>
                              {candidate.desiredRole && (
                                <p className="text-sm text-gray-600">{candidate.desiredRole}</p>
                              )}
                            </div>
                          </div>

                          {/* Re-inclusion reason for repeated candidates */}
                          {!candidate.isNew && candidate.reInclusionReason && (
                            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-200 rounded text-sm text-yellow-800">
                              <span className="font-medium">Re-included because:</span> {candidate.reInclusionReason}
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 mt-3">
                            {getAvailabilityBadge(candidate.availability)}
                            {candidate.seniorityEstimate !== null && (
                              <Badge variant="default">{getSeniorityLabel(candidate.seniorityEstimate)}</Badge>
                            )}
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded font-medium">
                              {candidate.matchScore}% match
                            </span>
                          </div>

                          {skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {skills.slice(0, 8).map((skill, i) => (
                                <Badge key={i} variant="primary">{skill}</Badge>
                              ))}
                            </div>
                          )}

                          {candidate.matchReason && (
                            <p className="text-sm text-gray-500 mt-3 italic">{candidate.matchReason}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Link href={`/company/talent/${candidate.candidateId}?shortlistId=${shortlistId}`}>
                            <Button variant="outline" size="sm">View Profile</Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : isStatusPendingOrProcessing(shortlist.status) ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">
                {shortlist.status.toLowerCase() === 'pending'
                  ? 'Your shortlist request is being reviewed...'
                  : 'Our team is curating the best candidates for you...'}
              </p>
              <p className="text-sm text-gray-400 mt-2">You&apos;ll be notified when ready</p>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No candidates available</p>
          )}
        </Card>

        {/* Messaging Section - hidden when any approval is pending */}
        {!isAnyApprovalPending && isStatusDelivered(shortlist.status) && shortlist.candidates.length > 0 && (
          <Card className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Messages to Candidates</h2>
              <Button onClick={() => setIsMessageModalOpen(true)}>
                Send Messages
              </Button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Send a short informational message to all candidates in this shortlist. Candidates cannot reply.
            </p>

            {messages.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">Previously Sent Messages</h3>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      Sent {new Date(message.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">No messages sent yet</p>
            )}
          </Card>
        )}

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
                              href={`/company/shortlists/${item.id}`}
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

        {/* Send Message Modal */}
        <SendShortlistMessageModal
          shortlistId={shortlistId}
          roleTitle={shortlist.roleTitle}
          candidateCount={shortlist.candidates.length}
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          onSuccess={() => loadMessages()}
        />
      </PageContainer>
    </PageWrapper>
  );
}
