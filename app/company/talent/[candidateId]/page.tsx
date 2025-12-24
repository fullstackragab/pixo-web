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
    if (!candidate) return;
    try {
      if (candidate.isSaved) {
        await api.delete(`/companies/candidates/save/${candidateId}`);
      } else {
        await api.post("/companies/candidates/save", { candidateId });
      }
      setCandidate({ ...candidate, isSaved: !candidate.isSaved });
    } catch {
      setError("Failed to save candidate");
    }
  };

  const getSeniorityLabel = (seniority: string | null | undefined) => {
    if (seniority === null || seniority === undefined) return null;
    return seniority.charAt(0).toUpperCase() + seniority.slice(1).toLowerCase();
  };

  const getAvailabilityBadge = (availability: string) => {
    const normalized = availability.toLowerCase();
    switch (normalized) {
      case "open":
        return <Badge variant="success">Actively Looking</Badge>;
      case "passive":
        return <Badge variant="warning">Open to Opportunities</Badge>;
      case "notnow":
      case "not_now":
        return <Badge variant="default">Not Looking</Badge>;
      default:
        return <Badge variant="default">{availability}</Badge>;
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
        <PageContainer className="py-12 text-center">
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

  return (
    <PageWrapper>
      <Header />

      <PageContainer variant="default">
        <Link
          href={backLink}
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          &larr; {backLabel}
        </Link>

        {/* Limited view banner for talent feed browsing */}
        {!showFullProfile && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Preview Mode:</span> Explore candidates. Full contact details and messaging available only in shortlists.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {displayName}
                  </h1>
                  {candidate.desiredRole && (
                    <p className="text-lg text-gray-600 mt-1">
                      {candidate.desiredRole}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {getAvailabilityBadge(candidate.availability)}
                    {candidate.seniorityEstimate != null && (
                      <Badge variant="default">
                        {getSeniorityLabel(candidate.seniorityEstimate)}
                      </Badge>
                    )}
                  </div>
                </div>
                <button
                  onClick={toggleSave}
                  className={`p-2 rounded-full ${
                    candidate.isSaved
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
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

            {/* Skills */}
            {skills.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <Badge key={i} variant="primary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Details
              </h2>
              <dl className="space-y-3">
                {/* Show location only in full profile mode */}
                {showFullProfile && candidate.locationPreference && (
                  <div>
                    <dt className="text-sm text-gray-500">Location</dt>
                    <dd className="font-medium text-gray-900">
                      {candidate.locationPreference}
                    </dd>
                  </div>
                )}
                {showFullProfile && candidate.remotePreference != null && (
                  <div>
                    <dt className="text-sm text-gray-500">Work Preference</dt>
                    <dd className="font-medium text-gray-900">
                      {getRemoteLabel(candidate.remotePreference)}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-gray-500">Recommendations</dt>
                  <dd className="font-medium text-gray-900">
                    {candidate.recommendationsCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-500">Last Active</dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(candidate.lastActiveAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </Card>

            {/* Actions - only show when verified in shortlist */}
            {showFullProfile && (
              <Card>
                <div className="space-y-3">
                  <Button className="w-full" onClick={() => setShowMessageModal(true)}>
                    Send Message
                  </Button>
                  {candidate.cvDownloadUrl && (
                    <a
                      href={candidate.cvDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        Download CV
                      </Button>
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Send a short informational message to this candidate. Candidates cannot reply.
                </p>
              </Card>
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
