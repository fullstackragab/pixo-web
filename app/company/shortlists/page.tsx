'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import HiringLocationInput from '@/components/ui/HiringLocationInput';
import api from '@/lib/api';
import { SeniorityLevel, HiringLocation, ShortlistPricingType } from '@/types';
import Breadcrumb, { companyBreadcrumbs } from '@/components/ui/Breadcrumb';

// Normalize status from backend (could be number or string)
const normalizeStatus = (status: string | number): string => {
  if (typeof status === 'number') {
    const statusMap: Record<number, string> = {
      0: 'draft',
      1: 'matching',
      2: 'readyForPricing',
      3: 'pricingRequested',
      4: 'pricingApproved',
      5: 'delivered',
      6: 'paymentCaptured',
      7: 'cancelled'
    };
    return statusMap[status] || 'draft';
  }
  // Map old status values to new ones for backwards compatibility
  const s = status.toLowerCase();
  if (s === 'pending') return 'draft';
  if (s === 'processing') return 'matching';
  if (s === 'completed') return 'delivered';
  return s;
};

interface ShortlistRequest {
  id: string;
  roleTitle: string;
  techStackRequired: string[];
  seniorityRequired: SeniorityLevel | null;
  status: string | number;
  candidatesCount: number;
  createdAt: string;
  // Versioning fields
  previousRequestId?: string | null;
  pricingType?: ShortlistPricingType;
  followUpDiscount?: number;
  isFollowUp?: boolean;
  newCandidatesCount?: number;
  repeatedCandidatesCount?: number;
}

