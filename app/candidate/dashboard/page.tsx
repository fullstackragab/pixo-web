"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import PageContainer, { PageWrapper } from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import NotificationItem from "@/components/notifications/NotificationItem";
import api from "@/lib/api";
import { deriveCapabilities } from "@/lib/capabilities";
import { CandidateProfile, Notification, Availability, Capabilities } from "@/types";

export default function CandidateDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user]);

  const loadData = async () => {
    setIsLoading(true);
    const [profileRes, notificationsRes] = await Promise.all([
      api.get<CandidateProfile>("/candidates/profile"),
      api.get<Notification[]>("/candidates/notifications"),
    ]);

    if (profileRes.success && profileRes.data) {
      setProfile(profileRes.data);
    }
    if (notificationsRes.success && notificationsRes.data) {
      setNotifications(notificationsRes.data.slice(0, 5));
    }
    setIsLoading(false);
  };

  // Calculate profile completion percentage
  // Get what's missing for profile completion
  // Only includes candidate-controlled items - skills are derived from CV, not added manually
  const getMissingItems = (p: CandidateProfile | null): string[] => {
    if (!p) return [];
    const missing: string[] = [];
    if (!p.firstName || !p.lastName) missing.push("Add your name");
    if (!p.cvFileName) missing.push("Upload CV");
    if (!p.desiredRole) missing.push("Set desired role");
    if (!p.locationPreference && !p.location) missing.push("Set location");
    return missing;
  };

  const missingItems = getMissingItems(profile);

  // Dynamic next action hint based on profile state
  const getNextActionHint = (p: CandidateProfile | null): string => {
    if (!p) return "Complete your profile to get discovered";
    if (!p.cvFileName) return "Upload your CV to get discovered by companies";
    if (!p.profileVisible)
      return "Make your profile visible to start receiving interest";
    return "Your profile is active and visible to companies";
  };

  // Get primary CTA based on profile state
  const getPrimaryCTA = (p: CandidateProfile | null) => {
    if (!p?.cvFileName) {
      return (
        <Link href="/candidate/profile">
          <Button>Upload CV</Button>
        </Link>
      );
    }
    if (!p.profileVisible) {
      return (
        <Button
          onClick={handleToggleVisibility}
          disabled={isTogglingVisibility}
        >
          {isTogglingVisibility ? "Updating..." : "Go Visible"}
        </Button>
      );
    }
    return (
      <Link href="/candidate/profile">
        <Button variant="outline">Edit Profile</Button>
      </Link>
    );
  };

  const handleToggleVisibility = async () => {
    if (!profile) return;
    setIsTogglingVisibility(true);
    try {
      const res = await api.put<CandidateProfile>("/candidates/profile", {
        profileVisible: !profile.profileVisible,
      });
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  const getAvailabilityBadge = (availability: Availability) => {
    switch (availability) {
      case Availability.Open:
        return <Badge variant="success">Actively Looking</Badge>;
      case Availability.Passive:
        return <Badge variant="warning">Open to Opportunities</Badge>;
      case Availability.NotNow:
        return <Badge variant="default">Not Looking</Badge>;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

      <PageContainer variant="wide">
        {/* Welcome Header with Dynamic CTA */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome backk{profile?.firstName ? `, ${profile.firstName}` : ""}!
            </h1>
            <p className="text-gray-600 mt-1">{getNextActionHint(profile)}</p>
          </div>
          <div className="shrink-0">{getPrimaryCTA(profile)}</div>
        </div>

        {/* Profile Strength + Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Status */}
          {(() => {
            const getStatus = () => {
              if (!profile?.cvFileName) return { label: 'CV Required', color: 'yellow', icon: 'warning' };
              if (profile.profileStatus === 'approved') {
                if (profile.profileVisible) return { label: 'Approved & Visible', color: 'green', icon: 'check' };
                return { label: 'Paused', color: 'gray', icon: 'pause' };
              }
              return { label: 'Under Review', color: 'blue', icon: 'clock' };
            };
            const status = getStatus();
            const colorClasses = {
              green: 'bg-green-100 text-green-600',
              blue: 'bg-blue-100 text-blue-600',
              yellow: 'bg-yellow-100 text-yellow-600',
              gray: 'bg-gray-100 text-gray-600',
            };

            return (
              <Card className="md:col-span-1">
                <div className="flex items-center gap-4">
                  <div className={`shrink-0 p-3 rounded-lg ${colorClasses[status.color as keyof typeof colorClasses]}`}>
                    {status.icon === 'check' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {status.icon === 'clock' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {status.icon === 'warning' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    {status.icon === 'pause' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Profile status</p>
                    <p className="font-semibold text-gray-900">{status.label}</p>
                    {missingItems.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {missingItems[0]}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })()}

          {/* Expertise Areas */}
          {(() => {
            const capabilities: Capabilities = profile?.capabilities ||
              (profile?.skills ? deriveCapabilities(profile.skills) : {});
            const areas = Object.keys(capabilities).slice(0, 4);

            return (
              <Card className="h-full">
                <div className="flex items-center mb-3">
                  <div className="shrink-0 p-3 bg-green-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Expertise areas
                    </p>
                  </div>
                </div>
                {areas.length > 0 ? (
                  <div className="space-y-1">
                    {areas.map((area) => (
                      <p key={area} className="text-sm text-gray-700">{area}</p>
                    ))}
                    <Link
                      href="/candidate/profile"
                      className="text-xs text-primary hover:underline mt-2 inline-block"
                    >
                      View full breakdown
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Derived from your CV</p>
                )}
              </Card>
            );
          })()}

          {/* Private Recommendations */}
          <Card className="h-full">
            <div className="flex items-center mb-3">
              <div className="shrink-0 p-3 bg-purple-100 rounded-lg">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Private recommendations
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Shared only with companies you are introduced to.
            </p>
            {(profile?.recommendationsCount || 0) > 0 ? (
              <p className="text-sm text-gray-700">
                {profile?.recommendationsCount} recommendation{(profile?.recommendationsCount || 0) !== 1 ? 's' : ''}
              </p>
            ) : (
              <Link
                href="/candidate/profile"
                className="text-xs text-primary hover:underline"
              >
                Request recommendation
              </Link>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Profile Summary */}
          <Card>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                Profile Summary
              </h2>
              <Link href="/candidate/profile">
                <Button variant="outline" size="sm">
                  Edit Profile
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">
                    Profile Visibility
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {profile?.profileVisible
                      ? "Companies can discover you in talent search"
                      : "Your profile is hidden from companies"}
                  </p>
                </div>
                <button
                  onClick={handleToggleVisibility}
                  disabled={isTogglingVisibility}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    profile?.profileVisible ? "bg-blue-600" : "bg-gray-300"
                  } ${
                    isTogglingVisibility
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      profile?.profileVisible
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Job Search Status</span>
                {profile && getAvailabilityBadge(profile.availability)}
              </div>

              {profile?.desiredRole && (
                <div>
                  <span className="text-gray-500 block text-xs uppercase tracking-wide mb-1">
                    Desired Role
                  </span>
                  <span className="font-medium text-gray-900">
                    {profile.desiredRole}
                  </span>
                </div>
              )}

              {(() => {
                const caps: Capabilities = profile?.capabilities ||
                  (profile?.skills ? deriveCapabilities(profile.skills) : {});
                const expertiseAreas = Object.keys(caps);
                if (expertiseAreas.length === 0) return null;

                return (
                  <div>
                    <span className="text-gray-500 block text-xs uppercase tracking-wide mb-2">
                      Expertise areas
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {expertiseAreas.slice(0, 4).map((area) => (
                        <Badge key={area} variant="primary">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {!profile?.cvFileName && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 p-1.5 bg-yellow-100 rounded-full">
                      <svg
                        className="w-4 h-4 text-yellow-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        CV not uploaded
                      </p>
                      <p className="text-xs text-yellow-700 mt-0.5">
                        Upload your CV to get discovered and auto-extract skills
                      </p>
                      <Link href="/candidate/profile">
                        <Button size="sm" className="mt-2">
                          Upload CV
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <Link
                href="/candidate/notifications"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            </div>

            {notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    compact
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">
                  We&apos;ll notify you when something meaningful happens.
                </p>
              </div>
            )}
          </Card>
        </div>
      </PageContainer>
    </PageWrapper>
  );
}
