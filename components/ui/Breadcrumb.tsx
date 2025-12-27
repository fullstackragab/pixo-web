'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

function ChevronIcon() {
  return (
    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav className={`flex items-center gap-2 text-sm mb-6 ${className}`.trim()} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && <ChevronIcon />}
            {isLast || !item.href ? (
              <span className={isLast ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// Pre-built breadcrumb configurations for common pages
export const companyBreadcrumbs = {
  dashboard: (): BreadcrumbItem[] => [
    { label: 'Dashboard' }
  ],
  talent: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/company/dashboard' },
    { label: 'Talent' }
  ],
  talentDetail: (backToShortlist?: { id: string; label?: string }): BreadcrumbItem[] => {
    if (backToShortlist) {
      return [
        { label: 'Dashboard', href: '/company/dashboard' },
        { label: 'Shortlists', href: '/company/shortlists' },
        { label: backToShortlist.label || 'Shortlist', href: `/company/shortlists/${backToShortlist.id}` },
        { label: 'Candidate' }
      ];
    }
    return [
      { label: 'Dashboard', href: '/company/dashboard' },
      { label: 'Talent', href: '/company/talent' },
      { label: 'Candidate' }
    ];
  },
  shortlists: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/company/dashboard' },
    { label: 'Shortlists' }
  ],
  shortlistDetail: (title?: string): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/company/dashboard' },
    { label: 'Shortlists', href: '/company/shortlists' },
    { label: title || 'Shortlist' }
  ],
  messages: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/company/dashboard' },
    { label: 'Messages' }
  ],
  settings: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/company/dashboard' },
    { label: 'Settings' }
  ],
  billing: (): BreadcrumbItem[] => [
    { label: 'Dashboard', href: '/company/dashboard' },
    { label: 'Billing History' }
  ]
};
