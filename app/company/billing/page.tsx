'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Breadcrumb, { companyBreadcrumbs } from '@/components/ui/Breadcrumb';
import api from '@/lib/api';
import { ShortlistOutcome, PaymentPricingType } from '@/types';

// Normalize status from backend (could be number or string)
const normalizeStatus = (status: string | number): string => {
  if (typeof status === 'number') {
    const statusMap: Record<number, string> = {
      0: 'pending',
      1: 'processing',
      2: 'completed',
      3: 'cancelled'
    };
    return statusMap[status] || 'pending';
  }
  return status.toLowerCase();
};

interface BillingHistoryItem {
  id: string;
  roleTitle: string;
  status: string | number;
  createdAt: string;
  completedAt?: string;
  // Payment outcome fields (backend-driven)
  shortlistOutcome?: ShortlistOutcome;
  paymentPricingType?: PaymentPricingType;
  finalPrice?: number;
}

function getStatusLabel(status: string | number, outcome?: ShortlistOutcome): string {
  const normalized = normalizeStatus(status);
  if (normalized === 'completed') {
    switch (outcome) {
      case 'fulfilled':
        return 'Delivered';
      case 'partial':
        return 'Partial Match';
      case 'no_match':
        return 'No Match';
      default:
        return 'Delivered';
    }
  }
  switch (normalized) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'cancelled':
      return 'Cancelled';
    default:
      return normalized;
  }
}

function getStatusBadgeVariant(status: string | number, outcome?: ShortlistOutcome): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  const normalized = normalizeStatus(status);
  if (normalized === 'completed') {
    switch (outcome) {
      case 'fulfilled':
        return 'success';
      case 'partial':
        return 'warning';
      case 'no_match':
        return 'default';
      default:
        return 'success';
    }
  }
  switch (normalized) {
    case 'pending':
      return 'warning';
    case 'processing':
      return 'primary';
    case 'cancelled':
      return 'danger';
    default:
      return 'default';
  }
}

function getPricingTypeLabel(pricingType?: PaymentPricingType): string {
  switch (pricingType) {
    case 'full':
      return 'Full';
    case 'partial':
      return 'Partial';
    case 'free':
      return 'Free';
    default:
      return '-';
  }
}

function formatPrice(price?: number): string {
  if (price === undefined || price === null) return '-';
  if (price === 0) return '$0';
  return `$${price.toFixed(0)}`;
}

export default function CompanyBillingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [history, setHistory] = useState<BillingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBillingHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch shortlists and map to billing history
      // In production, this would be a dedicated billing endpoint
      const res = await api.get<BillingHistoryItem[]>('/shortlists');
      if (res.success && res.data) {
        // Apply safe defaults for missing payment fields
        const historyWithDefaults = res.data.map((item) => ({
          ...item,
          paymentPricingType: item.paymentPricingType || 'free' as PaymentPricingType,
          finalPrice: item.finalPrice ?? 0,
        }));
        setHistory(historyWithDefaults);
      }
    } catch {
      // Silent fail - show empty state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadBillingHistory();
    }
  }, [authLoading, user, loadBillingHistory]);

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
        <Breadcrumb items={companyBreadcrumbs.billing()} />

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Billing History</h1>
          <p className="text-gray-500 mt-1">View your shortlist requests and payment status</p>
        </div>

        <Card>
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pricing Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">{item.roleTitle}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(item.status, item.shortlistOutcome)}>
                          {getStatusLabel(item.status, item.shortlistOutcome)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {getPricingTypeLabel(item.paymentPricingType)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={item.finalPrice && item.finalPrice > 0 ? 'font-medium text-gray-900' : 'text-gray-500'}>
                          {formatPrice(item.finalPrice)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {new Date(item.completedAt || item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/company/shortlists/${item.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No billing history yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Your shortlist requests will appear here once submitted
              </p>
            </div>
          )}
        </Card>

        <div className="mt-6 text-sm text-gray-500">
          <p>
            Questions about billing?{' '}
            <Link href="/support" className="text-blue-600 hover:text-blue-700">
              Contact support
            </Link>
          </p>
        </div>
      </PageContainer>
    </PageWrapper>
  );
}
