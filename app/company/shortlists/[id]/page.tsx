'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import CapabilitiesDisplay from '@/components/CapabilitiesDisplay';
import api from '@/lib/api';
import { deriveCapabilities } from '@/lib/capabilities';
import { CandidateRecommendationsSummary, CompanyRecommendation, Capabilities } from '@/types';

type ShortlistState = 'searching' | 'pricing-ready' | 'awaiting-approval' | 'delivered' | 'no-match';

interface ShortlistCandidate {
  candidateId: string;
  firstName: string | null;
  lastName: string | null;
  desiredRole: string | null;
  seniorityEstimate: string | null;
  yearsExperience?: number;
  availability: string;
  matchScore: number;
  matchReason: string | null;
  rank: number;
  skills?: string[];
  topSkills?: string[];
  capabilities?: Capabilities;
  email?: string;
  // Interest response from candidate
  interestStatus?: 'pending' | 'interested' | 'not_interested' | 'interested_later';
  interestRespondedAt?: string;
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
  candidates: ShortlistCandidate[];
  proposedPrice?: number;
  proposedCandidates?: number;
  shortlistOutcome?: string;
  outcomeReason?: string;
  lastEmailSentAt?: string;
}

function Badge({
  children,
  variant = 'default'
}: {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'primary';
}) {
  const baseClasses = 'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium';
  const variantClasses = {
    default: 'bg-accent text-accent-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    primary: 'bg-primary text-primary-foreground',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}

function Button({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline';
  disabled?: boolean;
  className?: string;
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-border bg-card hover:bg-accent hover:text-accent-foreground',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export default function CompanyShortlistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shortlistId = params.id as string;
  const { user, isLoading: authLoading } = useAuth();

  const [shortlist, setShortlist] = useState<ShortlistDetail | null>(null);
  const [recommendations, setRecommendations] = useState<CandidateRecommendationsSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (!authLoading && user && shortlistId) {
      loadShortlist();
    }
  }, [authLoading, user, shortlistId]);

  const loadShortlist = async () => {
    setIsLoading(true);
    const res = await api.get<ShortlistDetail>(`/shortlists/${shortlistId}`);
    if (res.success && res.data) {
      setShortlist(res.data);
      // Load recommendations for delivered shortlists
      const status = res.data.status?.toLowerCase().replace(/_/g, '');
      if (status === 'delivered' || status === 'completed' || status === 'paid') {
        loadRecommendations();
      }
    }
    setIsLoading(false);
  };

  const loadRecommendations = async () => {
    const res = await api.get<CandidateRecommendationsSummary[]>(`/shortlists/${shortlistId}/recommendations`);
    if (res.success && res.data) {
      setRecommendations(res.data);
    }
  };

  const getCandidateRecommendations = (candidateId: string): CompanyRecommendation[] => {
    const summary = recommendations.find(r => r.candidateId === candidateId);
    return summary?.recommendations || [];
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await api.post(`/shortlists/${shortlistId}/pricing/approve`, {
        confirmApproval: true
      });
      if (res.success) {
        await loadShortlist();
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleKeepOnFile = async () => {
    await api.post(`/shortlists/${shortlistId}/keep-on-file`);
    router.push('/company/shortlists');
  };

  const handleNewRequest = () => {
    router.push('/company/shortlists/new');
  };

  // Map backend status to UI state
  const getShortlistState = (shortlist: ShortlistDetail): ShortlistState => {
    const status = shortlist.status?.toLowerCase().replace(/_/g, '');
    const outcome = shortlist.shortlistOutcome?.toLowerCase().replace(/_/g, '');

    if (outcome === 'nomatch') return 'no-match';
    if (status === 'delivered' || status === 'completed' || status === 'paid') return 'delivered';
    if (status === 'pricingapproved' || status === 'approved') return 'awaiting-approval';
    if (status === 'pricingrequested' || status === 'pricingpending' || status === 'readyforpricing') return 'pricing-ready';
    return 'searching';
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!shortlist) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <p className="text-muted-foreground">Shortlist not found</p>
          <Link href="/company/shortlists">
            <Button className="mt-4">Back to Shortlists</Button>
          </Link>
        </div>
      </div>
    );
  }

  const state = getShortlistState(shortlist);
  const candidateCount = shortlist.proposedCandidates || shortlist.candidates.length || 3;
  const pricing = shortlist.proposedPrice || 2400;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-16">
        {state === 'searching' && (
          <div className="space-y-6">
            <Badge>Searching</Badge>
            <div>
              <h1 className="mb-3">We're curating your shortlist</h1>
              <p className="text-muted-foreground">
                We're reviewing our candidate pool to find the best matches for your role. This typically takes 2–3 business days.
              </p>
            </div>
            <div className="mt-8 p-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                We'll email you when action is needed.
              </p>
            </div>
          </div>
        )}

        {state === 'pricing-ready' && (
          <div className="space-y-6">
            <Badge>Pricing ready</Badge>
            <div>
              <h1 className="mb-3">Your shortlist is ready</h1>
              <p className="text-muted-foreground mb-8">
                We've prepared {candidateCount} candidates who meet your requirements. Review the pricing below to continue.
              </p>

              <div className="border border-border rounded-lg p-8 bg-card space-y-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-muted-foreground mb-1">Shortlist price</p>
                    <p className="text-3xl text-foreground">€{pricing}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{candidateCount} candidates</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Price is per shortlist delivery. You only pay if we deliver candidates that meet our quality bar.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleApprove}
              disabled={isApproving}
            >
              {isApproving ? 'Approving...' : 'Approve to continue'}
            </Button>

            {shortlist.lastEmailSentAt && (
              <div className="mt-8 p-6 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Last email sent: {new Date(shortlist.lastEmailSentAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {state === 'awaiting-approval' && (
          <div className="space-y-6">
            <Badge>Awaiting approval</Badge>
            <div>
              <h1 className="mb-3">Approval pending</h1>
              <p className="text-muted-foreground">
                We're processing your approval. You'll be able to view candidates shortly.
              </p>
            </div>
            <div className="mt-8 p-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                We'll email you when the shortlist is delivered.
              </p>
            </div>
          </div>
        )}

        {state === 'delivered' && (
          <div className="space-y-6">
            <Badge variant="primary">Delivered</Badge>
            <div>
              <h1 className="mb-3">Your shortlist</h1>
              <p className="text-muted-foreground mb-8">
                {shortlist.candidates.length} candidates ready for review. Contact details are unlocked.
              </p>

              <div className="space-y-4">
                {shortlist.candidates
                  .sort((a, b) => a.rank - b.rank)
                  .map((candidate) => {
                    const skills = candidate.skills || candidate.topSkills || [];
                    const yearsExp = candidate.yearsExperience ||
                      (candidate.seniorityEstimate === 'senior' ? 8 :
                       candidate.seniorityEstimate === 'mid' ? 4 : 2);
                    const candidateRecs = getCandidateRecommendations(candidate.candidateId);

                    // Derive capabilities from skills for display
                    const capabilities = candidate.capabilities || deriveCapabilities(skills);

                    // Get interest status display
                    const getInterestDisplay = () => {
                      switch (candidate.interestStatus) {
                        case 'interested':
                          return { label: 'Interested', color: 'bg-green-100 text-green-800 border-green-200' };
                        case 'not_interested':
                          return { label: 'Declined', color: 'bg-gray-100 text-gray-600 border-gray-200' };
                        case 'interested_later':
                          return { label: 'Maybe Later', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
                        default:
                          return null;
                      }
                    };
                    const interestDisplay = getInterestDisplay();

                    return (
                      <div
                        key={candidate.candidateId}
                        onClick={() => router.push(`/company/talent/${candidate.candidateId}?shortlistId=${shortlistId}`)}
                        className={`border rounded-lg p-6 bg-card cursor-pointer hover:shadow-sm transition-all ${
                          candidate.interestStatus === 'interested'
                            ? 'border-green-300 hover:border-green-400'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {/* Interest Status Banner */}
                        {interestDisplay && (
                          <div className={`-mx-6 -mt-6 mb-4 px-6 py-2 border-b ${interestDisplay.color}`}>
                            <div className="flex items-center gap-2">
                              {candidate.interestStatus === 'interested' && (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                              <span className="text-sm font-medium">{interestDisplay.label}</span>
                              {candidate.interestRespondedAt && (
                                <span className="text-xs opacity-75">
                                  · {new Date(candidate.interestRespondedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="mb-1">{candidate.desiredRole || 'Software Engineer'}</h3>
                            <p className="text-sm text-muted-foreground">{yearsExp} years experience</p>
                          </div>
                          <Badge variant="secondary">
                            {candidate.availability === 'open' ? 'Available' :
                             candidate.availability === 'passive' ? 'Open' : 'Not Looking'}
                          </Badge>
                        </div>

                        <div className="space-y-3 mb-4">
                          {candidate.matchReason && (
                            <p className="text-sm text-muted-foreground">
                              {candidate.matchReason}
                            </p>
                          )}

                          <CapabilitiesDisplay capabilities={capabilities} showEmptyState={false} />
                        </div>

                        {/* Recommendations Section */}
                        {candidateRecs.length > 0 && (
                          <div className="pt-4 border-t border-border mb-4">
                            <p className="text-sm font-medium mb-3">Recommendations</p>
                            <div className="space-y-3">
                              {candidateRecs.map((rec, idx) => (
                                <div key={idx} className="bg-muted/50 rounded-lg p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <p className="text-sm font-medium text-foreground">
                                        {rec.recommenderName}
                                        {rec.recommenderRole && `, ${rec.recommenderRole}`}
                                        {rec.recommenderCompany && ` at ${rec.recommenderCompany}`}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {rec.relationship}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground italic">
                                    &ldquo;{rec.content}&rdquo;
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 border-t border-border flex items-center justify-between">
                          <div>
                            <p className="text-sm mb-1">Contact</p>
                            <p className="text-sm text-muted-foreground">
                              {candidate.email || `${candidate.firstName?.toLowerCase() || 'candidate'}@email.com`}
                            </p>
                          </div>
                          <span className="text-sm text-primary flex items-center gap-1">
                            View full profile
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {state === 'no-match' && (
          <div className="space-y-6">
            <Badge variant="secondary">No suitable candidates found</Badge>
            <div>
              <h1 className="mb-3">No suitable candidates found</h1>
              <p className="text-muted-foreground mb-8">
                We couldn't confidently deliver a shortlist that met our quality bar for this role. This happens occasionally when requirements are very specific or the timing isn't right.
              </p>

              <div className="space-y-4">
                <div className="border border-border rounded-lg p-6 bg-card">
                  <h4 className="mb-2">What happens next?</h4>
                  <p className="text-sm text-muted-foreground">
                    You haven't been charged. You can submit a new request anytime, or we can keep this role on file and notify you when suitable candidates become available.
                  </p>
                </div>

                {shortlist.outcomeReason && (
                  <div className="border border-border rounded-lg p-6 bg-muted">
                    <h4 className="mb-2">More details</h4>
                    <p className="text-sm text-muted-foreground">
                      {shortlist.outcomeReason}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={handleKeepOnFile}>
                  Keep on file
                </Button>
                <Button onClick={handleNewRequest}>
                  Submit new request
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
