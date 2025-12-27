'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import api from '@/lib/api';
import { Availability } from '@/types';

function Label({ htmlFor, children, required = false }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-base font-medium text-foreground mb-2">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function Input({
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 bg-input-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
    />
  );
}

function Textarea({
  id,
  value,
  onChange,
  placeholder,
  className = '',
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`w-full px-3 py-2 bg-input-background border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring ${className}`}
    />
  );
}

function Button({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'outline';
  disabled?: boolean;
  className?: string;
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';
  const variantClasses = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90',
    outline: 'border border-border bg-card hover:bg-accent hover:text-accent-foreground',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export default function CandidateOnboardPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    cvFile: null as File | null,
    linkedinUrl: '',
    gitHubUrl: '',
    rolePreference: '',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, cvFile: e.target.files[0] });
      setError(null);
    }
  };

  const handleNext = () => {
    if (step === 1 && !formData.cvFile) {
      setError('Please upload your CV to continue');
      return;
    }
    if (step < 3) {
      setStep(step + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError(null);
    }
  };

  const handleVisibilitySelect = async (availability: Availability) => {
    setIsLoading(true);
    setError(null);

    try {
      // Upload CV (required)
      if (formData.cvFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', formData.cvFile);
        const uploadRes = await api.uploadFile('/candidates/cv/upload', uploadFormData);
        if (!uploadRes.success) {
          setError(uploadRes.error || 'Failed to upload CV');
          setIsLoading(false);
          return;
        }
      } else {
        setError('CV is required to create your profile');
        setIsLoading(false);
        return;
      }

      // Save onboarding data
      const res = await api.post('/candidates/onboard', {
        linkedInUrl: formData.linkedinUrl || null,
        gitHubUrl: formData.gitHubUrl || null,
        desiredRole: formData.rolePreference || null,
        availability,
      });

      if (res.success) {
        router.push('/candidate/profile');
      } else {
        setError(res.error || 'Failed to complete onboarding');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // CV is required to continue
  const canContinueStep1 = !!formData.cvFile;
  const canContinueStep2 = !!formData.rolePreference;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Step {step} of 3</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="mb-3">Upload your CV</h1>
              <p className="text-muted-foreground">
                We use your CV to understand your experience and match you accurately.
                Your profile is reviewed by a human — you&apos;ll never auto-apply to jobs.
              </p>
            </div>

            <div className="space-y-6">
              {/* CV Upload - Required */}
              <div className="space-y-2">
                <Label htmlFor="cv" required>CV / Resume</Label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    formData.cvFile
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="cv"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {formData.cvFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-foreground font-medium">{formData.cvFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="w-8 h-8 mx-auto mb-3 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-sm text-foreground mb-1">Click to upload your CV</p>
                      <p className="text-xs text-muted-foreground">PDF, DOC, or DOCX (required)</p>
                    </>
                  )}
                </div>
              </div>

              {/* LinkedIn & GitHub - Optional, smaller visual weight */}
              <div className="pt-4 border-t border-border space-y-4">
                <div className="space-y-2">
                  <label htmlFor="linkedin" className="block text-sm font-medium text-muted-foreground">
                    LinkedIn profile URL <span className="text-xs">(optional)</span>
                  </label>
                  <Input
                    id="linkedin"
                    type="url"
                    value={formData.linkedinUrl}
                    onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="github" className="block text-sm font-medium text-muted-foreground">
                    GitHub profile URL <span className="text-xs">(optional)</span>
                  </label>
                  <Input
                    id="github"
                    type="url"
                    value={formData.gitHubUrl}
                    onChange={(e) => setFormData({ ...formData, gitHubUrl: e.target.value })}
                    placeholder="https://github.com/yourusername"
                  />
                  <p className="text-xs text-muted-foreground">
                    Public repositories can help highlight hands-on experience for technical roles.
                  </p>
                </div>
              </div>
            </div>

            <Button
              onClick={handleNext}
              disabled={!canContinueStep1}
            >
              Continue
            </Button>

            {!canContinueStep1 && (
              <p className="text-xs text-muted-foreground">
                Upload your CV to continue
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="mb-3">What kind of role are you looking for?</h1>
              <p className="text-muted-foreground">
                Be as specific or broad as you like. This helps us match you with relevant opportunities.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rolePreference">Role preference</Label>
              <Textarea
                id="rolePreference"
                value={formData.rolePreference}
                onChange={(e) => setFormData({ ...formData, rolePreference: e.target.value })}
                placeholder="e.g., Senior frontend role focused on product development, ideally with React. Open to team lead positions."
                className="min-h-32"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canContinueStep2}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="mb-3">Set your availability</h1>
              <p className="text-muted-foreground">
                You can change this anytime from your profile.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleVisibilitySelect(Availability.Open)}
                disabled={isLoading}
                className="w-full border border-border rounded-lg p-6 text-left bg-card hover:bg-accent/50 transition-colors disabled:opacity-50"
              >
                <h4 className="mb-2">Open to opportunities</h4>
                <p className="text-sm text-muted-foreground">
                  Your profile will be reviewed and, once approved, visible to companies requesting shortlists.
                </p>
              </button>

              <button
                onClick={() => handleVisibilitySelect(Availability.NotNow)}
                disabled={isLoading}
                className="w-full border border-border rounded-lg p-6 text-left bg-card hover:bg-accent/50 transition-colors disabled:opacity-50"
              >
                <h4 className="mb-2">Not looking right now</h4>
                <p className="text-sm text-muted-foreground">
                  Your profile will be hidden. You can activate it when ready.
                </p>
              </button>
            </div>

            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isLoading}
            >
              Back
            </Button>

            {/* Curated system note */}
            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                This is a curated system. Your profile is reviewed by humans before being shown to companies —
                we prioritize quality matches over volume.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
