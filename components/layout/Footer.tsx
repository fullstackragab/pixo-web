'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Bixo
          </p>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">
              Terms of Service
            </Link>
            <Link href="/support" className="hover:text-gray-900 transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
