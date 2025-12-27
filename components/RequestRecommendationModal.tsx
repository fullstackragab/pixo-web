'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { RequestRecommendationRequest } from '@/types';

interface RequestRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentCount: number;
}

const RELATIONSHIP_OPTIONS = [
  { value: 'Manager', label: 'Manager' },
  { value: 'Tech Lead', label: 'Tech Lead' },
  { value: 'Founder', label: 'Founder / CEO' },
  { value: 'Peer', label: 'Peer / Teammate' },
  { value: 'Colleague', label: 'Colleague' },
];

export default function RequestRecommendationModal({
  isOpen,
  onClose,
  onSuccess,
  currentCount,
}: RequestRecommendationModalProps) {
  const [recommenderName, setRecommenderName] = useState('');
  const [recommenderEmail, setRecommenderEmail] = useState('');
  const [relationship, setRelationship] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRequest = currentCount < 3;

  const handleClose = () => {
    if (!isSubmitting) {
      setRecommenderName('');
      setRecommenderEmail('');
      setRelationship('');
      setError(null);
      onClose();
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recommenderName.trim()) {
      setError('Please enter the recommender\'s name');
      return;
    }

    if (!recommenderEmail.trim() || !isValidEmail(recommenderEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!relationship) {
      setError('Please select your relationship');
      return;
    }

    setIsSubmitting(true);

    const request: RequestRecommendationRequest = {
      recommenderName: recommenderName.trim(),
      recommenderEmail: recommenderEmail.trim().toLowerCase(),
      relationship,
    };

    const res = await api.post('/candidates/me/recommendations', request);

    if (res.success) {
      setRecommenderName('');
      setRecommenderEmail('');
      setRelationship('');
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Failed to send recommendation request');
    }

    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md transform rounded-xl bg-white p-6 shadow-xl transition-all">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
            disabled={isSubmitting}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Request Recommendation</h2>
            <p className="text-sm text-gray-600 mt-1">
              Ask someone from your professional network to write a recommendation.
            </p>
          </div>

          {!canRequest ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                You have reached the maximum of 3 recommendations. Delete an existing recommendation to request a new one.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Recommender Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Recommender&apos;s Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={recommenderName}
                  onChange={(e) => setRecommenderName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* Recommender Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Recommender&apos;s Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={recommenderEmail}
                  onChange={(e) => setRecommenderEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>

              {/* Relationship */}
              <div>
                <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Relationship
                </label>
                <select
                  id="relationship"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                >
                  <option value="">Select relationship...</option>
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Privacy note */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  They will receive an email with a private link to write a recommendation. Recommendations are only shared with companies after your approval.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
