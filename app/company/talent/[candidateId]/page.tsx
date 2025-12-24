"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { SeniorityLevel, Availability, RemotePreference } from "@/types";

interface CandidateDetail {
  candidateId: string;
  firstName: string | null;
  lastName: string | null;
  desiredRole: string | null;
  locationPreference: string | null;
  remotePreference: RemotePreference | null;
  availability: Availability;
  seniorityEstimate: SeniorityLevel | null;
  skills: { skillName: string; category: number }[];
  recommendationsCount: number;
  lastActiveAt: string;
  isSaved: boolean;
}

export default function CandidateProfilePage() {
  const params = useParams();
  const candidateId = params.candidateId as string;
  const { user, isLoading: authLoading } = useAuth();

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user && candidateId) {
      loadCandidate();
    }
  }, [authLoading, user, candidateId]);

  const loadCandidate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<CandidateDetail>(
        `/companies/talent/${candidateId}`
      );
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

  const getSeniorityLabel = (seniority: SeniorityLevel | null | undefined) => {
    if (seniority === null || seniority === undefined) return null;
    const labels = ["Junior", "Mid", "Senior", "Lead", "Principal"];
    return labels[seniority];
  };

  const getAvailabilityBadge = (availability: Availability) => {
    switch (availability) {
      case Availability.Open:
        return <Badge variant="success">Actively Looking</Badge>;
      case Availability.Passive:
        return <Badge variant="warning">Open to Opportunities</Badge>;
      case Availability.NotNow:
        return <Badge variant="default">Not Looking</Badge>;
    }
  };

  const getRemoteLabel = (pref: RemotePreference | null | undefined) => {
    if (pref === null || pref === undefined) return null;
    const labels = ["Remote Only", "On-site Only", "Hybrid", "Flexible"];
    return labels[pref];
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-500">{error || "Candidate not found"}</p>
          <Link href="/company/talent">
            <Button className="mt-4">Back to Talent</Button>
          </Link>
        </main>
      </div>
    );
  }

  const displayName =
    candidate.firstName && candidate.lastName
      ? `${candidate.firstName} ${candidate.lastName.charAt(0)}.`
      : "Anonymous Candidate";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/company/talent"
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          &larr; Back to Talent
        </Link>

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
            {candidate.skills.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, i) => (
                    <Badge key={i} variant="primary">
                      {skill.skillName}
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
                {candidate.locationPreference && (
                  <div>
                    <dt className="text-sm text-gray-500">Location</dt>
                    <dd className="font-medium text-gray-900">
                      {candidate.locationPreference}
                    </dd>
                  </div>
                )}
                {candidate.remotePreference != null && (
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

          </div>
        </div>
      </main>
    </div>
  );
}
