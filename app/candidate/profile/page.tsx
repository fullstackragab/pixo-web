'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LocationInput from '@/components/ui/LocationInput';
import api from '@/lib/api';
import { CandidateProfile, RemotePreference, Availability, Location } from '@/types';

export default function CandidateProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [desiredRole, setDesiredRole] = useState('');
  const [location, setLocation] = useState<Location>({});
  const [remotePreference, setRemotePreference] = useState<RemotePreference>(RemotePreference.Flexible);
  const [availability, setAvailability] = useState<Availability>(Availability.Open);
  const [profileVisible, setProfileVisible] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      loadProfile();
    }
  }, [authLoading, user]);

  const loadProfile = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    const res = await api.get<CandidateProfile>('/candidates/profile');
    if (res.success && res.data) {
      setProfile(res.data);
      setFirstName(res.data.firstName || '');
      setLastName(res.data.lastName || '');
      setLinkedInUrl(res.data.linkedInUrl || '');
      setDesiredRole(res.data.desiredRole || '');
      // Load structured location, or fallback to legacy field
      if (res.data.location) {
        setLocation(res.data.location);
      } else if (res.data.locationPreference) {
        // Legacy fallback: parse as city string
        setLocation({ city: res.data.locationPreference });
      }
      setRemotePreference(res.data.remotePreference ?? RemotePreference.Flexible);
      setAvailability(res.data.availability);
      setProfileVisible(res.data.profileVisible);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    // Build location display text for legacy compatibility
    const locationDisplayText = [
      location.city,
      location.country,
    ].filter(Boolean).join(', ') || null;

    const res = await api.put('/candidates/profile', {
      firstName: firstName || null,
      lastName: lastName || null,
      linkedInUrl: linkedInUrl || null,
      desiredRole: desiredRole || null,
      location: Object.keys(location).length > 0 ? location : null,
      locationPreference: locationDisplayText, // Keep legacy field populated
      remotePreference,
      availability,
      profileVisible
    });

    if (res.success) {
      setSuccess('Profile updated successfully');
      loadProfile(false);
    } else {
      setError(res.error || 'Failed to update profile');
    }
    setIsSaving(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Get presigned upload URL
      const uploadRes = await api.get<{ uploadUrl: string; fileKey: string }>(
        `/candidates/cv/upload-url?fileName=${encodeURIComponent(file.name)}`
      );

      if (!uploadRes.success || !uploadRes.data) {
        throw new Error(uploadRes.error || 'Failed to get upload URL');
      }

      // Upload file directly to S3
      const uploadResponse = await fetch(uploadRes.data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Notify backend to process the CV
      const processRes = await api.post('/candidates/cv/process', {
        fileKey: uploadRes.data.fileKey,
        originalFileName: file.name
      });

      if (!processRes.success) {
        throw new Error(processRes.error || 'Failed to process CV');
      }

      setSuccess('CV uploaded successfully! Skills will be extracted shortly.');
      loadProfile(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CV');
    } finally {
      setIsUploading(false);
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

      <PageContainer variant="default">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8">Edit Profile</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* CV Upload */}
        <Card className="mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Resume / CV</h2>

          {isUploading ? (
            <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center bg-blue-50">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="font-medium text-blue-700">Uploading CV...</p>
                <p className="text-sm text-blue-600 mt-1">Please wait while we process your file</p>
              </div>
            </div>
          ) : profile?.cvFileName ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">{profile.cvFileName}</p>
                  <p className="text-sm text-gray-500">Click to replace</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} isLoading={isUploading}>
                Replace
              </Button>
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mt-2 font-medium text-gray-900">Upload your CV</p>
              <p className="text-sm text-gray-500">PDF or Word, max 10MB</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
        </Card>

        {/* Skills */}
        {profile?.skills && profile.skills.length > 0 && (
          <Card className="mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <Badge key={skill.id} variant={skill.isVerified ? 'success' : 'primary'}>
                  {skill.skillName}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3">Skills are automatically extracted from your CV</p>
          </Card>
        )}

        {/* Basic Info */}
        <Card className="mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="John"
            />
            <Input
              label="Last Name"
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
            />
          </div>

          <div className="mt-4">
            <Input
              label="LinkedIn Profile"
              id="linkedIn"
              type="url"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
        </Card>

        {/* Preferences */}
        <Card className="mb-4 sm:mb-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Job Preferences</h2>

          <div className="space-y-4">
            <Input
              label="Desired Role"
              id="desiredRole"
              type="text"
              value={desiredRole}
              onChange={(e) => setDesiredRole(e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
            />

            <LocationInput
              label="Current Location (Optional)"
              value={location}
              onChange={setLocation}
              showRelocation={true}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Remote Preference</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: RemotePreference.Remote, label: 'Remote only' },
                  { value: RemotePreference.Hybrid, label: 'Hybrid' },
                  { value: RemotePreference.Onsite, label: 'On-site' },
                  { value: RemotePreference.Flexible, label: 'Flexible' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRemotePreference(option.value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      remotePreference === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
              <div className="space-y-2">
                {[
                  { value: Availability.Open, label: 'Actively looking', desc: 'Ready to start interviews' },
                  { value: Availability.Passive, label: 'Open to opportunities', desc: 'Not actively searching' },
                  { value: Availability.NotNow, label: 'Not looking', desc: 'Just maintaining my profile' }
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setAvailability(option.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      availability === option.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Recommendations Info */}
        <Card className="mb-4 sm:mb-6 bg-purple-50 border-purple-100">
          <div className="flex items-start gap-3">
            <div className="shrink-0 p-2 bg-purple-100 rounded-lg">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-purple-900">Recommendations</h3>
              <p className="text-sm text-purple-700 mt-1">
                Recommendations are optional and added automatically.
              </p>
              {profile?.recommendationsCount && profile.recommendationsCount > 0 && (
                <p className="text-sm text-purple-600 mt-2">
                  You have {profile.recommendationsCount} recommendation{profile.recommendationsCount !== 1 ? 's' : ''}.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Visibility */}
        <Card className="mb-4 sm:mb-6">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Profile Visibility</h2>
              <p className="text-sm text-gray-500">When visible, companies can find and contact you</p>
            </div>
            <button
              type="button"
              onClick={() => setProfileVisible(!profileVisible)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                profileVisible ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  profileVisible ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Questions or issues?{' '}
            <Link href="/support" className="text-blue-600 hover:text-blue-700">
              Contact support
            </Link>
          </p>
        </Card>

        <Button className="w-full" onClick={handleSave} isLoading={isSaving}>
          Save Changes
        </Button>
      </PageContainer>
    </PageWrapper>
  );
}
