'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { SendShortlistMessageResponse } from '@/types';

interface SendShortlistMessageModalProps {
  shortlistId: string;
  roleTitle: string;
  candidateCount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (response: SendShortlistMessageResponse) => void;
}

export default function SendShortlistMessageModal({
  shortlistId,
  roleTitle,
  candidateCount,
  isOpen,
  onClose,
  onSuccess,
}: SendShortlistMessageModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sentCount, setSentCount] = useState(0);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post<SendShortlistMessageResponse>(
        `/shortlists/${shortlistId}/messages`,
        {}
      );

      if (res.success && res.data) {
        setSuccess(true);
        setSentCount(res.data.recipientCount);
        onSuccess?.(res.data);
        setTimeout(() => {
          handleClose();
        }, 2000);
      } else {
        setError(res.error || 'Failed to send message');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    setSentCount(0);
    onClose();
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
        <div className="relative w-full max-w-md transform rounded-lg bg-white p-6 shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Send Message to Candidates
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-900 font-medium">Message sent to {sentCount} candidates!</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Shortlist:</span> {roleTitle}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  This will send a message to all {candidateCount} candidates in this shortlist.
                </p>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Send a short informational message to all candidates in this shortlist. Candidates cannot reply.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  className="flex-1"
                >
                  Send Messages
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
