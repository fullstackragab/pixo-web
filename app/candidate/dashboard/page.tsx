"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import PageContainer, { PageWrapper } from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { CandidateProfile, Notification, Availability } from "@/types";

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
  // Only includes candidate-controlled items (never system-controlled like recommendations)
  const calculateCompletion = (p: CandidateProfile | null): number => {
    if (!p) return 0;
    let score = 0;
    if (p.firstName && p.lastName) score += 20;
    if (p.cvFileName) score += 30;
    if (p.desiredRole) score += 20;
    if (p.skills && p.skills.length >= 3) score += 20;
    if (p.locationPreference || p.location) score += 10;
    // Note: profileVisible is optional, not required for 100%
    return Math.min(score, 100);
  };

  const completionPercent = calculateCompletion(profile);

  const getCompletionLabel = (percent: number): string => {
    if (percent < 40) return "Getting started";
    if (percent < 70) return "Making progress";
    if (percent < 100) return "Almost complete";
    return "Complete";
  };

  // Get what's missing for profile completion
  // Only includes candidate-controlled items
  const getMissingItems = (p: CandidateProfile | null): string[] => {
    if (!p) return [];
    const missing: string[] = [];
    if (!p.firstName || !p.lastName) missing.push("Add your name");
    if (!p.cvFileName) missing.push("Upload CV");
    if (!p.desiredRole) missing.push("Set desired role");
    if (!p.skills || p.skills.length < 3) missing.push("Add 3+ skills");
    if (!p.locationPreference && !p.location) missing.push("Set location");
    // Note: recommendations are system-controlled, never in missing items
    return missing;
  };

  const missingItems = getMissingItems(profile);

  // Dynamic next action hint based on profile state
  const getNextActionHint = (p: CandidateProfile | null): string => {
    if (!p) return "Complete your profile to get discovered";
    if (!p.cvFileName) return "Upload your CV to get discovered by companies";
    if (!p.skills || p.skills.length < 3)
      return "Add more skills to improve your match rate";
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
              Welcome back{profile?.firstName ? `, ${profile.firstName}` : ""}!
            </h1>
            <p className="text-gray-600 mt-1">{getNextActionHint(profile)}</p>
          </div>
          <div className="shrink-0">{getPrimaryCTA(profile)}</div>
        </div>

        {/* Profile Strength + Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Profile Completion */}
          <Card className="md:col-span-1">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <svg
                  className="w-16 h-16 transform -rotate-90"
                  viewBox="0 0 64 64"
                >
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#E5E7EB"
                    strokeWidth="4"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke={
                      completionPercent >= 70
                        ? "#10B981"
                        : completionPercent >= 40
                        ? "#3B82F6"
                        : "#F59E0B"
                    }
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${completionPercent * 1.76} 176`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gray-900">
                  {completionPercent}%
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Profile</p>
                <p className="font-semibold text-gray-900">
                  {getCompletionLabel(completionPercent)}
                </p>
                {missingItems.length > 0 && completionPercent < 100 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {missingItems[0]}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Profile Views */}
          <Card className="group hover:border-blue-200 transition-colors">
            <div className="flex items-center">
              <div className="shrink-0 p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Profile Views
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {profile?.profileViewsCount || 0}
                </p>
              </div>
            </div>
          </Card>

          {/* Skills */}
          <Link href="/candidate/profile" className="block">
            <Card className="h-full group hover:border-green-200 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="shrink-0 p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
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
                      Skills
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {profile?.skills?.length || 0}
                    </p>
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Card>
          </Link>

          {/* Recommendations - informational only, added by system */}
          <Card className="group hover:border-purple-200 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="shrink-0 p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
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
                    Recommendations
                  </p>
                  {(profile?.recommendationsCount || 0) > 0 ? (
                    <p className="text-2xl font-bold text-gray-900">
                      {profile?.recommendationsCount}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">Added automatically</p>
                  )}
                </div>
              </div>
            </div>
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

              {profile?.skills && profile.skills.length > 0 && (
                <div>
                  <span className="text-gray-500 block text-xs uppercase tracking-wide mb-2">
                    Top Skills
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.slice(0, 5).map((skill) => (
                      <Badge key={skill.id} variant="primary">
                        {skill.skillName}
                      </Badge>
                    ))}
                    {profile.skills.length > 5 && (
                      <Badge variant="default">
                        +{profile.skills.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

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
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-600 text-white rounded-full">
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
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg transition-colors ${
                      notification.isRead
                        ? "bg-gray-50 hover:bg-gray-100"
                        : "bg-blue-50 hover:bg-blue-100 border-l-2 border-blue-500"
                    }`}
                  >
                    <p
                      className={`text-sm ${
                        notification.isRead
                          ? "text-gray-900"
                          : "font-medium text-gray-900"
                      }`}
                    >
                      {notification.title}
                    </p>
                    {notification.message && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>
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
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <p className="font-medium text-gray-900">All caught up!</p>
                <p className="text-sm text-gray-500 mt-1">
                  We&apos;ll notify you when companies show interest
                </p>
              </div>
            )}
          </Card>
        </div>
      </PageContainer>
    </PageWrapper>
  );
}
