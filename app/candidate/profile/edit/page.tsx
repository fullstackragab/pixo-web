'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import api from '@/lib/api';
import { CandidateProfile, Availability, SeniorityLevel } from '@/types';

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground mb-1">
      {children}
    </label>
  );
}

function Input({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 bg-input-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
    />
  );
}

function Textarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  className = '',
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3 py-2 bg-input-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
    />
  );
}

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'default',
  disabled = false,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
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
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// Normalize seniority value from API (can be number, string, or null)
const normalizeSeniority = (value: SeniorityLevel | number | string | null | undefined): SeniorityLevel | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value as SeniorityLevel;
  if (typeof value === 'string') {
    const map: Record<string, SeniorityLevel> = {
      junior: SeniorityLevel.Junior,
      mid: SeniorityLevel.Mid,
      senior: SeniorityLevel.Senior,
      lead: SeniorityLevel.Lead,
      principal: SeniorityLevel.Principal,
    };
    return map[value.toLowerCase()] ?? null;
  }
  return null;
};

export default function CandidateProfileEditPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [gitHubUrl, setGithubUrl] = useState('');
  const [desiredRole, setDesiredRole] = useState('');
  const [locationPreference, setLocationPreference] = useState('');
  const [availability, setAvailability] = useState<Availability>(Availability.Open);
  const [seniority, setSeniority] = useState<SeniorityLevel | null>(null);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [newCvFile, setNewCvFile] = useState<File | null>(null);
  const [gitHubSummary, setGitHubSummary] = useState('');
  const [hasGitHubSummary, setHasGitHubSummary] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      const loadProfile = async () => {
        setIsLoading(true);
        const res = await api.get<CandidateProfile>('/candidates/profile');
        if (res.success && res.data) {
          const profile = res.data;
          setFirstName(profile.firstName || '');
          setLastName(profile.lastName || '');
          setLinkedInUrl(profile.linkedInUrl || '');
          setGithubUrl(profile.gitHubUrl || '');
          setDesiredRole(profile.desiredRole || '');
          setLocationPreference(profile.locationPreference || '');
          setAvailability(profile.availability);
          setSeniority(normalizeSeniority(profile.seniorityEstimate));
          setCvFileName(profile.cvFileName || null);
          setGitHubSummary(profile.gitHubSummary || '');
          setHasGitHubSummary(!!profile.gitHubSummaryGeneratedAt);
        }
        setIsLoading(false);
      };
      loadProfile();
    }
  }, [authLoading, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewCvFile(e.target.files[0]);
    }
  };

  const handleUploadCv = async () => {
    if (!newCvFile) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', newCvFile);

    const res = await api.uploadFile('/candidates/cv/upload', formData);

    if (res.success) {
      setSuccess('CV uploaded successfully');
      setCvFileName(newCvFile.name);
      setNewCvFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      setError(res.error || 'Failed to upload CV');
    }

    setIsUploading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    const res = await api.put('/candidates/profile', {
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      linkedInUrl: linkedInUrl.trim() || null,
      gitHubUrl: gitHubUrl.trim() || null,
      desiredRole: desiredRole.trim() || null,
      locationPreference: locationPreference.trim() || null,
      availability,
      seniorityEstimate: seniority,
      gitHubSummary: hasGitHubSummary ? gitHubSummary.trim() || null : undefined,
    });

    if (res.success) {
      setSuccess('Profile saved successfully');
      setTimeout(() => {
        router.push('/candidate/profile');
      }, 1000);
    } else {
      setError(res.error || 'Failed to save profile');
    }

    setIsSaving(false);
  };

  const handleCancel = () => {
    router.push('/candidate/profile');
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Edit Profile</h1>
          <p className="text-muted-foreground">
            Update your profile information to help companies find you.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        <div className="space-y-8">
          {/* Personal Information */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Personal Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="linkedIn">LinkedIn Profile</Label>
                <span className="text-xs text-muted-foreground">(optional)</span>
              </div>
              <Input
                id="linkedIn"
                type="url"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>

            <div className="mt-4">
              <div className="flex items-center gap-2 mb-1">
                <Label htmlFor="github">GitHub Profile</Label>
                <span className="text-xs text-muted-foreground">(optional)</span>
              </div>
              <Input
                id="github"
                type="url"
                value={gitHubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourusername"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Public repositories can help highlight hands-on experience for technical roles.
              </p>
            </div>

            {/* Public work summary - only show if one has been generated */}
            {hasGitHubSummary && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="gitHubSummary">Public work summary <span className="font-normal text-muted-foreground">(based on project documentation)</span></Label>
                </div>
                <Textarea
                  id="gitHubSummary"
                  value={gitHubSummary}
                  onChange={(e) => setGitHubSummary(e.target.value)}
                  placeholder="Summary of your public work..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This summary is based on publicly available project descriptions. You can edit it.
                </p>
              </div>
            )}
          </div>

          {/* CV Upload */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">CV / Resume</h2>
              <span className="text-xs text-red-500 font-medium">Required</span>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Your CV is used to understand your experience and match you accurately.
              It&apos;s reviewed by our team before your profile becomes visible.
            </p>

            {cvFileName ? (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-foreground font-medium">{cvFileName}</span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Current CV</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm"
                  >
                    Replace CV
                  </Button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to remove your CV? Your profile will no longer be visible to companies.')) {
                        setCvFileName(null);
                        api.delete('/candidates/cv');
                      }
                    }}
                    className="text-sm text-red-600 hover:text-red-700 px-3 py-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  No CV uploaded. Your profile won&apos;t be visible to companies until you upload a CV.
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />

            {!cvFileName && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  newCvFile
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/30 hover:bg-muted/50'
                }`}
              >
                {newCvFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-foreground font-medium">{newCvFile.name}</span>
                  </div>
                ) : (
                  <>
                    <svg
                      className="w-8 h-8 mx-auto mb-2 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="text-sm text-foreground mb-1">Click to upload your CV</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX</p>
                  </>
                )}
              </div>
            )}

            {newCvFile && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-foreground">{newCvFile.name}</span>
                </div>
                <Button
                  onClick={handleUploadCv}
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            )}
          </div>

          {/* Role Preferences */}
          <div className="border border-border rounded-lg p-6 bg-card">
            <h2 className="text-lg font-semibold text-foreground mb-4">Role Preferences</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="desiredRole">Desired Role</Label>
                <Textarea
                  id="desiredRole"
                  value={desiredRole}
                  onChange={(e) => setDesiredRole(e.target.value)}
                  placeholder="e.g., Senior frontend role focused on product development, ideally with React. Open to team lead positions."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="location">Location Preference</Label>
                <Input
                  id="location"
                  value={locationPreference}
                  onChange={(e) => setLocationPreference(e.target.value)}
                  placeholder="e.g., Remote, EU timezone preferred"
                />
              </div>

              <div>
                <Label htmlFor="availability">Availability</Label>
                <select
                  id="availability"
                  value={availability}
                  onChange={(e) => setAvailability(Number(e.target.value) as Availability)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value={Availability.Open}>Actively Looking</option>
                  <option value={Availability.Passive}>Open to Opportunities</option>
                  <option value={Availability.NotNow}>Not Looking Right Now</option>
                </select>
              </div>

              <div>
                <Label htmlFor="seniority">Seniority Level</Label>
                <select
                  id="seniority"
                  value={seniority ?? ''}
                  onChange={(e) => setSeniority(e.target.value === '' ? null : Number(e.target.value) as SeniorityLevel)}
                  className="w-full px-3 py-2 bg-input-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Select level...</option>
                  <option value={SeniorityLevel.Junior}>Junior</option>
                  <option value={SeniorityLevel.Mid}>Mid-level</option>
                  <option value={SeniorityLevel.Senior}>Senior</option>
                  <option value={SeniorityLevel.Lead}>Lead / Staff</option>
                  <option value={SeniorityLevel.Principal}>Principal</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Used for matching only. Not shown publicly.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Changes may take up to 24 hours to reflect after review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
