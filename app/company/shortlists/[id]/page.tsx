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
import { ShortlistPricingType, ShortlistMessage, ShortlistOutcome, PaymentPricingType } from '@/types';
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
  status: string;
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

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'pending':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'processing':
        return <Badge variant="primary">Being Curated</Badge>;
      case 'completed':
        return <Badge variant="success">Ready</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const isStatusCompleted = (status: string) => {
    return status.toLowerCase() === 'completed';
  };

  const isStatusPendingOrProcessing = (status: string) => {
    const normalized = status.toLowerCase();
    return normalized === 'pending' || normalized === 'processing';
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
          {isStatusCompleted(shortlist.status) && (
            <Button variant="outline" onClick={handleRequestMore}>
              Request More Candidates
            </Button>
          )}
        </div>

        {/* Payment Outcome Message - shown when completed */}
        {isStatusCompleted(shortlist.status) && (
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
        {isStatusCompleted(shortlist.status) && (shortlist.newCandidatesCount !== undefined || shortlist.repeatedCandidatesCount !== undefined) && (
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

          {isStatusCompleted(shortlist.status) && shortlist.candidates.length > 0 ? (
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

        {/* Messaging Section */}
        {isStatusCompleted(shortlist.status) && shortlist.candidates.length > 0 && (
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
