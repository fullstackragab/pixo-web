'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageContainer from '@/components/layout/PageContainer';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />

      {/* Hero Section */}
      <section className="py-20 sm:py-32 lg:py-40">
        <PageContainer variant="wide" verticalPadding="none">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8 leading-tight">
              We help companies talk to the
              <span className="text-blue-600"> right people faster</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 leading-relaxed">
              No job posts. No applications. Just curated shortlists of reviewed candidates, delivered when you need them.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
              {isAuthenticated ? (
                <Link href={getDashboardLink()}>
                  <Button size="lg" className="w-full sm:w-auto px-8">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/register?type=company">
                    <Button size="lg" className="w-full sm:w-auto px-8">Request a shortlist</Button>
                  </Link>
                  <Link href="/register?type=candidate">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">Join as a candidate</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </PageContainer>
      </section>

      {/* How it Works */}
      <section className="py-20 sm:py-32">
        <PageContainer variant="wide" verticalPadding="none">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 mb-16 sm:mb-20">How Bixo Works</h2>

          <div className="grid md:grid-cols-2 gap-8 sm:gap-16 max-w-5xl mx-auto">
            {/* For Candidates */}
            <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">For Candidates</h3>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">1</div>
                  <div className="ml-5">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">Share your background</h4>
                    <p className="text-gray-600">Upload your CV and tell us what you&apos;re looking for</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">2</div>
                  <div className="ml-5">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">Stay passive</h4>
                    <p className="text-gray-600">No applications. No spam. Companies can only reach you through shortlists.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">3</div>
                  <div className="ml-5">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">Get shortlisted</h4>
                    <p className="text-gray-600">When a role fits, you&apos;ll know. Messaging is intentional and limited.</p>
                  </div>
                </div>
              </div>
              <p className="mt-10 text-green-600 font-semibold text-lg">Always free for candidates</p>
            </div>

            {/* For Companies */}
            <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">For Companies</h3>
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">1</div>
                  <div className="ml-5">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">Describe the role</h4>
                    <p className="text-gray-600">Tell us what you&apos;re looking for. No job post required.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">2</div>
                  <div className="ml-5">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">Receive a shortlist</h4>
                    <p className="text-gray-600">We review and rank candidates. You get a curated list.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold text-lg">3</div>
                  <div className="ml-5">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">Message with intent</h4>
                    <p className="text-gray-600">Reach out directly. Messaging is limited by design.</p>
                  </div>
                </div>
              </div>
              <p className="mt-10 text-gray-600 text-lg">Outcome-based pricing. Pay only after delivery.</p>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Pricing Process */}
      <section className="bg-gray-50 py-20 sm:py-32">
        <PageContainer variant="wide" verticalPadding="none">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-10">How Pricing Works</h2>
            <div className="space-y-6 text-xl text-gray-600 leading-relaxed">
              <p>Pricing is outcome-based.</p>
              <p>You review and approve pricing before delivery. Payment is collected only after you receive your shortlist.</p>
              <p className="font-semibold text-gray-900 text-2xl">No delivery = no charge.</p>
            </div>
            <p className="mt-12 text-gray-500 text-lg">
              Shortlists typically include 5–15 candidates, depending on the role.
            </p>
          </div>
        </PageContainer>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-32">
        <PageContainer variant="wide" verticalPadding="none">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">Ready to talk to the right people?</h2>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              Shortlists replace job posts. Candidates stay passive. Companies pay for outcomes.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
              {isAuthenticated ? (
                <Link href={getDashboardLink()}>
                  <Button size="lg" className="px-8">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/register?type=company">
                    <Button size="lg" className="px-8">Request a shortlist</Button>
                  </Link>
                  <Link href="/register?type=candidate">
                    <Button variant="outline" size="lg" className="px-8">Join as a candidate</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </PageContainer>
      </section>

      <Footer />
    </div>
  );
}
