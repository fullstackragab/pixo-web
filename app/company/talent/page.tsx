"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import PageContainer, { PageWrapper } from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Breadcrumb, { companyBreadcrumbs } from "@/components/ui/Breadcrumb";
import { CapabilitiesInline } from "@/components/CapabilitiesDisplay";
import api from "@/lib/api";
import { deriveCapabilities } from "@/lib/capabilities";
import {
  SeniorityLevel,
  Availability,
  TalentCandidate,
  TalentSearchResult,
  RemotePreference,
  LocationRanking,
  Capabilities,
} from "@/types";

export default function CompanyTalentPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [candidates, setCandidates] = useState<TalentCandidate[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [skillFilter, setSkillFilter] = useState("");
  const [seniorityFilter, setSeniorityFilter] = useState<string>("");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("");

  // Location ranking preferences
  const [showLocationPrefs, setShowLocationPrefs] = useState(false);
  const [locationRanking, setLocationRanking] = useState<LocationRanking>({});

  // Track applied filters separately to avoid stale closures
  const [appliedFilters, setAppliedFilters] = useState({
    skills: "",
    seniority: "",
    availability: "",
    locationRanking: {} as LocationRanking,
  });

  const loadCandidates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    let url = `/companies/talent?page=${page}&pageSize=20`;
    if (appliedFilters.skills)
      url += `&skills=${encodeURIComponent(appliedFilters.skills)}`;
    if (appliedFilters.seniority)
      url += `&seniority=${appliedFilters.seniority}`;
    if (appliedFilters.availability)
      url += `&availability=${appliedFilters.availability}`;

    // Add location ranking preferences
    const lr = appliedFilters.locationRanking;
    if (lr.preferRemote) url += `&locationRanking.preferRemote=true`;
    if (lr.preferCountry) url += `&locationRanking.preferCountry=${encodeURIComponent(lr.preferCountry)}`;
    if (lr.preferTimezone) url += `&locationRanking.preferTimezone=${encodeURIComponent(lr.preferTimezone)}`;
    if (lr.preferRelocationFriendly) url += `&locationRanking.preferRelocationFriendly=true`;

    try {
      const res = await api.get<TalentSearchResult>(url);
      if (res.success && res.data) {
        setCandidates(res.data.candidates);
        setTotalCount(res.data.totalCount);
      } else {
        setError(res.error || "Failed to load candidates");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [page, appliedFilters]);

  useEffect(() => {
    if (!authLoading && user) {
      loadCandidates();
    }
  }, [authLoading, user, loadCandidates]);

  const handleSearch = () => {
    setPage(1);
    setAppliedFilters({
      skills: skillFilter,
      seniority: seniorityFilter,
      availability: availabilityFilter,
      locationRanking: { ...locationRanking },
    });
  };

  const getRemotePreferenceLabel = (pref: RemotePreference | undefined) => {
    if (pref === undefined) return null;
    const labels = ["Remote only", "Onsite", "Hybrid", "Flexible"];
    return labels[pref];
  };

  const getLocationDisplayText = (candidate: TalentCandidate) => {
    // Prefer computed display text from API
    if (candidate.locationDisplayText) return candidate.locationDisplayText;

    // Build from structured location
    if (candidate.location) {
      const parts = [];
      if (candidate.location.city) parts.push(candidate.location.city);
      if (candidate.location.country) parts.push(candidate.location.country);

      const locationStr = parts.join(", ");
      const remoteStr = getRemotePreferenceLabel(candidate.remotePreference);
      const relocateStr = candidate.location.willingToRelocate ? "Open to relocate" : null;

      return [locationStr, remoteStr, relocateStr].filter(Boolean).join(" · ");
    }

    // Fall back to legacy field
    return candidate.locationPreference || null;
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <Header />

      <PageContainer variant="wide">
        <Breadcrumb items={companyBreadcrumbs.talent()} />

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

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Browse Talent</h1>
            <p className="text-gray-500 mt-1">
              {totalCount} candidates available
            </p>
          </div>
          <Link href="/company/shortlists">
            <Button>Request Shortlist</Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                label="Skills"
                id="skills"
                type="text"
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="React, Python, AWS..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seniority
              </label>
              <select
                value={seniorityFilter}
                onChange={(e) => setSeniorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Any</option>
                <option value="0">Junior</option>
                <option value="1">Mid</option>
                <option value="2">Senior</option>
                <option value="3">Lead</option>
                <option value="4">Principal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Availability
              </label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Any</option>
                <option value="0">Actively Looking</option>
                <option value="2">Open to Opportunities</option>
              </select>
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {/* Location Ranking Preferences */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowLocationPrefs(!showLocationPrefs)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {showLocationPrefs ? "−" : "+"} Location preferences (affects ranking, not filtering)
            </button>

            {showLocationPrefs && (
              <div className="mt-4 space-y-4">
                <p className="text-xs text-gray-500 italic">
                  Location preferences help rank candidates but don&apos;t exclude anyone. Strong skill matches are shown regardless of location.
                </p>

                <div className="flex flex-wrap gap-4 items-start">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={locationRanking.preferRemote || false}
                      onChange={(e) =>
                        setLocationRanking((prev) => ({
                          ...prev,
                          preferRemote: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Prioritize remote-ready candidates</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={locationRanking.preferRelocationFriendly || false}
                      onChange={(e) =>
                        setLocationRanking((prev) => ({
                          ...prev,
                          preferRelocationFriendly: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Prioritize candidates open to relocation</span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Boost candidates in
                    </label>
                    <select
                      value={locationRanking.preferCountry || ""}
                      onChange={(e) =>
                        setLocationRanking((prev) => ({
                          ...prev,
                          preferCountry: e.target.value || undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Any country</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Netherlands">Netherlands</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Spain">Spain</option>
                      <option value="Poland">Poland</option>
                      <option value="India">India</option>
                    </select>
                  </div>

                  <div className="min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Boost timezone
                    </label>
                    <select
                      value={locationRanking.preferTimezone || ""}
                      onChange={(e) =>
                        setLocationRanking((prev) => ({
                          ...prev,
                          preferTimezone: e.target.value || undefined,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Any timezone</option>
                      <option value="UTC-08:00">UTC-08:00 (Pacific Time)</option>
                      <option value="UTC-05:00">UTC-05:00 (Eastern Time)</option>
                      <option value="UTC+00:00">UTC+00:00 (London)</option>
                      <option value="UTC+01:00">UTC+01:00 (Berlin, Paris)</option>
                      <option value="UTC+02:00">UTC+02:00 (Helsinki, Athens)</option>
                      <option value="UTC+05:30">UTC+05:30 (India)</option>
                      <option value="UTC+08:00">UTC+08:00 (Singapore)</option>
                      <option value="UTC+09:00">UTC+09:00 (Tokyo)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Candidate Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate) => (
            <Card
              key={candidate.candidateId}
              className="hover:shadow-md transition-shadow"
            >
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900">
                  {candidate.firstName && candidate.lastName
                    ? `${candidate.firstName} ${candidate.lastName.charAt(0)}.`
                    : "Anonymous Candidate"}
                </h3>
                {candidate.desiredRole && (
                  <p className="text-sm text-gray-600">
                    {candidate.desiredRole}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {getAvailabilityBadge(candidate.availability)}
                {candidate.seniorityEstimate != null && (
                  <Badge variant="default">
                    {getSeniorityLabel(candidate.seniorityEstimate)}
                  </Badge>
                )}
              </div>

              {candidate.topSkills.length > 0 && (
                <div className="mb-3">
                  <CapabilitiesInline
                    capabilities={deriveCapabilities(candidate.topSkills)}
                    maxGroups={2}
                  />
                </div>
              )}

              {getLocationDisplayText(candidate) && (
                <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {getLocationDisplayText(candidate)}
                </p>
              )}

              <Link href={`/company/talent/${candidate.candidateId}`}>
                <Button variant="outline" className="w-full">
                  View Profile
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        {candidates.length === 0 && (
          <Card>
            <p className="text-gray-500 text-center py-8">
              No candidates found matching your criteria
            </p>
          </Card>
        )}

        {/* Pagination */}
        {totalCount > 20 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={page * 20 >= totalCount}
            >
              Next
            </Button>
          </div>
        )}
      </PageContainer>
    </PageWrapper>
  );
}
