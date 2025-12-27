'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import RequestRecommendationModal from '@/components/RequestRecommendationModal';
import CapabilitiesDisplay from '@/components/CapabilitiesDisplay';
import api from '@/lib/api';
import { deriveCapabilities } from '@/lib/capabilities';
import { CandidateProfile, CandidateRecommendation, Capabilities, SeniorityLevel } from '@/types';

// Normalize seniority value from API (can be number, string, or null)
const normalizeSeniority = (value: SeniorityLevel | number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const map: Record<string, number> = {
      junior: 0,
      mid: 1,
      senior: 2,
      lead: 3,
      principal: 4,
    };
    return map[value.toLowerCase()] ?? null;
  }
  return null;
};

type ProfileStatus = 'no_cv' | 'under_review' | 'approved' | 'paused';

function getProfileStatus(profile: CandidateProfile | null): ProfileStatus {
  if (!profile) return 'no_cv';
  if (!profile.cvFileName) return 'no_cv';

  // Check backend profileStatus
  if (profile.profileStatus === 'approved') {
    // Approved but hidden = paused
    if (!profile.profileVisible) return 'paused';
    return 'approved';
  }

  // pending_review or null/undefined with CV = under review
  return 'under_review';
}

function Badge({
  children,
  variant = 'default'
}: {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
}) {
  const baseClasses = 'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium';
  const variantClasses = {
    default: 'bg-accent text-accent-foreground',
    outline: 'border border-border bg-transparent',
    primary: 'bg-primary text-primary-foreground',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
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
  size = 'default',
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
  size?: 'default' | 'sm';
  className?: string;
  disabled?: boolean;
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed';
  const sizeClasses = {
    default: 'px-4 py-2 text-sm',
    sm: 'px-3 py-1.5 text-xs',
  };
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-border bg-card hover:bg-accent hover:text-accent-foreground',
    ghost: 'hover:bg-accent hover:text-accent-foreground',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Switch({
  id,
  checked,
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-switch-background'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function ProfileStatusCard({
  status,
  onEdit,
  cvParseStatus,
}: {
  status: ProfileStatus;
  onEdit: () => void;
  cvParseStatus?: 'pending' | 'success' | 'partial' | 'failed' | null;
}) {
  const statusConfig = {
    no_cv: {
      title: 'CV Required',
      description: 'Upload your CV to complete your profile and be considered for opportunities.',
      badge: <Badge variant="warning">Incomplete</Badge>,
      icon: (
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    under_review: {
      title: 'Under Review',
      description: 'Your profile is being reviewed by our team. This typically takes 1-2 business days.',
      badge: <Badge variant="info">Under Review</Badge>,
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    approved: {
      title: 'Approved & Visible',
      description: 'Your profile can be considered for curated shortlists.',
      badge: <Badge variant="success">Active</Badge>,
      icon: (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    paused: {
      title: 'Paused',
      description: 'Your profile is hidden from companies. Turn on visibility when you\'re ready.',
      badge: <Badge variant="default">Paused</Badge>,
      icon: (
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const config = statusConfig[status];

  // Calm messaging for CV parse issues (only show when under review)
  const showParseNote = status === 'under_review' && (cvParseStatus === 'failed' || cvParseStatus === 'partial');

  return (
    <div className="border border-border rounded-lg p-6 bg-card">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{config.icon}</div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-foreground">Profile status</p>
              {config.badge}
            </div>
            <p className="text-sm text-muted-foreground">{config.description}</p>
            {showParseNote && (
              <p className="text-xs text-muted-foreground mt-2">
                We couldn&apos;t automatically extract all details from your CV. No problem — our team will review it manually.
              </p>
            )}
          </div>
        </div>
        {status === 'no_cv' && (
          <Button variant="default" size="sm" onClick={onEdit}>
            Upload CV
          </Button>
        )}
      </div>
    </div>
  );
}

function getRecommendationStatusBadge(rec: CandidateRecommendation) {
  if (rec.isRejected) {
    return <Badge variant="danger">Rejected</Badge>;
  }
  if (rec.isAdminApproved) {
    return <Badge variant="success">Visible to companies</Badge>;
  }
  if (rec.isApprovedByCandidate) {
    return <Badge variant="info">Pending admin review</Badge>;
  }
  if (rec.isSubmitted) {
    return <Badge variant="warning">Needs your approval</Badge>;
  }
  return <Badge variant="default">Awaiting submission</Badge>;
}

export default function CandidateProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [recommendations, setRecommendations] = useState<CandidateRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedRecId, setExpandedRecId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      const loadData = async () => {
        setIsLoading(true);

        const [profileRes, recsRes] = await Promise.all([
          api.get<CandidateProfile>('/candidates/profile'),
          api.get<CandidateRecommendation[]>('/candidates/me/recommendations'),
        ]);

        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
          setIsVisible(profileRes.data.profileVisible);
        }

        if (recsRes.success && recsRes.data) {
          setRecommendations(recsRes.data);
        }

        setIsLoading(false);
      };

      loadData();
    }
  }, [authLoading, user]);

  const loadRecommendations = async () => {
    const res = await api.get<CandidateRecommendation[]>('/candidates/me/recommendations');
    if (res.success && res.data) {
      setRecommendations(res.data);
    }
  };

  const handleVisibilityChange = async (visible: boolean) => {
    setIsVisible(visible);
    await api.put('/candidates/profile', {
      profileVisible: visible
    });
  };

  const handleEdit = () => {
    window.location.href = '/candidate/profile/edit';
  };

  const handleApproveRecommendation = async (id: string) => {
    setActionLoading(id);
    const res = await api.post(`/candidates/me/recommendations/${id}/approve`);
    if (res.success) {
      await loadRecommendations();
    }
    setActionLoading(null);
  };

  const handleDeleteRecommendation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recommendation?')) return;
    setActionLoading(id);
    const res = await api.delete(`/candidates/me/recommendations/${id}`);
    if (res.success) {
      await loadRecommendations();
    }
    setActionLoading(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Determine profile status
  const profileStatus = getProfileStatus(profile);

  // Derive capabilities from skills (backend provides or we derive)
  const capabilities: Capabilities = profile?.capabilities ||
    (profile?.skills ? deriveCapabilities(profile.skills) : {});

  const hasCapabilities = Object.keys(capabilities).length > 0;
  const seniority = profile?.seniorityEstimate;
  const rolePreferences = profile?.desiredRole;
  const locationText = profile?.locationPreference;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="mb-6">Your profile</h1>

          {/* Profile Status Card */}
          <div className="mb-6">
            <ProfileStatusCard
              status={profileStatus}
              onEdit={handleEdit}
              cvParseStatus={profile?.cvParseStatus}
            />
          </div>

          {/* Visibility Toggle - only show if profile has CV */}
          {profile?.cvFileName && (
            <div className="border border-border rounded-lg p-6 bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="visibility" className="block text-base font-medium text-foreground">
                    Profile visibility
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {isVisible
                      ? 'Companies may discover your profile through curated matching.'
                      : 'Your profile will not be considered for new shortlists.'}
                  </p>
                </div>
                <Switch
                  id="visibility"
                  checked={isVisible}
                  onCheckedChange={handleVisibilityChange}
                />
              </div>
            </div>
          )}

        </div>

        <div className="space-y-8">
          {/* Profile Card */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="mb-1">{profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : 'Your Profile'}</h3>
                {profile?.email && (
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                )}
              </div>
              <Button variant="outline" onClick={handleEdit}>Edit</Button>
            </div>

            <div className="space-y-6">
              {/* Expertise Areas - Editorial display of capabilities */}
              {hasCapabilities && (
                <div>
                  <p className="text-sm font-medium mb-3">Expertise areas</p>
                  <CapabilitiesDisplay capabilities={capabilities} />
                </div>
              )}

              {(() => {
                const level = normalizeSeniority(seniority);
                if (level === null) return null;

                const seniorityConfig: Record<number, { title: string; description: string }> = {
                  0: { title: 'Junior Engineer', description: 'Early career, learning fundamentals and growing technical skills.' },
                  1: { title: 'Mid-level Engineer', description: 'Independent contributor with solid technical foundations.' },
                  2: { title: 'Senior Engineer', description: 'Experienced professional who drives technical decisions and mentors others.' },
                  3: { title: 'Lead Engineer', description: 'Technical leader who guides teams and shapes architecture.' },
                  4: { title: 'Principal Engineer', description: 'Senior technical leader, drives architecture and complex systems.' },
                };
                const config = seniorityConfig[level];
                if (!config) return null;

                return (
                  <div>
                    <p className="text-sm font-medium mb-2">Seniority</p>
                    <p className="text-sm text-foreground">{config.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
                  </div>
                );
              })()}

              {rolePreferences && (
                <div>
                  <p className="text-sm font-medium mb-2">Role preferences</p>
                  <p className="text-sm text-muted-foreground">{rolePreferences}</p>
                </div>
              )}

              {locationText && (
                <div>
                  <p className="text-sm font-medium mb-2">Location</p>
                  <p className="text-sm text-muted-foreground">{locationText}</p>
                </div>
              )}

              {!hasCapabilities && !rolePreferences && !locationText && (
                <p className="text-sm text-muted-foreground italic">
                  Complete your profile to help us match you with the right opportunities.
                </p>
              )}
            </div>
          </div>

          {/* Recommendations Card */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="mb-1">Private recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  Shared only with companies you are introduced to.
                </p>
              </div>
            </div>

            {/* Recommendations list */}
            <div className="space-y-4">
              {recommendations.length > 0 ? (
                recommendations.map((rec) => (
                  <div key={rec.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{rec.recommenderName}</p>
                        <p className="text-xs text-muted-foreground">
                          {rec.relationship}
                          {rec.recommenderCompany && ` at ${rec.recommenderCompany}`}
                        </p>
                      </div>
                      {getRecommendationStatusBadge(rec)}
                    </div>

                    {/* Content for submitted recommendations */}
                    {rec.isSubmitted && rec.content && (
                      <div className="mt-2">
                        <p className={`text-sm text-muted-foreground whitespace-pre-wrap ${expandedRecId !== rec.id ? 'line-clamp-3' : ''}`}>
                          &ldquo;{rec.content}&rdquo;
                        </p>
                        {rec.content.length > 150 && (
                          <button
                            onClick={() => setExpandedRecId(expandedRecId === rec.id ? null : rec.id)}
                            className="text-primary text-sm mt-1 hover:underline"
                          >
                            {expandedRecId === rec.id ? 'Show less' : 'Read full recommendation'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Rejection reason */}
                    {rec.isRejected && rec.rejectionReason && (
                      <p className="text-sm text-red-600 mt-2">
                        Reason: {rec.rejectionReason}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      {/* Show approve button only if submitted but not yet approved */}
                      {rec.isSubmitted && !rec.isApprovedByCandidate && !rec.isRejected && (
                        <Button
                          size="sm"
                          onClick={() => handleApproveRecommendation(rec.id)}
                          disabled={actionLoading === rec.id}
                        >
                          {actionLoading === rec.id ? 'Approving...' : 'Approve'}
                        </Button>
                      )}

                      {/* Delete button (always available unless admin approved) */}
                      {!rec.isAdminApproved && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRecommendation(rec.id)}
                          disabled={actionLoading === rec.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Recommendations are optional. If you&apos;d like, ask someone from your professional network.
                </p>
              )}

              {/* Request button */}
              {recommendations.length < 3 && (
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => setShowRequestModal(true)}
                >
                  Request recommendation
                </Button>
              )}
              {recommendations.length > 0 && recommendations.length < 3 && (
                <p className="text-xs text-muted-foreground text-center">
                  Up to 3 private recommendations
                </p>
              )}
            </div>
          </div>

          {/* How matching works */}
          <div className="border border-border rounded-lg p-6 bg-muted">
            <h4 className="mb-2">How matching works</h4>
            <p className="text-sm text-muted-foreground">
              Companies request shortlists for specific roles. We review candidates manually and introduce you only if there&apos;s a strong match. You&apos;ll never see job posts or need to apply.
            </p>
          </div>
        </div>
      </div>

      {/* Request Recommendation Modal */}
      <RequestRecommendationModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={() => loadRecommendations()}
        currentCount={recommendations.length}
      />
    </div>
  );
}
