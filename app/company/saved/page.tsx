'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { SeniorityLevel, Availability } from '@/types';
import Breadcrumb, { companyBreadcrumbs } from '@/components/ui/Breadcrumb';

interface SavedCandidate {
  id: string;
  candidateId: string;
  firstName?: string | null;
  lastName?: string | null;
  desiredRole?: string | null;
  availability: Availability;
  seniorityEstimate?: SeniorityLevel | null;
  topSkills?: string[];
  skills?: { skillName: string }[];
  notes?: string | null;
  savedAt: string;
  // Nested candidate object in case API returns it this way
  candidate?: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    desiredRole?: string | null;
    availability?: Availability;
    seniorityEstimate?: SeniorityLevel | null;
    topSkills?: string[];
    skills?: { skillName: string }[];
  };
}

export default function CompanySavedPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [savedCandidates, setSavedCandidates] = useState<SavedCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSaved = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<SavedCandidate[]>('/companies/saved');
      if (res.success && res.data) {
        console.log('Saved candidates response:', res.data);
        setSavedCandidates(res.data);
      } else {
        setError(res.error || 'Failed to load saved candidates');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Helper to get candidate data (handles both flat and nested API responses)
  const getCandidateData = (saved: SavedCandidate) => {
    const c = saved.candidate || saved;
    return {
      firstName: c.firstName,
      lastName: c.lastName,
      desiredRole: c.desiredRole,
      availability: c.availability ?? saved.availability,
      seniorityEstimate: c.seniorityEstimate ?? saved.seniorityEstimate,
      topSkills: c.topSkills || [],
      skills: c.skills || [],
    };
  };

  const getDisplayName = (saved: SavedCandidate) => {
    const c = getCandidateData(saved);
    if (c.firstName && c.lastName) {
      return `${c.firstName} ${c.lastName.charAt(0)}.`;
    }
    if (c.firstName) {
      return c.firstName;
    }
    if (c.desiredRole) {
      return c.desiredRole;
    }
    return 'Anonymous Candidate';
  };

  const getSkills = (saved: SavedCandidate): string[] => {
    const c = getCandidateData(saved);
    if (c.topSkills && c.topSkills.length > 0) {
      return c.topSkills;
    }
    if (c.skills && c.skills.length > 0) {
      return c.skills.map(s => s.skillName);
    }
    return [];
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadSaved();
    }
  }, [authLoading, user, loadSaved]);

  const unsave = async (candidateId: string) => {
    try {
      await api.delete(`/companies/candidates/save/${candidateId}`);
      setSavedCandidates((prev) => prev.filter(c => c.candidateId !== candidateId));
    } catch {
      setError('Failed to remove candidate');
    }
  };

  const getSeniorityLabel = (seniority: SeniorityLevel | null) => {
    if (seniority === null) return null;
    const labels = ['Junior', 'Mid', 'Senior', 'Lead', 'Principal'];
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
        <Breadcrumb items={companyBreadcrumbs.saved()} />

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

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Saved Candidates</h1>
          <p className="text-gray-500 mt-1">{savedCandidates.length} candidates saved</p>
        </div>

        {savedCandidates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedCandidates.map((saved) => {
              const candidateData = getCandidateData(saved);
              const skills = getSkills(saved);
              return (
              <Card key={saved.id || saved.candidateId} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {getDisplayName(saved)}
                    </h3>
                    {candidateData.desiredRole && (
                      <p className="text-sm text-gray-600">{candidateData.desiredRole}</p>
                    )}
                  </div>
                  <button
                    onClick={() => unsave(saved.candidateId)}
                    className="p-2 rounded-full text-blue-600 hover:bg-blue-50"
                  >
                    <svg className="w-5 h-5" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {getAvailabilityBadge(candidateData.availability)}
                  {candidateData.seniorityEstimate != null && (
                    <Badge variant="default">{getSeniorityLabel(candidateData.seniorityEstimate)}</Badge>
                  )}
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {skills.slice(0, 5).map((skill, i) => (
                      <Badge key={i} variant="primary">{skill}</Badge>
                    ))}
                    {skills.length > 5 && (
                      <Badge variant="default">+{skills.length - 5}</Badge>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-400 mb-3">
                  Saved on {new Date(saved.savedAt).toLocaleDateString()}
                </p>

                <div className="flex gap-2">
                  <Link href={`/company/talent/${saved.candidateId}`} className="flex-1">
                    <Button variant="outline" className="w-full">View</Button>
                  </Link>
                  <Button className="flex-1">Message</Button>
                </div>
              </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p className="text-gray-500 mt-2">No saved candidates yet</p>
              <p className="text-sm text-gray-400">Browse talent and save candidates you&apos;re interested in</p>
            </div>
          </Card>
        )}
      </PageContainer>
    </PageWrapper>
  );
}
