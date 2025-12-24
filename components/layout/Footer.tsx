'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-2xl font-bold">Bixo</p>
          <nav className="flex gap-6 mt-4 md:mt-0 text-sm text-gray-400">
            <Link href="/#how-it-works" className="hover:text-white transition-colors">
              How Bixo Works
            </Link>
            <Link href="/support" className="hover:text-white transition-colors">
              Support
            </Link>
          </nav>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center md:text-left">
          <p className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} Bixo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
