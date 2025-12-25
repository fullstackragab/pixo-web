"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import PageContainer, { PageWrapper } from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Breadcrumb, { companyBreadcrumbs } from "@/components/ui/Breadcrumb";
import SendMessageModal from "@/components/SendMessageModal";
import api from "@/lib/api";

interface CandidateDetail {
  candidateId: string;
  firstName: string | null;
  lastName: string | null;
  desiredRole: string | null;
  locationPreference: string | null;
  remotePreference: string | null;
  availability: string;
  seniorityEstimate: string | null;
  skills: { skillName: string; category: number }[];
  topSkills?: string[];
  recommendationsCount: number;
  lastActiveAt: string;
  isSaved: boolean;
  cvDownloadUrl?: string;
  // Full profile fields (only returned when verified shortlist access)
  isInShortlist?: boolean;
}

// Skill category mapping for grouping
const SKILL_CATEGORIES: Record<number, string> = {
  0: "Languages",
  1: "Frontend",
  2: "Backend",
  3: "Database",
  4: "DevOps",
  5: "Tools",
  6: "Other",
};

export default function CandidateProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const candidateId = params.candidateId as string;
  const shortlistId = searchParams.get("shortlistId");
  const { user, isLoading: authLoading } = useAuth();

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Show full profile only if backend confirms candidate is in the shortlist
  const showFullProfile = !!shortlistId && candidate?.isInShortlist === true;

  useEffect(() => {
    if (!authLoading && user && candidateId) {
      loadCandidate();
    }
  }, [authLoading, user, candidateId, shortlistId]);

  const loadCandidate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass shortlistId to backend for verification
      const url = shortlistId
        ? `/companies/talent/${candidateId}?shortlistId=${shortlistId}`
        : `/companies/talent/${candidateId}`;

      const res = await api.get<CandidateDetail>(url);
      if (res.success && res.data) {
        setCandidate(res.data);
      } else {
        setError(res.error || "Failed to load candidate profile");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSave = async () => {
    if (!candidate || isSaving) return;
    setIsSaving(true);
    try {
      if (candidate.isSaved) {
        await api.delete(`/companies/candidates/save/${candidateId}`);
      } else {
        await api.post("/companies/candidates/save", { candidateId });
      }
      setCandidate({ ...candidate, isSaved: !candidate.isSaved });
    } catch {
      setError("Failed to save candidate");
    } finally {
      setIsSaving(false);
    }
  };

  const getSeniorityLabel = (seniority: string | null | undefined) => {
    if (seniority === null || seniority === undefined) return null;
    return seniority.charAt(0).toUpperCase() + seniority.slice(1).toLowerCase();
  };

  const getAvailabilityInfo = (availability: string) => {
    const normalized = availability.toLowerCase();
    switch (normalized) {
      case "open":
        return { label: "Actively Looking", variant: "success" as const };
      case "passive":
        return { label: "Open to Opportunities", variant: "warning" as const };
      case "notnow":
      case "not_now":
        return { label: "Not Looking", variant: "default" as const };
      default:
        return { label: availability, variant: "default" as const };
    }
  };

  const getRemoteLabel = (pref: string | null | undefined) => {
    if (pref === null || pref === undefined) return null;
    const normalized = pref.toLowerCase();
    switch (normalized) {
      case "remote":
        return "Remote Only";
      case "onsite":
        return "On-site Only";
      case "hybrid":
        return "Hybrid";
      case "flexible":
        return "Flexible";
      default:
        return pref.charAt(0).toUpperCase() + pref.slice(1).toLowerCase();
    }
  };

  // Format last active date in a friendly way
  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Group skills by category
  const groupSkillsByCategory = () => {
    if (!candidate?.skills?.length) return {};
    return candidate.skills.reduce((acc, skill) => {
      const category = SKILL_CATEGORIES[skill.category] || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(skill.skillName);
      return acc;
    }, {} as Record<string, string[]>);
  };

  // Get back link based on context
  const backLink = shortlistId
    ? `/company/shortlists/${shortlistId}`
    : "/company/talent";
  const backLabel = shortlistId ? "Back to Shortlist" : "Back to Talent";

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <PageWrapper>
        <Header />
        <PageContainer variant="wide" className="py-12 text-center">
          <p className="text-gray-500">{error || "Candidate not found"}</p>
          <Link href={backLink}>
            <Button className="mt-4">{backLabel}</Button>
          </Link>
        </PageContainer>
      </PageWrapper>
    );
  }

  const displayName =
    candidate.firstName && candidate.lastName
      ? `${candidate.firstName} ${candidate.lastName.charAt(0)}.`
      : "Anonymous Candidate";

  const skills = candidate.skills?.map(s => s.skillName) || candidate.topSkills || [];
  const groupedSkills = groupSkillsByCategory();
  const hasGroupedSkills = Object.keys(groupedSkills).length > 0;
  const availabilityInfo = getAvailabilityInfo(candidate.availability);

  return (
    <PageWrapper>
      <Header />

      <PageContainer variant="wide">
        <Breadcrumb
          items={companyBreadcrumbs.talentDetail(
            shortlistId ? { id: shortlistId } : undefined
          )}
        />

        {/* Limited view banner for talent feed browsing */}
        {!showFullProfile && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Preview Mode</p>
              <p className="text-sm text-blue-700 mt-0.5">
                You&apos;re viewing a preview. Full contact details and messaging are available when this candidate is in your shortlist.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Candidate Header Card */}
            <Card padding="lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Name and Role */}
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
                    {displayName}
                  </h1>
                  {candidate.desiredRole && (
                    <p className="text-lg text-gray-600 mt-1 truncate">
                      {candidate.desiredRole}
                    </p>
                  )}

                  {/* Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <Badge variant={availabilityInfo.variant} size="md">
                      {availabilityInfo.label}
                    </Badge>
                    {candidate.seniorityEstimate && (
                      <Badge variant="default" size="md">
                        {getSeniorityLabel(candidate.seniorityEstimate)}
                      </Badge>
                    )}
                  </div>

                  {/* Quick Stats - visible in full profile mode */}
                  {showFullProfile && (
                    <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
                      {candidate.locationPreference && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{candidate.locationPreference}</span>
                        </div>
                      )}
                      {candidate.remotePreference && (
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <span>{getRemoteLabel(candidate.remotePreference)}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Active {formatLastActive(candidate.lastActiveAt)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save Button */}
                <button
                  onClick={toggleSave}
                  disabled={isSaving}
                  className={`p-2.5 rounded-full transition-all duration-150 flex-shrink-0 ${
                    candidate.isSaved
                      ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  } ${isSaving ? "opacity-50 cursor-not-allowed" : ""}`}
                  title={candidate.isSaved ? "Remove from saved" : "Save candidate"}
                >
                  <svg
                    className="w-6 h-6"
                    fill={candidate.isSaved ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>
              </div>
            </Card>

            {/* Skills Card */}
            {skills.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Skills
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({skills.length})
                  </span>
                </h2>

                {hasGroupedSkills ? (
                  // Grouped skills display
                  <div className="space-y-4">
                    {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                      <div key={category}>
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                          {category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {categorySkills.map((skill, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-50 text-gray-700 border border-gray-200 transition-colors hover:bg-gray-100"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Flat skills display (fallback for topSkills)
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-50 text-gray-700 border border-gray-200 transition-colors hover:bg-gray-100"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Actions Card - Primary focus for full profile */}
            {showFullProfile && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Actions
                </h2>
                <div className="space-y-3">
                  <Button
                    className="w-full justify-center"
                    onClick={() => setShowMessageModal(true)}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Message
                  </Button>
                  {candidate.cvDownloadUrl && (
                    <a
                      href={candidate.cvDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full justify-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download CV
                      </Button>
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                  Send a short informational message to express interest. This is a one-way communication—candidates cannot reply directly.
                </p>
              </Card>
            )}

            {/* Details Card */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Details
              </h2>
              <dl className="space-y-4">
                {/* Show location only in full profile mode */}
                {showFullProfile && candidate.locationPreference && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Location</dt>
                      <dd className="font-medium text-gray-900">
                        {candidate.locationPreference}
                      </dd>
                    </div>
                  </div>
                )}
                {showFullProfile && candidate.remotePreference && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Work Preference</dt>
                      <dd className="font-medium text-gray-900">
                        {getRemoteLabel(candidate.remotePreference)}
                      </dd>
                    </div>
                  </div>
                )}
                {candidate.recommendationsCount > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Recommendations</dt>
                      <dd className="font-medium text-gray-900">
                        {candidate.recommendationsCount}
                      </dd>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500">Last Active</dt>
                    <dd className="font-medium text-gray-900">
                      {formatLastActive(candidate.lastActiveAt)}
                    </dd>
                  </div>
                </div>
              </dl>
            </Card>

            {/* Back Button - visible in preview mode */}
            {!showFullProfile && (
              <Link href={backLink} className="block">
                <Button variant="outline" className="w-full justify-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  {backLabel}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </PageContainer>

      {/* Message Modal - only available when verified in shortlist */}
      {showFullProfile && (
        <SendMessageModal
          candidateId={candidateId}
          candidateName={displayName}
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </PageWrapper>
  );
}
