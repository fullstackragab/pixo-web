"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import CapabilitiesDisplay from "@/components/CapabilitiesDisplay";
import api from "@/lib/api";
import { deriveCapabilities } from "@/lib/capabilities";
import {
  CandidateRecommendationsSummary,
  CompanyRecommendation,
  Capabilities,
} from "@/types";

type ShortlistState =
  | "searching"
  | "pricing-ready"
  | "awaiting-approval"
  | "delivered"
  | "no-match";
type CandidateTab = "interested" | "no-response" | "declined";

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
  gitHubSummary?: string;
  // Interest response from candidate
  interestStatus?:
    | "pending"
    | "interested"
    | "not_interested"
    | "interested_later";
  interestRespondedAt?: string;
}

interface ShortlistCandidatePreview {
  previewId: number;
  role: string | null;
  seniority: string | null;
  topSkills: string[];
  availability: string;
  workSetup: string | null;
  region: string | null;
  whyThisCandidate: string;
  rank: number;
  seniorityLabel: string;
  availabilityLabel: string;
  workSetupLabel: string;
  hasPublicWorkSummary?: boolean;
}

interface InterestCounts {
  interested: number;
  declined: number;
  noResponse: number;
  total: number;
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
  candidatePreviews?: ShortlistCandidatePreview[];
  hasPreviews?: boolean;
  profilesUnlocked?: boolean;
  interestCounts?: InterestCounts;
  maxCandidates?: number;
  proposedPrice?: number;
  proposedCandidates?: number;
  shortlistOutcome?: string;
  outcomeReason?: string;
  lastEmailSentAt?: string;
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "primary";
}) {
  const baseClasses =
    "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium";
  const variantClasses = {
    default: "bg-accent text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    primary: "bg-primary text-primary-foreground",
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
  variant = "default",
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "outline";
  disabled?: boolean;
  className?: string;
}) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline:
      "border border-border bg-card hover:bg-accent hover:text-accent-foreground",
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
  const [recommendations, setRecommendations] = useState<
    CandidateRecommendationsSummary[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [activeTab, setActiveTab] = useState<CandidateTab>("interested");
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState<string>("");
  const [declineFeedback, setDeclineFeedback] = useState<string>("");
  const [isDeclining, setIsDeclining] = useState(false);

  useEffect(() => {
    if (!authLoading && user && shortlistId) {
      loadShortlist();
    }
  }, [authLoading, user, shortlistId]);

  // Set smart default tab when shortlist loads
  useEffect(() => {
    if (shortlist?.interestCounts) {
      const { interested, noResponse } = shortlist.interestCounts;
      // Default to Interested if any, otherwise No response, otherwise Declined
      if (interested > 0) {
        setActiveTab("interested");
      } else if (noResponse > 0) {
        setActiveTab("no-response");
      } else {
        setActiveTab("declined");
      }
    }
  }, [shortlist?.interestCounts]);

  const loadShortlist = async () => {
    setIsLoading(true);
    const res = await api.get<ShortlistDetail>(`/shortlists/${shortlistId}`);
    if (res.success && res.data) {
      setShortlist(res.data);
      // Load recommendations for delivered shortlists
      const status = res.data.status?.toLowerCase().replace(/_/g, "");
      if (
        status === "delivered" ||
        status === "completed" ||
        status === "paid"
      ) {
        loadRecommendations();
      }
    }
    setIsLoading(false);
  };

  const loadRecommendations = async () => {
    const res = await api.get<CandidateRecommendationsSummary[]>(
      `/shortlists/${shortlistId}/recommendations`
    );
    if (res.success && res.data) {
      setRecommendations(res.data);
    }
  };

  const getCandidateRecommendations = (
    candidateId: string
  ): CompanyRecommendation[] => {
    const summary = recommendations.find((r) => r.candidateId === candidateId);
    return summary?.recommendations || [];
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await api.post(`/shortlists/${shortlistId}/approve`);
      if (res.success) {
        await loadShortlist();
      }
    } finally {
      setIsApproving(false);
    }
  };

  const handleKeepOnFile = async () => {
    await api.post(`/shortlists/${shortlistId}/keep-on-file`);
    router.push("/company/shortlists");
  };

  const handleNewRequest = () => {
    router.push("/company/shortlists/new");
  };

  const handleDecline = async () => {
    if (!declineReason) return;

    setIsDeclining(true);
    try {
      const res = await api.post(`/shortlists/${shortlistId}/decline`, {
        reason: declineReason,
        feedback: declineFeedback || undefined,
      });
      if (res.success) {
        setShowDeclineModal(false);
        router.push("/company/shortlists");
      }
    } finally {
      setIsDeclining(false);
    }
  };

  // Map backend status to UI state
  const getShortlistState = (shortlist: ShortlistDetail): ShortlistState => {
    const status = shortlist.status?.toLowerCase().replace(/_/g, "");
    const outcome = shortlist.shortlistOutcome?.toLowerCase().replace(/_/g, "");

    if (outcome === "nomatch") return "no-match";
    if (status === "delivered" || status === "completed" || status === "paid")
      return "delivered";
    if (status === "pricingapproved" || status === "approved")
      return "awaiting-approval";
    if (
      status === "pricingrequested" ||
      status === "pricingpending" ||
      status === "readyforpricing"
    )
      return "pricing-ready";
    return "searching";
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
  const candidateCount =
    shortlist.proposedCandidates || shortlist.candidates.length || 3;
  const pricing = shortlist.proposedPrice || 2400;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-16">
        {state === "searching" && (
          <div className="space-y-6">
            <Badge>Searching</Badge>
            <div>
              <h1 className="mb-3">We're curating your shortlist</h1>
              <p className="text-muted-foreground">
                We're reviewing our candidate pool to find the best matches for
                your role. This typically takes 2–3 business days.
              </p>
            </div>
            <div className="mt-8 p-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                We'll email you when action is needed.
              </p>
            </div>
          </div>
        )}

        {state === "pricing-ready" && (
          <div className="space-y-6">
            <Badge>Pricing ready</Badge>
            <div>
              <h1 className="mb-3">Your shortlist is ready</h1>
              <p className="text-muted-foreground mb-8">
                We've prepared a curated shortlist of candidates that meet your
                requirements, prioritizing quality over volume.
              </p>

              <div className="border border-border rounded-lg p-8 bg-card space-y-6">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-muted-foreground mb-1">
                      Shortlist price
                    </p>
                    <p className="text-3xl text-foreground">€{pricing}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-wrap justify-end gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Hand-reviewed
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Availability verified
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        No spam
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Price is per shortlist delivery. You only pay if we deliver
                    candidates that meet our quality bar.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If this shortlist doesn't feel right, you can decline — no charge.
                  </p>
                </div>
              </div>

              {/* Candidate Preview Section */}
              {shortlist.hasPreviews && shortlist.candidatePreviews && shortlist.candidatePreviews.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Preview of your shortlist</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      Full profiles unlock after approval, including work summaries
                    </span>
                  </div>
                  <div className="space-y-3">
                    {shortlist.candidatePreviews
                      .sort((a, b) => a.rank - b.rank)
                      .map((preview) => (
                        <div
                          key={preview.previewId}
                          className="border border-border rounded-lg p-5 bg-card relative overflow-hidden"
                        >
                          {/* Rank and locked indicator */}
                          <div className="absolute top-3 right-3 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              #{preview.rank}
                            </span>
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Preview
                            </span>
                          </div>

                          <div className="space-y-3">
                            {/* Role and seniority */}
                            <div>
                              <h4 className="font-medium">
                                {preview.role || "Software Engineer"}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                {preview.seniorityLabel && (
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                    {preview.seniorityLabel}
                                  </span>
                                )}
                                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                                  {preview.availabilityLabel}
                                </span>
                              </div>
                            </div>

                            {/* Key skills */}
                            {preview.topSkills && preview.topSkills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {preview.topSkills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Work setup and region */}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              {preview.workSetupLabel && (
                                <span>{preview.workSetupLabel}</span>
                              )}
                              {preview.region && (
                                <>
                                  <span className="text-muted-foreground/50">|</span>
                                  <span>{preview.region}</span>
                                </>
                              )}
                            </div>

                            {/* Why this candidate */}
                            {preview.whyThisCandidate && (
                              <div className="pt-3 border-t border-border">
                                <p className="text-sm text-muted-foreground italic">
                                  "{preview.whyThisCandidate}"
                                </p>
                              </div>
                            )}

                            {/* Public work reviewed indicator */}
                            {preview.hasPublicWorkSummary && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2">
                                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Public work reviewed (projects & documentation)</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 mt-8">
              <Button onClick={handleApprove} disabled={isApproving}>
                {isApproving ? "Loading..." : "Approve & unlock full profiles"}
              </Button>
              <div>
                <button
                  onClick={() => setShowDeclineModal(true)}
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
                >
                  Not a fit? Decline shortlist
                </button>
              </div>
            </div>

            {shortlist.lastEmailSentAt && (
              <div className="mt-8 p-6 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Last email sent:{" "}
                  {new Date(shortlist.lastEmailSentAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {state === "awaiting-approval" && (
          <div className="space-y-6">
            <Badge>Awaiting approval</Badge>
            <div>
              <h1 className="mb-3">Approval pending</h1>
              <p className="text-muted-foreground">
                We're processing your approval. You'll be able to view
                candidates shortly.
              </p>
            </div>
            <div className="mt-8 p-6 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                We'll email you when the shortlist is delivered.
              </p>
            </div>
          </div>
        )}

        {state === "delivered" &&
          (() => {
            // Use backend-provided counts
            const counts = shortlist.interestCounts || {
              interested: 0,
              declined: 0,
              noResponse: 0,
              total: 0,
            };

            // Filter candidates based on active tab
            const filteredCandidates = shortlist.candidates.filter((c) => {
              if (activeTab === "interested")
                return c.interestStatus === "interested";
              if (activeTab === "declined")
                return c.interestStatus === "not_interested";
              // no-response includes pending, interested_later, or undefined
              return (
                !c.interestStatus ||
                c.interestStatus === "pending" ||
                c.interestStatus === "interested_later"
              );
            });

            const maxCandidates = shortlist.maxCandidates || 7;

            return (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Badge variant="primary">Delivered</Badge>
                </div>
                <div>
                  <h1 className="mb-3">{shortlist.roleTitle}</h1>
                  <p className="text-muted-foreground mb-6">
                    {shortlist.candidates.length} candidates ready for review.
                    Contact details are unlocked.
                  </p>

                  {/* Status Tabs */}
                  <div className="flex gap-2 mb-6 border-b border-border">
                    <button
                      onClick={() => setActiveTab("interested")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "interested"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Interested ({counts.interested})
                    </button>
                    <button
                      onClick={() => setActiveTab("no-response")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "no-response"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      No response ({counts.noResponse})
                    </button>
                    <button
                      onClick={() => setActiveTab("declined")}
                      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === "declined"
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Declined ({counts.declined})
                    </button>
                  </div>

                  {/* Empty State */}
                  {filteredCandidates.length === 0 && (
                    <div className="text-center py-12 border border-dashed border-border rounded-lg">
                      <p className="text-muted-foreground">
                        {activeTab === "interested" &&
                          "No candidates have responded with interest yet."}
                        {activeTab === "no-response" &&
                          "All candidates have responded."}
                        {activeTab === "declined" &&
                          "No candidates have declined."}
                      </p>
                      {activeTab === "interested" && counts.noResponse > 0 && (
                        <button
                          onClick={() => setActiveTab("no-response")}
                          className="mt-2 text-sm text-primary hover:underline"
                        >
                          View {counts.noResponse} awaiting response →
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    {filteredCandidates
                      .sort((a, b) => a.rank - b.rank)
                      .map((candidate) => {
                        const skills =
                          candidate.skills || candidate.topSkills || [];
                        const yearsExp =
                          candidate.yearsExperience ||
                          (candidate.seniorityEstimate === "senior"
                            ? 8
                            : candidate.seniorityEstimate === "mid"
                            ? 4
                            : 2);
                        const candidateRecs = getCandidateRecommendations(
                          candidate.candidateId
                        );

                        // Derive capabilities from skills for display
                        const capabilities =
                          candidate.capabilities || deriveCapabilities(skills);

                        // Get interest status display
                        const getInterestDisplay = () => {
                          switch (candidate.interestStatus) {
                            case "interested":
                              return {
                                label: "Interested",
                                color:
                                  "bg-green-100 text-green-800 border-green-200",
                              };
                            case "not_interested":
                              return {
                                label: "Declined",
                                color:
                                  "bg-gray-100 text-gray-600 border-gray-200",
                              };
                            case "interested_later":
                              return {
                                label: "Maybe Later",
                                color:
                                  "bg-yellow-100 text-yellow-800 border-yellow-200",
                              };
                            default:
                              return null;
                          }
                        };
                        const interestDisplay = getInterestDisplay();

                        return (
                          <div
                            key={candidate.candidateId}
                            onClick={() =>
                              router.push(
                                `/company/talent/${candidate.candidateId}?shortlistId=${shortlistId}`
                              )
                            }
                            className={`border rounded-lg p-6 bg-card cursor-pointer hover:shadow-sm transition-all ${
                              candidate.interestStatus === "interested"
                                ? "border-green-300 hover:border-green-400"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {/* Interest Status Banner */}
                            {interestDisplay && (
                              <div
                                className={`-mx-6 -mt-6 mb-4 px-6 py-2 border-b ${interestDisplay.color}`}
                              >
                                <div className="flex items-center gap-2">
                                  {candidate.interestStatus ===
                                    "interested" && (
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                  <span className="text-sm font-medium">
                                    {interestDisplay.label}
                                  </span>
                                  {candidate.interestRespondedAt && (
                                    <span className="text-xs opacity-75">
                                      ·{" "}
                                      {new Date(
                                        candidate.interestRespondedAt
                                      ).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="mb-1">
                                  {candidate.desiredRole || "Software Engineer"}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {yearsExp} years experience
                                </p>
                              </div>
                              <Badge variant="secondary">
                                {candidate.availability === "open"
                                  ? "Available"
                                  : candidate.availability === "passive"
                                  ? "Open"
                                  : "Not Looking"}
                              </Badge>
                            </div>

                            <div className="space-y-3 mb-4">
                              {candidate.matchReason && (
                                <p className="text-sm text-muted-foreground">
                                  {candidate.matchReason}
                                </p>
                              )}

                              <CapabilitiesDisplay
                                capabilities={capabilities}
                                showEmptyState={false}
                              />
                            </div>

                            {/* Public work summary */}
                            {candidate.gitHubSummary && (
                              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm font-medium mb-2">
                                  Public work summary <span className="font-normal text-muted-foreground">(based on project documentation)</span>
                                </p>
                                <div className="text-sm text-muted-foreground">
                                  {(() => {
                                    const lines = candidate.gitHubSummary.split('\n').filter(line => line.trim());
                                    const intro: string[] = [];
                                    const bullets: string[] = [];
                                    const closing: string[] = [];
                                    let section: 'intro' | 'bullets' | 'closing' = 'intro';

                                    for (const line of lines) {
                                      if (line.trim().startsWith('- ')) {
                                        section = 'bullets';
                                        bullets.push(line.trim().slice(2));
                                      } else if (section === 'bullets') {
                                        section = 'closing';
                                        closing.push(line.trim());
                                      } else if (section === 'intro') {
                                        intro.push(line.trim());
                                      } else {
                                        closing.push(line.trim());
                                      }
                                    }

                                    return (
                                      <>
                                        {intro.length > 0 && (
                                          <p className="mb-3">{intro.join(' ')}</p>
                                        )}
                                        {bullets.length > 0 && (
                                          <ul className="list-disc list-outside ml-5 space-y-2 mb-3">
                                            {bullets.map((bullet, idx) => (
                                              <li key={idx}>{bullet}</li>
                                            ))}
                                          </ul>
                                        )}
                                        {closing.length > 0 && (
                                          <p>{closing.join(' ')}</p>
                                        )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            )}

                            {/* Recommendations Section */}
                            {candidateRecs.length > 0 && (
                              <div className="pt-4 border-t border-border mb-4">
                                <p className="text-sm font-medium mb-3">
                                  Recommendations
                                </p>
                                <div className="space-y-3">
                                  {candidateRecs.map((rec, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-muted/50 rounded-lg p-4"
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div>
                                          <p className="text-sm font-medium text-foreground">
                                            {rec.recommenderName}
                                            {rec.recommenderRole &&
                                              `, ${rec.recommenderRole}`}
                                            {rec.recommenderCompany &&
                                              ` at ${rec.recommenderCompany}`}
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
                                  {candidate.email ||
                                    `${
                                      candidate.firstName?.toLowerCase() ||
                                      "candidate"
                                    }@email.com`}
                                </p>
                              </div>
                              <span className="text-sm text-primary flex items-center gap-1">
                                View full profile
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            );
          })()}

        {state === "no-match" && (
          <div className="space-y-6">
            <Badge variant="secondary">No suitable candidates found</Badge>
            <div>
              <h1 className="mb-3">No suitable candidates found</h1>
              <p className="text-muted-foreground mb-8">
                We couldn't confidently deliver a shortlist that met our quality
                bar for this role. This happens occasionally when requirements
                are very specific or the timing isn't right.
              </p>

              <div className="space-y-4">
                <div className="border border-border rounded-lg p-6 bg-card">
                  <h4 className="mb-2">What happens next?</h4>
                  <p className="text-sm text-muted-foreground">
                    You haven't been charged. You can submit a new request
                    anytime, or we can keep this role on file and notify you
                    when suitable candidates become available.
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
                <Button onClick={handleNewRequest}>Submit new request</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeclineModal(false)}
          />
          <div className="relative bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4 shadow-lg">
            <h3 className="text-lg font-semibold mb-4">Decline shortlist</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Help us improve by sharing why this shortlist isn't a fit. You
              won't be charged.
            </p>

            <div className="space-y-3 mb-6">
              <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="declineReason"
                  value="pricing"
                  checked={declineReason === "pricing"}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">Pricing doesn't work</p>
                  <p className="text-xs text-muted-foreground">
                    The price is higher than expected for this shortlist
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="declineReason"
                  value="relevance"
                  checked={declineReason === "relevance"}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">Candidates not relevant</p>
                  <p className="text-xs text-muted-foreground">
                    Based on the preview, the candidates don't seem like a good match
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="declineReason"
                  value="timing"
                  checked={declineReason === "timing"}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">Timing changed</p>
                  <p className="text-xs text-muted-foreground">
                    Our hiring needs have changed since we submitted this request
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="radio"
                  name="declineReason"
                  value="other"
                  checked={declineReason === "other"}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium">Other reason</p>
                </div>
              </label>
            </div>

            {(declineReason === "other" || declineReason) && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Additional feedback (optional)
                </label>
                <textarea
                  value={declineFeedback}
                  onChange={(e) => setDeclineFeedback(e.target.value)}
                  placeholder="Tell us more about your decision..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineReason("");
                  setDeclineFeedback("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDecline}
                disabled={!declineReason || isDeclining}
              >
                {isDeclining ? "Declining..." : "Decline shortlist"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
