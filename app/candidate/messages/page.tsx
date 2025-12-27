'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import api from '@/lib/api';
import { InterestStatus } from '@/types';

interface Message {
  id: string;
  fromUserId: string;
  fromUserEmail: string;
  fromCompanyName?: string;
  subject: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
  // Shortlist message fields
  shortlistId?: string;
  shortlistRoleTitle?: string;
  companyLocation?: string;
  // Interest response
  interestStatus?: InterestStatus | string;
  interestRespondedAt?: string;
}

export default function CandidateMessagesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadMessages();
    }
  }, [authLoading, user]);

  const loadMessages = async () => {
    setIsLoading(true);
    const res = await api.get<Message[]>('/candidates/messages');
    if (res.success && res.data) {
      setMessages(res.data);
    }
    setIsLoading(false);
  };

  const markAsRead = async (messageId: string) => {
    await api.put(`/messages/${messageId}/read`);
    setMessages(messages.map(m =>
      m.id === messageId ? { ...m, isRead: true } : m
    ));
  };

  const openMessage = (message: Message) => {
    setSelectedMessage(message);
    if (!message.isRead) {
      markAsRead(message.id);
    }
  };

  const respondToMessage = async (messageId: string, interestStatus: 'interested' | 'not_interested' | 'interested_later') => {
    setIsResponding(true);
    try {
      const res = await api.post(`/candidates/messages/${messageId}/respond`, { interestStatus });
      if (res.success) {
        const now = new Date().toISOString();
        // Update local state
        setMessages(messages.map(m =>
          m.id === messageId ? { ...m, interestStatus, interestRespondedAt: now } : m
        ));
        if (selectedMessage?.id === messageId) {
          setSelectedMessage({ ...selectedMessage, interestStatus, interestRespondedAt: now });
        }
      }
    } finally {
      setIsResponding(false);
    }
  };

  const getInterestStatusBadge = (status: InterestStatus | string | undefined) => {
    switch (status) {
      case 'interested':
      case InterestStatus.Interested:
        return <Badge variant="success">Interested</Badge>;
      case 'not_interested':
      case InterestStatus.NotInterested:
        return <Badge variant="default">Not Interested</Badge>;
      case 'interested_later':
      case InterestStatus.InterestedLater:
        return <Badge variant="warning">Maybe Later</Badge>;
      default:
        return <Badge variant="warning">Pending Response</Badge>;
    }
  };

  const hasResponded = (message: Message) => {
    return message.interestStatus &&
           message.interestStatus !== 'pending' &&
           message.interestStatus !== InterestStatus.Pending;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <PageWrapper>
      <Header />

      <PageContainer variant="default">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">
            Companies have expressed interest in your profile. Review and respond to let them know if you&apos;re interested.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Message List */}
          <div className="lg:col-span-1 flex">
            <Card className="flex-1 flex flex-col">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Inbox</h2>

              {messages.length > 0 ? (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => openMessage(message)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedMessage?.id === message.id
                          ? 'bg-blue-50 border border-blue-200'
                          : message.isRead
                          ? 'bg-gray-50 hover:bg-gray-100'
                          : 'bg-white border border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm ${message.isRead ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                          {message.fromCompanyName || message.fromUserEmail}
                        </span>
                        {!message.isRead && (
                          <Badge variant="primary">New</Badge>
                        )}
                      </div>
                      {message.shortlistRoleTitle && (
                        <p className="text-xs text-blue-600 mb-1">
                          {message.shortlistRoleTitle}
                        </p>
                      )}
                      <p className={`text-sm truncate ${message.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                        {message.subject || message.content.substring(0, 50)}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-400">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </p>
                        {hasResponded(message) && (
                          <span className="text-xs">
                            {(message.interestStatus === 'interested' || message.interestStatus === InterestStatus.Interested)
                              ? <span className="text-green-600">Interested</span>
                              : (message.interestStatus === 'interested_later' || message.interestStatus === InterestStatus.InterestedLater)
                              ? <span className="text-yellow-600">Maybe Later</span>
                              : <span className="text-gray-500">Declined</span>
                            }
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                  <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500">No messages yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    We&apos;ll notify you when companies show interest.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2 flex">
            <Card className="flex-1 flex flex-col">
              {selectedMessage ? (
                <div className="flex flex-col h-full">
                  {/* Message Header */}
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    {selectedMessage.shortlistRoleTitle && (
                      <p className="text-sm text-blue-600 mb-2">
                        Regarding: {selectedMessage.shortlistRoleTitle}
                      </p>
                    )}
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedMessage.subject || 'Interest from company'}
                    </h2>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-500">
                        From: {selectedMessage.fromCompanyName || selectedMessage.fromUserEmail}
                      </p>
                      {selectedMessage.companyLocation && (
                        <p className="text-sm text-gray-400">
                          Location: {selectedMessage.companyLocation}
                        </p>
                      )}
                      <p className="text-sm text-gray-400">
                        {new Date(selectedMessage.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className="flex-1">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedMessage.content}
                    </p>
                  </div>

                  {/* Response Section */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    {hasResponded(selectedMessage) ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium text-gray-900">You responded</span>
                          {getInterestStatusBadge(selectedMessage.interestStatus)}
                        </div>
                        <p className="text-sm text-gray-500">
                          {selectedMessage.interestRespondedAt
                            ? `Responded on ${new Date(selectedMessage.interestRespondedAt).toLocaleDateString()}`
                            : 'The company has been notified of your response.'
                          }
                        </p>
                      </div>
                    ) : (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">
                          Respond to this opportunity
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Let the company know if you&apos;re interested in learning more. Your response will be shared with them.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <Button
                            onClick={() => respondToMessage(selectedMessage.id, 'interested')}
                            disabled={isResponding}
                            className="flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            I&apos;m Interested
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => respondToMessage(selectedMessage.id, 'interested_later')}
                            disabled={isResponding}
                            className="flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Maybe Later
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => respondToMessage(selectedMessage.id, 'not_interested')}
                            disabled={isResponding}
                            className="flex items-center gap-2 text-gray-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Not Interested
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-12">
                  <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 mt-2">Select a message to read</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </PageContainer>
    </PageWrapper>
  );
}
