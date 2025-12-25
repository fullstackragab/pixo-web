'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types';
import Button from '@/components/ui/Button';
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

  interface Message {
    id: string;
    isRead: boolean;
  }

  const loadUnreadCount = async () => {
    const res = await api.get<Message[]>('/candidates/messages');
    if (res.success && res.data) {
      const unread = res.data.filter(m => !m.isRead).length;
      setUnreadCount(unread);
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
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={isAuthenticated ? getDashboardLink() : '/'} className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'var(--font-nunito)' }}>
              Bixo
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href={getDashboardLink()} className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                {user?.userType === UserType.Candidate && (
                  <Link href="/candidate/messages" className="text-gray-600 hover:text-gray-900 relative">
                    Messages
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )}
                {user?.userType === UserType.Company && (
                  <>
                    <Link href="/company/talent" className="text-gray-600 hover:text-gray-900">
                      Talent
                    </Link>
                    <Link href="/company/shortlists" className="text-gray-600 hover:text-gray-900">
                      Shortlists
                    </Link>
                    <Link href="/company/billing" className="text-gray-600 hover:text-gray-900">
                      Billing
                    </Link>
                    <Link href="/company/settings" className="text-gray-600 hover:text-gray-900">
                      Settings
                    </Link>
                  </>
                )}
                <Button variant="ghost" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="md:hidden border-t border-gray-200 py-4 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  href={getDashboardLink()}
                  onClick={closeMobileMenu}
                  className="block px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                >
                  Dashboard
                </Link>
                {user?.userType === UserType.Candidate && (
                  <Link
                    href="/candidate/messages"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-between px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  >
                    Messages
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )}
                {user?.userType === UserType.Company && (
                  <>
                    <Link
                      href="/company/talent"
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      Talent
                    </Link>
                    <Link
                      href="/company/shortlists"
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      Shortlists
                    </Link>
                    <Link
                      href="/company/billing"
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      Billing
                    </Link>
                    <Link
                      href="/company/settings"
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      Settings
                    </Link>
                  </>
                )}
                <div className="px-3 py-2">
                  <Button variant="ghost" onClick={() => { logout(); closeMobileMenu(); }} className="w-full justify-center">
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-2 px-3">
                <Link href="/login" onClick={closeMobileMenu} className="block">
                  <Button variant="ghost" className="w-full justify-center">Login</Button>
                </Link>
                <Link href="/register" onClick={closeMobileMenu} className="block">
                  <Button className="w-full justify-center">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
