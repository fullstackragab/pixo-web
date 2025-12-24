'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { CreateSupportMessageRequest } from '@/types';

const SUBJECT_OPTIONS = [
  'General Question',
  'Account Issue',
  'Technical Problem',
  'Feedback',
  'Other'
];

export default function SupportPage() {
  const { user, isAuthenticated } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!subject.trim()) {
      setError('Please select or enter a subject');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsLoading(true);

    const payload: CreateSupportMessageRequest = {
      subject: subject.trim(),
      message: message.trim(),
    };

    if (!isAuthenticated && contactEmail.trim()) {
      payload.contactEmail = contactEmail.trim();
    }

    const res = await api.post('/support/messages', payload);

    if (res.success) {
      setIsSubmitted(true);
      setSubject('');
      setMessage('');
      setContactEmail('');
    } else {
      setError(res.error || 'Failed to send message. Please try again.');
    }

    setIsLoading(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <Card>
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Message Sent</h2>
              <p className="text-gray-600 mb-6">
                Thank you for reaching out. We read every message and most replies come within 24–48 hours.
              </p>
              <div className="space-y-3">
                <Button onClick={() => setIsSubmitted(false)} variant="outline" className="w-full">
                  Send Another Message
                </Button>
                <Link href="/">
                  <Button variant="ghost" className="w-full">
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-blue-600">
            Bixo
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">
            Contact Support
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We read every message. Most replies come within 24–48 hours.
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="w-full">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a subject...</option>
                {SUBJECT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="How can we help you?"
                required
              />
            </div>

            {!isAuthenticated && (
              <Input
                id="contactEmail"
                type="email"
                label="Email (optional, for reply)"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="your@email.com"
              />
            )}

            {isAuthenticated && user && (
              <p className="text-sm text-gray-500">
                Sending as {user.email}
              </p>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Send Message
            </Button>
          </form>
        </Card>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
