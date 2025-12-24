'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types';
import Button from '@/components/ui/Button';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

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

  return (
    <header className="bg-white border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={isAuthenticated ? getDashboardLink() : '/'} className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'var(--font-nunito)' }}>
              Bixo
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href={getDashboardLink()} className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                {user?.userType === UserType.Candidate && (
                  <Link href="/candidate/messages" className="text-gray-600 hover:text-gray-900">
                    Messages
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
        </div>
      </nav>
    </header>
  );
}
