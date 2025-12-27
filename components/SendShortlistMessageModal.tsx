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

// Generate the message preview that matches what the backend will send
function getMessagePreview(): string {
  return `Hello [Candidate],

A company on Bixo has reviewed your profile and is interested in exploring a potential opportunity with you.

If you are open to learning more, you can view details and respond from your Bixo dashboard.

— The Bixo Team`;
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

  const messagePreview = getMessagePreview();

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
        <div className="relative w-full max-w-lg transform rounded-lg bg-white p-6 shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Message All Candidates
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
              <p className="text-gray-900 font-medium">Messages sent successfully!</p>
              <p className="text-sm text-gray-500 mt-1">{sentCount} candidates will be notified.</p>
            </div>
          ) : (
            <div>
              {/* Shortlist info */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Shortlist:</span> {roleTitle}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  This will send a message to all {candidateCount} candidates in this shortlist.
                </p>
              </div>

              {/* Explanation */}
              <p className="text-sm text-gray-600 mb-4">
                You are about to send the following message to all candidates. This is a standard Bixo introduction message and cannot be edited.
              </p>

              {/* Message Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message Preview</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {messagePreview}
                </p>
              </div>

              {/* Note about response mechanism */}
              <p className="text-xs text-gray-500 mb-4">
                Each candidate will receive a personalized version with their name. They can respond via their dashboard (Interested / Not Interested). You&apos;ll see their responses in your shortlist.
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
                  Send to All ({candidateCount})
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
