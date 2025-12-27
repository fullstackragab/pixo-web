'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { SeniorityLevel, Availability, CandidateSkill, GroupedSkills, CandidateRecommendation } from '@/types';

interface AdminCandidateDetail {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  linkedInUrl: string | null;
  desiredRole: string | null;
  locationPreference: string | null;
  availability: Availability | number;
  seniorityEstimate: SeniorityLevel | number | null;
  profileVisible: boolean;
  profileStatus: 'pending_review' | 'approved' | 'rejected' | null;
  hasCv: boolean;
  cvFileName: string | null;
  cvDownloadUrl: string | null;
  skills: CandidateSkill[];
  groupedSkills?: GroupedSkills;
  recommendationsCount: number;
  profileViewsCount: number;
  createdAt: string;
  lastActiveAt: string;
}

interface CandidateShortlist {
  id: string;
  roleTitle: string;
  companyName: string;
  status: string;
  matchScore: number;
  rank: number;
  adminApproved: boolean;
  createdAt: string;
}

const SENIORITY_OPTIONS = [
  { value: 0, label: 'Junior' },
  { value: 1, label: 'Mid' },
  { value: 2, label: 'Senior' },
  { value: 3, label: 'Lead' },
  { value: 4, label: 'Principal' },
];

const normalizeAvailability = (availability: Availability | number): string => {
  if (typeof availability === 'number') {
    const map: Record<number, string> = { 0: 'open', 1: 'notnow', 2: 'passive' };
    return map[availability] || 'open';
  }
  return String(availability).toLowerCase();
};

const normalizeSeniority = (seniority: SeniorityLevel | number | null | string): number | null => {
  if (seniority === null || seniority === undefined) return null;
  if (typeof seniority === 'number') return seniority;
  if (typeof seniority === 'string') {
    const map: Record<string, number> = { junior: 0, mid: 1, senior: 2, lead: 3, principal: 4 };
    return map[seniority.toLowerCase()] ?? null;
  }
  return null;
};

const getSeniorityLabel = (seniority: SeniorityLevel | number | null): string => {
  const normalized = normalizeSeniority(seniority);
  if (normalized === null) return 'Not set';
  return SENIORITY_OPTIONS.find(o => o.value === normalized)?.label || 'Unknown';
};

