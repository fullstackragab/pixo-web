'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/layout/Header';
import api from '@/lib/api';

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-base font-medium text-foreground mb-2">
      {children}
    </label>
  );
}

function Input({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full px-3 py-2 bg-input-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
    />
  );
}

function Textarea({
  id,
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full px-3 py-2 bg-input-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
    />
  );
}

function Button({
  children,
  type = 'button',
  onClick,
  disabled = false,
  className = '',
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export default function RequestShortlistPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    roleDescription: '',
    techStack: '',
    seniority: '',
    locationPreference: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const techStackArray = formData.techStack
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await api.post<{ id: string }>('/shortlists/request', {
        roleTitle: formData.roleDescription.split('\n')[0].slice(0, 100) || 'New Role Request',
        roleDescription: formData.roleDescription,
        techStackRequired: techStackArray,
        seniorityRequired: formData.seniority || null,
        locationPreference: formData.locationPreference || null,
        additionalNotes: formData.notes || null,
      });

      if (res.success && res.data) {
        router.push(`/company/shortlists/${res.data.id}`);
      } else {
        router.push('/company/shortlists');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="mb-3">Request a shortlist</h1>
          <p className="text-muted-foreground">
            Tell us what you're looking for. We'll curate a shortlist of candidates and present pricing once we've prepared it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <Label htmlFor="roleDescription">Role description</Label>
            <Textarea
              id="roleDescription"
              value={formData.roleDescription}
              onChange={(e) => setFormData({ ...formData, roleDescription: e.target.value })}
              placeholder="Describe the role, responsibilities, and what success looks like..."
              className="min-h-32"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="techStack">Tech stack (optional)</Label>
            <Input
              id="techStack"
              value={formData.techStack}
              onChange={(e) => setFormData({ ...formData, techStack: e.target.value })}
              placeholder="e.g., React, TypeScript, Node.js"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seniority">Seniority level</Label>
            <Input
              id="seniority"
              value={formData.seniority}
              onChange={(e) => setFormData({ ...formData, seniority: e.target.value })}
              placeholder="e.g., Senior, Lead, Principal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationPreference">Location preference (optional)</Label>
            <Input
              id="locationPreference"
              value={formData.locationPreference}
              onChange={(e) => setFormData({ ...formData, locationPreference: e.target.value })}
              placeholder="e.g., EU timezone, Remote anywhere"
            />
            <p className="text-sm text-muted-foreground">This is a soft preference, not a requirement.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional notes (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any other context that would help us find the right candidates..."
              className="min-h-24"
            />
          </div>

          {/* Curated shortlist info */}
          <div className="p-4 bg-muted/50 border border-border rounded-lg">
            <p className="text-sm font-medium text-foreground">Curated shortlists are intentionally small</p>
            <p className="text-sm text-muted-foreground mt-1">
              We deliver the strongest matches for your role — usually around 5 candidates.
              In some cases, fewer candidates means a better outcome.
            </p>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit request'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
