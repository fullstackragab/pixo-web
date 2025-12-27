'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types';
import api from '@/lib/api';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated && user?.userType === UserType.Candidate) {
      loadUnreadCount();
    }
  }, [isAuthenticated, user?.userType]);

  const loadUnreadCount = async () => {
    const res = await api.get<{ unreadCount: number }>('/candidates/messages/unread-count');
    if (res.success && res.data) {
      setUnreadCount(res.data.unreadCount);
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.userType) {
      case UserType.Candidate:
        return '/candidate/dashboard';
      case UserType.Company:
        return '/company/dashboard';
      case UserType.Admin:
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            href={isAuthenticated ? getDashboardLink() : '/'}
            className="hover:opacity-70 transition-opacity"
          >
            <Image
              src="/logo+name.png"
              alt="Bixo"
              width={80}
              height={32}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {isAuthenticated ? (
              <>
                <Link
                  href={getDashboardLink()}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Dashboard
                </Link>
                {user?.userType === UserType.Candidate && (
                  <>
                    <Link
                      href="/candidate/profile"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/candidate/messages"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors relative"
                    >
                      Messages
                      {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-4 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                {user?.userType === UserType.Company && (
                  <>
                    <Link
                      href="/company/shortlists"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Shortlists
                    </Link>
                    <Link
                      href="/company/talent"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Talent
                    </Link>
                  </>
                )}
                <button
                  onClick={logout}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/#how-it-works"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  How it works
                </Link>
                <Link
                  href="/register?type=candidate"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  For candidates
                </Link>
                <Link
                  href="/register?type=company"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  For companies
                </Link>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border mt-4 pt-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  href={getDashboardLink()}
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  Dashboard
                </Link>
                {user?.userType === UserType.Candidate && (
                  <>
                    <Link
                      href="/candidate/profile"
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/candidate/messages"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-between px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      Messages
                      {unreadCount > 0 && (
                        <span className="bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                {user?.userType === UserType.Company && (
                  <>
                    <Link
                      href="/company/shortlists"
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      Shortlists
                    </Link>
                    <Link
                      href="/company/talent"
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                    >
                      Talent
                    </Link>
                  </>
                )}
                <button
                  onClick={() => { logout(); closeMobileMenu(); }}
                  className="block w-full text-left px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/#how-it-works"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  How it works
                </Link>
                <Link
                  href="/register?type=candidate"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  For candidates
                </Link>
                <Link
                  href="/register?type=company"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  For companies
                </Link>
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
