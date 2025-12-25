'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

interface CompanyDetail {
  id: string;
  userId: string;
  companyName: string;
  email: string;
  industry: string | null;
  companySize: string | null;
  website: string | null;
  location: string | null;
  description: string | null;
  subscriptionTier: string | number;
  subscriptionExpiresAt: string | null;
  shortlistsCount: number;
  savedCandidatesCount: number;
  createdAt: string;
  lastActiveAt: string;
}

// Normalize subscription tier to lowercase string
const normalizeSubscriptionTier = (tier: string | number): string => {
  if (typeof tier === 'number') {
    const tierMap: Record<number, string> = {
      0: 'free',
      1: 'starter',
      2: 'pro'
    };
    return tierMap[tier] || 'free';
  }
  return tier.toLowerCase();
};

export default function AdminCompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<CompanyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<CompanyDetail>(`/admin/companies/${companyId}`);
      if (res.success && res.data) {
        setCompany(res.data);
      } else {
        setError(res.error || 'Company not found');
      }
    } catch (err) {
      setError('Failed to load company');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionBadge = (tier: string | number) => {
    const normalizedTier = normalizeSubscriptionTier(tier);
    switch (normalizedTier) {
      case 'free':
        return <Badge variant="default">Free</Badge>;
      case 'starter':
        return <Badge variant="primary">Starter</Badge>;
      case 'pro':
        return <Badge variant="success">Pro</Badge>;
      default:
        return <Badge variant="default">{normalizedTier}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div>
        <Link href="/admin/companies" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
          &larr; Back to Companies
        </Link>
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">{error || 'Company not found'}</p>
            <Button onClick={() => router.push('/admin/companies')} className="mt-4">
              Go Back
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link href="/admin/companies" className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block">
        &larr; Back to Companies
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company.companyName}</h1>
          <p className="text-gray-500 mt-1">{company.email}</p>
        </div>
        {getSubscriptionBadge(company.subscriptionTier)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Industry</dt>
              <dd className="text-gray-900">{company.industry || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Company Size</dt>
              <dd className="text-gray-900">{company.companySize || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Location</dt>
              <dd className="text-gray-900">{company.location || '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Website</dt>
              <dd className="text-gray-900">
                {company.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {company.website}
                  </a>
                ) : '-'}
              </dd>
            </div>
            {company.description && (
              <div>
                <dt className="text-gray-500 mb-1">Description</dt>
                <dd className="text-gray-900 text-sm">{company.description}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Subscription & Activity */}
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Subscription & Activity</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">Subscription Tier</dt>
              <dd>{getSubscriptionBadge(company.subscriptionTier)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Expires</dt>
              <dd className="text-gray-900">
                {company.subscriptionExpiresAt
                  ? new Date(company.subscriptionExpiresAt).toLocaleDateString()
                  : '-'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Shortlists</dt>
              <dd className="text-gray-900 font-medium">{company.shortlistsCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Saved Candidates</dt>
              <dd className="text-gray-900 font-medium">{company.savedCandidatesCount}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Joined</dt>
              <dd className="text-gray-900">
                {new Date(company.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Last Active</dt>
              <dd className="text-gray-900">
                {new Date(company.lastActiveAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
