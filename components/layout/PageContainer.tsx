'use client';

import { ReactNode } from 'react';
import Footer from './Footer';

/**
 * PageContainer - Unified layout wrapper for all Bixo pages
 *
 * Variants:
 * - default: Standard content pages (dashboards, profiles, forms) - max-w-5xl
 * - wide: Data-dense pages (tables, listings, talent browse) - max-w-7xl
 * - narrow: Focused single-column pages (auth, onboarding) - max-w-xl
 * - full: Full-width content (admin tables with sidebar already constraining) - no max-width
 *
 * All variants use consistent horizontal padding:
 * - Mobile: 16px (px-4)
 * - Tablet: 24px (sm:px-6)
 * - Desktop: 32px (lg:px-8)
 */

type ContainerVariant = 'default' | 'wide' | 'narrow' | 'full';

interface PageContainerProps {
  children: ReactNode;
  /** Layout variant - determines max-width */
  variant?: ContainerVariant;
  /** Additional CSS classes */
  className?: string;
  /** Use as <main> element (default: true) */
  as?: 'main' | 'div' | 'section';
  /** Vertical padding - default is py-8 */
  verticalPadding?: 'none' | 'sm' | 'md' | 'lg';
}

const variantStyles: Record<ContainerVariant, string> = {
  default: 'max-w-5xl',      // 1024px - Standard content
  wide: 'max-w-7xl',         // 1280px - Dashboards, tables, listings
  narrow: 'max-w-xl',        // 576px - Auth, forms, focused content
  full: 'w-full',            // No max-width - admin panels with sidebar
};

const verticalPaddingStyles: Record<NonNullable<PageContainerProps['verticalPadding']>, string> = {
  none: '',
  sm: 'py-4 sm:py-6',
  md: 'py-6 sm:py-8',
  lg: 'py-8 sm:py-12',
};

export default function PageContainer({
  children,
  variant = 'default',
  className = '',
  as: Component = 'main',
  verticalPadding = 'md',
}: PageContainerProps) {
  const baseStyles = 'mx-auto px-4 sm:px-6 lg:px-8';
  const widthStyle = variantStyles[variant];
  const paddingStyle = verticalPaddingStyles[verticalPadding];

  return (
    <Component
      className={`${baseStyles} ${widthStyle} ${paddingStyle} ${className}`.trim()}
    >
      {children}
    </Component>
  );
}

/**
 * PageWrapper - Full page wrapper with background
 * Use this to wrap entire page content including header
 */
interface PageWrapperProps {
  children: ReactNode;
  /** Background color class */
  background?: 'white' | 'gray';
  className?: string;
  /** Show footer at bottom of page (default: true for user-facing pages) */
  showFooter?: boolean;
}

export function PageWrapper({
  children,
  background = 'gray',
  className = '',
  showFooter = true
}: PageWrapperProps) {
  const bgStyles = {
    white: 'bg-white',
    gray: 'bg-gray-50',
  };

  return (
    <div className={`min-h-screen flex flex-col ${bgStyles[background]} ${className}`.trim()}>
      <div className="flex-1">
        {children}
      </div>
      {showFooter && <Footer />}
    </div>
  );
}
