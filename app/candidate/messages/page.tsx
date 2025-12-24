'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import api from '@/lib/api';

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
}

export default function CandidateMessagesPage() {
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">
            You have messages from companies regarding shortlists you were added to. Messages are informational only.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-1">
            <Card>
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
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No messages yet</p>
              )}
            </Card>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            <Card>
              {selectedMessage ? (
                <div>
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    {selectedMessage.shortlistRoleTitle && (
                      <p className="text-sm text-blue-600 mb-2">
                        Regarding: {selectedMessage.shortlistRoleTitle}
                      </p>
                    )}
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedMessage.subject || 'Message from company'}
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
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500 mt-2">Select a message to read</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