function CompanyShortlistsContent() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [shortlists, setShortlists] = useState<ShortlistRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [roleTitle, setRoleTitle] = useState('');
  const [techStack, setTechStack] = useState('');
  const [seniority, setSeniority] = useState('');
  const [hiringLocation, setHiringLocation] = useState<HiringLocation>({ isRemote: true });
  const [notes, setNotes] = useState('');
  const [previousRequestId, setPreviousRequestId] = useState<string | null>(null);

  // Handle pre-fill from "Request More Candidates" button
  useEffect(() => {
    const isRequestMore = searchParams.get('requestMore') === 'true';
    const prevId = searchParams.get('previousRequestId');

    if (isRequestMore && prevId) {
      setPreviousRequestId(prevId);
      setRoleTitle(searchParams.get('roleTitle') || '');
      setTechStack(searchParams.get('techStack') || '');
      setSeniority(searchParams.get('seniority') || '');
      const location = searchParams.get('location');
      const remoteAllowed = searchParams.get('remoteAllowed') === 'true';
      setHiringLocation({
        isRemote: remoteAllowed,
        country: location || undefined,
      });
      setShowForm(true);
    }
  }, [searchParams]);

  const loadShortlists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<ShortlistRequest[]>('/shortlists');
      if (res.success && res.data) {
        setShortlists(res.data);
      } else {
        setError(res.error || 'Failed to load shortlists');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadShortlists();
    }
  }, [authLoading, user, loadShortlists]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    // Parse tech stack into array, ensure it's not empty
    const techStackArray = techStack
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // Build location display text for legacy compatibility
    const locationDisplayText = [
      hiringLocation.city,
      hiringLocation.country,
    ].filter(Boolean).join(', ') || null;

    try {
      const res = await api.post<{ id: string }>('/shortlists/request', {
        roleTitle,
        techStackRequired: techStackArray.length > 0 ? techStackArray : [],
        seniorityRequired: seniority ? parseInt(seniority) : null,
        hiringLocation,
        locationPreference: locationDisplayText, // Keep legacy field populated
        remoteAllowed: hiringLocation.isRemote, // Keep legacy field populated
        additionalNotes: notes || null,
        previousRequestId: previousRequestId || undefined, // Link to previous shortlist for follow-ups
      });

      if (res.success) {
        setShowForm(false);
        setRoleTitle('');
        setTechStack('');
        setSeniority('');
        setHiringLocation({ isRemote: true });
        setNotes('');
        setPreviousRequestId(null);
        // Clear URL params
        window.history.replaceState({}, '', '/company/shortlists');
        loadShortlists();
      } else {
        // Handle both 'error' and 'message' fields from API
        const errorMsg = res.error || (res as unknown as { message?: string }).message || 'Failed to submit shortlist request';
        setFormError(errorMsg);
      }
    } catch {
      setFormError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string | number) => {
    const normalized = normalizeStatus(status);
    switch (normalized) {
      case 'draft':
        return <Badge variant="default">Draft</Badge>;
      case 'matching':
        return <Badge variant="primary">Matching</Badge>;
      case 'readyforpricing':
        return <Badge variant="warning">Ready for Pricing</Badge>;
      case 'pricingrequested':
        return <Badge variant="warning">Action Required</Badge>;
      case 'pricingapproved':
        return <Badge variant="primary">Being Curated</Badge>;
      case 'delivered':
        return <Badge variant="success">Delivered</Badge>;
      case 'paymentcaptured':
        return <Badge variant="success">Complete</Badge>;
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="default">{normalized}</Badge>;
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
        <Breadcrumb items={companyBreadcrumbs.shortlists()} />

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
            <h1 className="text-2xl font-bold text-gray-900">Shortlists</h1>
            <p className="text-gray-500 mt-1">Get curated candidate shortlists for your roles</p>
          </div>
          <Button onClick={() => { setShowForm(!showForm); setFormError(null); }}>
            {showForm ? 'Cancel' : 'Request Shortlist'}
          </Button>
        </div>

        {/* Request Form */}
        {showForm && (
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {previousRequestId ? 'Request More Candidates' : 'Request a Shortlist'}
            </h2>
            {previousRequestId && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                <span className="font-medium">Follow-up request:</span> This will be linked to your previous shortlist.
                Previous candidates will be excluded by default, and you may qualify for a discount.
              </div>
            )}
            {formError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Role Title"
                id="roleTitle"
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Backend Engineer"
                required
              />

              <Input
                label="Required Tech Stack"
                id="techStack"
                type="text"
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="Python, Django, PostgreSQL (comma separated)"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seniority Level</label>
                <select
                  value={seniority}
                  onChange={(e) => setSeniority(e.target.value)}
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

              <HiringLocationInput
                label="Hiring Location"
                value={hiringLocation}
                onChange={setHiringLocation}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any other requirements or preferences..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Payment UX Copy - required per payment contract */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                We only charge if we successfully deliver a shortlist.
              </div>

              {/* Curated shortlist info */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-sm font-medium text-gray-900">Curated shortlists are intentionally small</p>
                <p className="text-sm text-gray-600 mt-1">
                  We deliver the strongest matches for your role — usually around 5 candidates.
                  In some cases, fewer candidates means a better outcome.
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" isLoading={isSubmitting}>Submit Request</Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowForm(false);
                  setPreviousRequestId(null);
                  window.history.replaceState({}, '', '/company/shortlists');
                }}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}

        {/* Shortlists List */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Shortlists</h2>

          {shortlists.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tech Stack</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidates</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">New / Repeated</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {shortlists.map((shortlist) => (
                    <tr
                      key={shortlist.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/company/shortlists/${shortlist.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{shortlist.roleTitle}</span>
                          {shortlist.isFollowUp && (
                            <Badge variant="primary">
                              Follow-up {shortlist.followUpDiscount ? `(${shortlist.followUpDiscount}% off)` : ''}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {shortlist.techStackRequired?.slice(0, 3).map((tech, i) => (
                            <Badge key={i} variant="default">{tech}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(shortlist.status)}</td>
                      <td className="px-4 py-3 text-gray-600">{shortlist.candidatesCount}</td>
                      <td className="px-4 py-3 text-sm">
                        {shortlist.newCandidatesCount !== undefined && shortlist.repeatedCandidatesCount !== undefined ? (
                          <span>
                            <span className="text-green-600 font-medium">{shortlist.newCandidatesCount}</span>
                            {' / '}
                            <span className="text-yellow-600">{shortlist.repeatedCandidatesCount}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {new Date(shortlist.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No shortlists yet</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>Request Your First Shortlist</Button>
            </div>
          )}
        </Card>

        {/* Pricing Info */}
        <Card className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How Pricing Works</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2 bg-blue-100 rounded-lg">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Outcome-Based Pricing</p>
                <p className="text-sm text-gray-600 mt-1">
                  You only pay after we successfully deliver a shortlist. If we can&apos;t find suitable candidates, you won&apos;t be charged.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2 bg-green-100 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Review Before You Pay</p>
                <p className="text-sm text-gray-600 mt-1">
                  When your shortlist is ready, you&apos;ll review the pricing and approve it before delivery. No surprise charges.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="shrink-0 p-2 bg-purple-100 rounded-lg">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Follow-up Discounts</p>
                <p className="text-sm text-gray-600 mt-1">
                  Need more candidates for the same role? Follow-up requests qualify for reduced pricing.
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-6 pt-4 border-t border-gray-100">
            Questions about pricing?{' '}
            <Link href="/support" className="text-blue-600 hover:text-blue-700">
              Contact support
            </Link>
          </p>
        </Card>
      </PageContainer>
    </PageWrapper>
  );
}

export default function CompanyShortlistsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CompanyShortlistsContent />
    </Suspense>
  );
}