export default function AdminCandidateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<AdminCandidateDetail | null>(null);
  const [recommendations, setRecommendations] = useState<CandidateRecommendation[]>([]);
  const [shortlists, setShortlists] = useState<CandidateShortlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSeniority, setSelectedSeniority] = useState<number | null>(null);

  useEffect(() => {
    if (!candidateId) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      const [candidateRes, recsRes, shortlistsRes] = await Promise.all([
        api.get<AdminCandidateDetail>(`/admin/candidates/${candidateId}`),
        api.get<CandidateRecommendation[]>(`/admin/candidates/${candidateId}/recommendations`),
        api.get<CandidateShortlist[]>(`/admin/candidates/${candidateId}/shortlists`),
      ]);

      if (candidateRes.success && candidateRes.data) {
        setCandidate(candidateRes.data);
        setSelectedSeniority(normalizeSeniority(candidateRes.data.seniorityEstimate));
      } else {
        setError(candidateRes.error || 'Failed to load candidate');
      }

      if (recsRes.success && recsRes.data) {
        setRecommendations(recsRes.data);
      }

      if (shortlistsRes.success && shortlistsRes.data) {
        setShortlists(shortlistsRes.data);
      }

      setIsLoading(false);
    };

    loadData();
  }, [candidateId]);

  const handleApprove = async () => {
    if (!candidate) return;
    setIsSaving(true);

    const payload: { seniority?: number } = {};
    if (selectedSeniority !== null && selectedSeniority !== normalizeSeniority(candidate.seniorityEstimate)) {
      payload.seniority = selectedSeniority;
    }

    const res = await api.post(`/admin/candidates/${candidateId}/approve`, payload);
    if (res.success) {
      setCandidate({ ...candidate, profileStatus: 'approved', profileVisible: true });
    } else {
      setError(res.error || 'Failed to approve candidate');
    }
    setIsSaving(false);
  };

  const handleReject = async () => {
    if (!candidate) return;
    setIsSaving(true);

    const res = await api.post(`/admin/candidates/${candidateId}/reject`);
    if (res.success) {
      setCandidate({ ...candidate, profileStatus: 'rejected', profileVisible: false });
    } else {
      setError(res.error || 'Failed to reject candidate');
    }
    setIsSaving(false);
  };

  const handleUpdateSeniority = async () => {
    if (!candidate || selectedSeniority === null) return;
    setIsSaving(true);

    const res = await api.put(`/admin/candidates/${candidateId}/seniority`, { seniority: selectedSeniority });
    if (res.success) {
      setCandidate({ ...candidate, seniorityEstimate: selectedSeniority });
    } else {
      setError(res.error || 'Failed to update seniority');
    }
    setIsSaving(false);
  };

  const handleToggleVisibility = async () => {
    if (!candidate) return;
    setIsSaving(true);

    const newVisibility = !candidate.profileVisible;
    const res = await api.put(`/admin/candidates/${candidateId}/visibility`, { visible: newVisibility });
    if (res.success) {
      setCandidate({ ...candidate, profileVisible: newVisibility });
    } else {
      setError(res.error || 'Failed to update visibility');
    }
    setIsSaving(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAvailabilityLabel = (availability: Availability | number): string => {
    const normalized = normalizeAvailability(availability);
    const map: Record<string, string> = { open: 'Actively Looking', passive: 'Open to Opportunities', notnow: 'Not Looking' };
    return map[normalized] || normalized;
  };

  const getStatusBadge = () => {
    if (!candidate) return null;
    if (!candidate.hasCv) {
      return <Badge variant="danger">No CV</Badge>;
    }
    switch (candidate.profileStatus) {
      case 'pending_review':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge variant="warning">Pending Review</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !candidate) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.push('/admin/candidates')}>
          Back to Candidates
        </Button>
      </div>
    );
  }

  if (!candidate) return null;

  const primarySkills = candidate.groupedSkills?.primary || candidate.skills.filter(s => s.skillLevel === 'primary');
  const secondarySkills = candidate.groupedSkills?.secondary || candidate.skills.filter(s => s.skillLevel === 'secondary');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/candidates" className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {candidate.firstName && candidate.lastName
                ? `${candidate.firstName} ${candidate.lastName}`
                : 'Unnamed Candidate'}
            </h1>
            {getStatusBadge()}
            {candidate.profileVisible && (
              <Badge variant="success">Visible</Badge>
            )}
          </div>
          <p className="text-gray-500">{candidate.email}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Actions (LEFT) */}
        <div className="space-y-6 order-2 lg:order-1">
          {/* Seniority Adjustment */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Seniority Level</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Current: {getSeniorityLabel(candidate.seniorityEstimate)}</p>
                <select
                  value={selectedSeniority ?? ''}
                  onChange={(e) => setSelectedSeniority(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Not set</option>
                  {SENIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {selectedSeniority !== normalizeSeniority(candidate.seniorityEstimate) && (
                <Button
                  onClick={handleUpdateSeniority}
                  disabled={isSaving}
                  className="w-full"
                  variant="outline"
                >
                  {isSaving ? 'Saving...' : 'Update Seniority'}
                </Button>
              )}
            </div>
          </Card>

          {/* Approval Actions */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Status</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                {getStatusBadge()}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Visible:</span>
                <span className={candidate.profileVisible ? 'text-green-600' : 'text-gray-500'}>
                  {candidate.profileVisible ? 'Yes' : 'No'}
                </span>
              </div>

              {candidate.profileStatus !== 'approved' && candidate.hasCv && (
                <div className="space-y-2 pt-4 border-t">
                  <Button onClick={handleApprove} disabled={isSaving} className="w-full">
                    {isSaving ? 'Approving...' : 'Approve Profile'}
                  </Button>
                  {candidate.profileStatus !== 'rejected' && (
                    <Button onClick={handleReject} disabled={isSaving} variant="outline" className="w-full">
                      {isSaving ? 'Rejecting...' : 'Reject Profile'}
                    </Button>
                  )}
                </div>
              )}

              {candidate.profileStatus === 'approved' && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleToggleVisibility}
                    disabled={isSaving}
                    variant="outline"
                    className="w-full"
                  >
                    {isSaving ? 'Updating...' : candidate.profileVisible ? 'Hide Profile' : 'Show Profile'}
                  </Button>
                </div>
              )}

              {!candidate.hasCv && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Cannot approve without CV. The candidate must upload their CV first.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Meta Information */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Joined</span>
                <span className="text-gray-900">{formatDate(candidate.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Active</span>
                <span className="text-gray-900">{formatDate(candidate.lastActiveAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Profile Views</span>
                <span className="text-gray-900">{candidate.profileViewsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Recommendations</span>
                <span className="text-gray-900">{candidate.recommendationsCount}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content (RIGHT) */}
        <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
          {/* Shortlists Section - TOP */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Shortlists ({shortlists.length})
            </h2>
            {shortlists.length > 0 ? (
              <div className="space-y-3">
                {shortlists.map((sl) => (
                  <Link
                    key={sl.id}
                    href={`/admin/shortlists/${sl.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{sl.roleTitle}</p>
                        <p className="text-sm text-gray-500">{sl.companyName}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">#{sl.rank}</span>
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                          {sl.matchScore}% match
                        </span>
                        {sl.adminApproved && (
                          <Badge variant="success">Approved</Badge>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Not included in any shortlists yet</p>
            )}
          </Card>

          {/* CV Section */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">CV / Resume</h2>
            {candidate.hasCv ? (
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">{candidate.cvFileName || 'CV Uploaded'}</p>
                    <p className="text-sm text-gray-500">Click to download and review</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await api.get<{ downloadUrl: string; fileName: string }>(`/admin/candidates/${candidateId}/cv`);
                      if (res.success && res.data?.downloadUrl) {
                        window.open(res.data.downloadUrl, '_blank');
                      } else {
                        setError(res.error || 'Failed to get CV download URL');
                      }
                    } catch {
                      setError('Failed to download CV');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Download CV
                </button>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="font-medium text-red-800">No CV Uploaded</p>
                    <p className="text-sm text-red-600">Candidate cannot be matched without a CV</p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Profile Information */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">First Name</p>
                  <p className="font-medium text-gray-900">{candidate.firstName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Name</p>
                  <p className="font-medium text-gray-900">{candidate.lastName || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{candidate.email}</p>
              </div>
              {candidate.linkedInUrl && (
                <div>
                  <p className="text-sm text-gray-500">LinkedIn</p>
                  <a
                    href={candidate.linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {candidate.linkedInUrl}
                  </a>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Desired Role</p>
                <p className="font-medium text-gray-900">{candidate.desiredRole || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location Preference</p>
                <p className="font-medium text-gray-900">{candidate.locationPreference || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Availability</p>
                <p className="font-medium text-gray-900">{getAvailabilityLabel(candidate.availability)}</p>
              </div>
            </div>
          </Card>

          {/* Skills Section */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Skills ({candidate.skills.length} total)
            </h2>

            {candidate.skills.length === 0 ? (
              <p className="text-gray-500">No skills extracted yet</p>
            ) : (
              <div className="space-y-6">
                {/* Primary Skills */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Primary Skills ({primarySkills.length}/7)
                  </h3>
                  {primarySkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {primarySkills.map((skill) => (
                        <span
                          key={skill.id}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                        >
                          {skill.skillName}
                          {skill.confidenceScore > 0 && (
                            <span className="ml-1 text-blue-600">({Math.round(skill.confidenceScore * 100)}%)</span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No primary skills marked</p>
                  )}
                </div>

                {/* Secondary Skills */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Secondary Skills ({secondarySkills.length})
                  </h3>
                  {secondarySkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {secondarySkills.map((skill) => (
                        <span
                          key={skill.id}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {skill.skillName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No secondary skills</p>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Recommendations ({recommendations.length})
              </h2>
              <div className="space-y-4">
                {recommendations.map((rec) => (
                  <div key={rec.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{rec.recommenderName}</p>
                        <p className="text-sm text-gray-500">
                          {rec.recommenderRole && rec.recommenderCompany
                            ? `${rec.recommenderRole} at ${rec.recommenderCompany}`
                            : rec.relationship}
                        </p>
                      </div>
                      <Badge
                        variant={
                          rec.isAdminApproved ? 'success' :
                          rec.isRejected ? 'danger' :
                          rec.isSubmitted ? 'warning' : 'default'
                        }
                      >
                        {rec.isAdminApproved ? 'Admin Approved' :
                         rec.isRejected ? 'Rejected' :
                         rec.isApprovedByCandidate ? 'Pending Admin' :
                         rec.isSubmitted ? 'Pending Candidate' : 'Pending Submission'}
                      </Badge>
                    </div>
                    {rec.content && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-3">{rec.content}</p>
                    )}
                    {rec.submittedAt && (
                      <p className="text-xs text-gray-400 mt-2">Submitted {formatDate(rec.submittedAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
