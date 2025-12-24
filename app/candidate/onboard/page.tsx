'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LocationInput from '@/components/ui/LocationInput';
import api from '@/lib/api';
import { RemotePreference, Availability, Location } from '@/types';

export default function CandidateOnboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [desiredRole, setDesiredRole] = useState('');
  const [location, setLocation] = useState<Location>({});
  const [remotePreference, setRemotePreference] = useState<RemotePreference>(RemotePreference.Flexible);
  const [availability, setAvailability] = useState<Availability>(Availability.Open);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setCvFile(file);
      setError('');
    }
  };

  const uploadCv = async () => {
    if (!cvFile) return;

    setIsLoading(true);
    setError('');

    try {
      // Upload file directly to API (which uploads to S3)
      const formData = new FormData();
      formData.append('file', cvFile);

      const uploadRes = await api.uploadFile<{ fileKey: string }>(
        '/candidates/cv/upload',
        formData
      );

      if (!uploadRes.success) {
        throw new Error(uploadRes.error || 'Failed to upload CV');
      }

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CV');
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    setIsLoading(true);
    setError('');

    // Build location display text for legacy compatibility
    const locationDisplayText = [
      location.city,
      location.country,
    ].filter(Boolean).join(', ') || null;

    try {
      const res = await api.post('/candidates/onboard', {
        linkedInUrl: linkedInUrl || null,
        desiredRole: desiredRole || null,
        location: Object.keys(location).length > 0 ? location : null,
        locationPreference: locationDisplayText, // Keep legacy field populated
        remotePreference,
        availability
      });

      if (!res.success) {
        throw new Error(res.error || 'Failed to save preferences');
      }

      router.push('/candidate/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageWrapper>
      <Header />

      <PageContainer variant="narrow" verticalPadding="lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Profile</h1>
          <p className="text-gray-600 mt-2">Help us match you with the right opportunities</p>

          {/* Progress */}
          <div className="flex justify-center gap-2 mt-6">
            <div className={`w-16 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`w-16 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Your CV</h2>
            <p className="text-gray-600 mb-6">
              We&apos;ll automatically extract your skills and experience to help companies find you.
            </p>

            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                cvFile ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
              {cvFile ? (
                <>
                  <svg className="w-12 h-12 mx-auto text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 font-medium text-gray-900">{cvFile.name}</p>
                  <p className="text-sm text-gray-500">Click to change file</p>
                </>
              ) : (
                <>
                  <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mt-2 font-medium text-gray-900">Drop your CV here or click to browse</p>
                  <p className="text-sm text-gray-500">PDF or Word documents, max 10MB</p>
                </>
              )}
            </div>

            <div className="mt-6 flex gap-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Skip for now
              </Button>
              <Button className="flex-1" onClick={uploadCv} isLoading={isLoading} disabled={!cvFile}>
                Upload & Continue
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Preferences</h2>
            <p className="text-gray-600 mb-6">
              Tell us what you&apos;re looking for so we can match you better.
            </p>

            <div className="space-y-6">
              <Input
                label="LinkedIn Profile (optional)"
                id="linkedIn"
                type="url"
                value={linkedInUrl}
                onChange={(e) => setLinkedInUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
              />

              <Input
                label="What kind of role are you looking for?"
                id="desiredRole"
                type="text"
                value={desiredRole}
                onChange={(e) => setDesiredRole(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer, Product Designer"
              />

              <LocationInput
                label="Current Location (Optional)"
                value={location}
                onChange={setLocation}
                showRelocation={true}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Remote preference</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: RemotePreference.Remote, label: 'Remote only' },
                    { value: RemotePreference.Hybrid, label: 'Hybrid' },
                    { value: RemotePreference.Onsite, label: 'On-site only' },
                    { value: RemotePreference.Flexible, label: 'Flexible' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRemotePreference(option.value)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
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
                    { value: Availability.Open, label: 'Actively looking', description: 'Ready to start interviews' },
                    { value: Availability.Passive, label: 'Open to opportunities', description: 'Not actively searching but interested in hearing about roles' },
                    { value: Availability.NotNow, label: 'Not looking right now', description: 'I just want to set up my profile' }
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
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button className="w-full" onClick={savePreferences} isLoading={isLoading}>
                Complete Setup
              </Button>
            </div>
          </Card>
        )}
      </PageContainer>
    </PageWrapper>
  );
}
