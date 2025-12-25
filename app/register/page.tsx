'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

type AccountType = 'candidate' | 'company';

export default function RegisterPage() {
  const { registerCandidate, registerCompany } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>('candidate');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let result;
    if (accountType === 'candidate') {
      result = await registerCandidate(email, password, firstName, lastName);
    } else {
      result = await registerCompany(email, password, companyName, industry);
    }

    if (!result.success) {
      setError(result.error || 'Registration failed');
    }
    setIsLoading(false);
  };

  return (
    <PageWrapper className="flex items-center justify-center py-12">
      <PageContainer variant="full" className="max-w-2xl space-y-8">
        <div className="text-center">
          <Link href="/">
            <Image
              src="/logo+name.png"
              alt="Bixo"
              width={120}
              height={40}
              className="mx-auto"
              priority
            />
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <Card>
          {/* Account Type Toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                accountType === 'candidate'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setAccountType('candidate')}
            >
              I&apos;m a Candidate
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                accountType === 'company'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setAccountType('company')}
            >
              I&apos;m Hiring
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              id="email"
              type="email"
              label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />

            <Input
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a password"
              minLength={8}
            />

            {accountType === 'candidate' ? (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="firstName"
                  type="text"
                  label="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="John"
                />
                <Input
                  id="lastName"
                  type="text"
                  label="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Doe"
                />
              </div>
            ) : (
              <>
                <Input
                  id="companyName"
                  type="text"
                  label="Company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  placeholder="Acme Inc."
                />
                <Input
                  id="industry"
                  type="text"
                  label="Industry"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  required
                  placeholder="Technology"
                />
              </>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              {accountType === 'candidate' ? 'Create Account' : 'Start Hiring'}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </Card>
      </PageContainer>
    </PageWrapper>
  );
}
