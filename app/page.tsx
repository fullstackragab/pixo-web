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
      <PageContainer as="section" variant="wide" verticalPadding="lg" className="sm:py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            We help companies talk to the
            <span className="text-blue-600"> right people faster</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            No job posts. No applications. Just curated shortlists of reviewed candidates, delivered when you need them.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
            {isAuthenticated ? (
              <Link href={getDashboardLink()}>
                <Button size="lg" className="w-full sm:w-auto">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/register?type=company">
                  <Button size="lg" className="w-full sm:w-auto">Request a shortlist</Button>
                </Link>
                <Link href="/register?type=candidate">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">Join as a candidate</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </PageContainer>

      {/* How it Works */}
      <PageContainer as="section" variant="wide" verticalPadding="lg" className="sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">How Bixo Works</h2>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-12">
          {/* For Candidates */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">For Candidates</h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Share your background</h4>
                  <p className="text-gray-600">Upload your CV and tell us what you&apos;re looking for</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">2</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Stay passive</h4>
                  <p className="text-gray-600">No applications. No spam. Companies can only reach you through shortlists.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">3</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Get shortlisted</h4>
                  <p className="text-gray-600">When a role fits, you&apos;ll know. Messaging is intentional and limited.</p>
                </div>
              </div>
            </div>
            <p className="mt-8 text-green-600 font-semibold">Always free for candidates</p>
          </div>

          {/* For Companies */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">For Companies</h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">1</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Describe the role</h4>
                  <p className="text-gray-600">Tell us what you&apos;re looking for. No job post required.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">2</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Receive a shortlist</h4>
                  <p className="text-gray-600">We review and rank candidates. You get a curated list.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">3</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Message with intent</h4>
                  <p className="text-gray-600">Reach out directly. Messaging is limited by design.</p>
                </div>
              </div>
            </div>
            <p className="mt-8 text-gray-600">Outcome-based pricing. Pay only after delivery.</p>
          </div>
        </div>
      </PageContainer>

      {/* Pricing Process */}
      <section className="bg-gray-50 py-12 sm:py-20">
        <PageContainer variant="wide" verticalPadding="none">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">How Pricing Works</h2>
            <div className="space-y-4 text-lg text-gray-600">
              <p>Pricing is outcome-based.</p>
              <p>You authorize payment first and are charged only after a shortlist is delivered.</p>
              <p className="font-medium text-gray-900">No delivery = no charge.</p>
            </div>
            <p className="mt-8 text-gray-500">
              Shortlists typically include 5–15 candidates, depending on the role.
            </p>
          </div>
        </PageContainer>
      </section>

      {/* CTA */}
      <PageContainer as="section" variant="wide" verticalPadding="lg" className="sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Ready to talk to the right people?</h2>
        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto">
          Shortlists replace job posts. Candidates stay passive. Companies pay for outcomes.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          {isAuthenticated ? (
            <Link href={getDashboardLink()}>
              <Button size="lg">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/register?type=company">
                <Button size="lg">Request a shortlist</Button>
              </Link>
              <Link href="/register?type=candidate">
                <Button variant="outline" size="lg">Join as a candidate</Button>
              </Link>
            </>
          )}
        </div>
      </PageContainer>

      <Footer />
    </div>
  );
}
