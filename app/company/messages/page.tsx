'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import PageContainer, { PageWrapper } from '@/components/layout/PageContainer';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import api from '@/lib/api';

interface Message {
  id: string;
  toUserId: string;
  toCandidateName: string | null;
  subject: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function CompanyMessagesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      loadMessages();
    }
  }, [authLoading, user]);

  const loadMessages = async () => {
    setIsLoading(true);
    const res = await api.get<Message[]>('/companies/messages');
    if (res.success && res.data) {
      setMessages(res.data);
    }
    setIsLoading(false);
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
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Messages</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-1">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sent Messages</h2>

              {messages.length > 0 ? (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <button
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedMessage?.id === message.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-900">
                        To: {message.toCandidateName || 'Candidate'}
                      </span>
                      <p className="text-sm text-gray-500 truncate">
                        {message.subject || message.content.substring(0, 50)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No messages sent yet</p>
              )}
            </Card>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            <Card>
              {selectedMessage ? (
                <div>
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedMessage.subject || 'No subject'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      To: {selectedMessage.toCandidateName || 'Candidate'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(selectedMessage.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 mt-2">Select a message to view</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </PageContainer>
    </PageWrapper>
  );
}
