'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LocationInput from '@/components/ui/LocationInput';
import api from '@/lib/api';
import { CompanyProfile, Location } from '@/types';

export default function CompanySettingsPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState<Location>({});

  useEffect(() => {
    if (!authLoading && user) {
      loadProfile();
    }
  }, [authLoading, user]);

  const loadProfile = async () => {
    setIsLoading(true);
    const res = await api.get<CompanyProfile>('/companies/profile');
    if (res.success && res.data) {
      setProfile(res.data);
      setCompanyName(res.data.companyName || '');
      setIndustry(res.data.industry || '');
      setCompanySize(res.data.companySize || '');
      setWebsite(res.data.website || '');
      if (res.data.location) {
        setLocation(res.data.location);
      }
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    const res = await api.put('/companies/profile', {
      companyName: companyName || null,
      industry: industry || null,
      companySize: companySize || null,
      website: website || null,
      location: Object.keys(location).length > 0 ? location : null,
    });

    if (res.success) {
      setSuccess('Settings updated successfully');
      loadProfile();
    } else {
      setError(res.error || 'Failed to update settings');
    }
    setIsSaving(false);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Company Settings</h1>

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

        {/* Company Information */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>

          <div className="space-y-4">
            <Input
              label="Company Name"
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
            />

            <Input
              label="Industry"
              id="industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Technology, Healthcare, Finance"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Size
              </label>
              <select
                value={companySize}
                onChange={(e) => setCompanySize(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select size...</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="501-1000">501-1000 employees</option>
                <option value="1000+">1000+ employees</option>
              </select>
            </div>

            <Input
              label="Website"
              id="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </Card>

        {/* Company Location */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Location</h2>
          <p className="text-sm text-gray-500 mb-4">
            Your company headquarters or main office location. This helps candidates understand where you&apos;re based.
          </p>

          <LocationInput
            label=""
            value={location}
            onChange={setLocation}
            showRelocation={false}
          />
        </Card>

        {/* Subscription Info */}
        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900">
                Current Plan: <span className="font-medium">
                  {profile?.subscriptionTier === 0 ? 'Free' :
                   profile?.subscriptionTier === 1 ? 'Starter' :
                   profile?.subscriptionTier === 2 ? 'Pro' : 'Unknown'}
                </span>
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Messages remaining: {profile?.messagesRemaining || 0}
              </p>
            </div>
            <Button variant="outline">Upgrade Plan</Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Something doesn&apos;t look right?{' '}
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
