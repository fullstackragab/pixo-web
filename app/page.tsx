'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            We help companies talk to the
            <span className="text-blue-600"> right people faster</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Skip the resume pile. Connect with pre-vetted tech talent through AI-powered matching and curated shortlists.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button size="lg">Get Started Free</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How Bixo Works</h2>

        <div className="grid md:grid-cols-2 gap-12">
          {/* For Candidates */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">For Candidates</h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Upload your CV</h4>
                  <p className="text-gray-600">Our AI extracts your skills and experience automatically</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">2</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Set your preferences</h4>
                  <p className="text-gray-600">Tell us what role you&apos;re looking for and your ideal company</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">3</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Get matched</h4>
                  <p className="text-gray-600">Companies discover your profile and reach out directly</p>
                </div>
              </div>
            </div>
            <p className="mt-8 text-green-600 font-semibold">Always free for candidates</p>
          </div>

          {/* For Companies */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">For Companies</h3>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">1</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Browse talent</h4>
                  <p className="text-gray-600">Search and filter pre-vetted candidates with verified skills</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">2</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Request a shortlist</h4>
                  <p className="text-gray-600">Tell us your requirements, we&apos;ll curate the top matches</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">3</div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Connect directly</h4>
                  <p className="text-gray-600">Message candidates and schedule interviews instantly</p>
                </div>
              </div>
            </div>
            <p className="mt-8 text-gray-600">Starting at <span className="font-bold text-gray-900">$49/month</span></p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-center text-gray-600 mb-12">Choose the plan that fits your hiring needs</p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Free</h3>
              <p className="text-gray-600 mt-2">Try before you buy</p>
              <p className="mt-6"><span className="text-4xl font-bold">$0</span><span className="text-gray-500">/month</span></p>
              <ul className="mt-6 space-y-3 text-gray-600">
                <li>Browse talent profiles</li>
                <li>5 messages/month</li>
                <li>Basic search filters</li>
              </ul>
              <Link href="/register" className="block mt-8">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Starter */}
            <div className="bg-white rounded-2xl p-8 border-2 border-blue-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full">
                Popular
              </div>
              <h3 className="text-xl font-bold text-gray-900">Starter</h3>
              <p className="text-gray-600 mt-2">For growing teams</p>
              <p className="mt-6"><span className="text-4xl font-bold">$49</span><span className="text-gray-500">/month</span></p>
              <ul className="mt-6 space-y-3 text-gray-600">
                <li>Everything in Free</li>
                <li>20 messages/month</li>
                <li>Save candidate profiles</li>
                <li>Advanced filters</li>
              </ul>
              <Link href="/register" className="block mt-8">
                <Button className="w-full">Start Free Trial</Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Pro</h3>
              <p className="text-gray-600 mt-2">For scaling companies</p>
              <p className="mt-6"><span className="text-4xl font-bold">$149</span><span className="text-gray-500">/month</span></p>
              <ul className="mt-6 space-y-3 text-gray-600">
                <li>Everything in Starter</li>
                <li>Unlimited messages</li>
                <li>Priority access to talent</li>
                <li>See recommendations</li>
                <li>Analytics dashboard</li>
              </ul>
              <Link href="/register" className="block mt-8">
                <Button variant="outline" className="w-full">Contact Sales</Button>
              </Link>
            </div>
          </div>

          {/* Shortlist Pricing */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Shortlist-as-a-Service</h3>
            <p className="text-gray-600 mb-8">Get curated candidate shortlists for specific roles</p>
            <div className="inline-flex gap-4 flex-wrap justify-center">
              <div className="bg-white px-6 py-4 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-900">Single Shortlist</p>
                <p className="text-2xl font-bold text-blue-600">$299</p>
              </div>
              <div className="bg-white px-6 py-4 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-900">5 Shortlists</p>
                <p className="text-2xl font-bold text-blue-600">$1,299</p>
                <p className="text-sm text-green-600">Save 13%</p>
              </div>
              <div className="bg-white px-6 py-4 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-900">10 Shortlists</p>
                <p className="text-2xl font-bold text-blue-600">$2,299</p>
                <p className="text-sm text-green-600">Save 23%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to find your next hire?</h2>
        <p className="text-xl text-gray-600 mb-8">Join thousands of companies finding top tech talent on Bixo</p>
        <Link href="/register">
          <Button size="lg">Get Started Free</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-2xl" style={{ fontFamily: 'var(--font-lexend-giga)' }}>Bixo</p>
            <p className="text-gray-400 mt-4 md:mt-0">&copy; 2024 Bixo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
