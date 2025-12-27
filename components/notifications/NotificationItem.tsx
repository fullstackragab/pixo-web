'use client';

import Link from 'next/link';
import { Notification, NotificationType } from '@/types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  compact?: boolean;
}

// Get icon based on notification type - subtle, not urgent
function getNotificationIcon(type: NotificationType | string) {
  switch (type) {
    case NotificationType.Shortlisted:
    case 'shortlisted':
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case NotificationType.RecommendationUpdate:
    case 'recommendation_update':
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      );
    case NotificationType.ProfileActionRequired:
    case 'profile_action_required':
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case NotificationType.CandidateResponded:
    case 'candidate_responded':
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

// Get CTA config based on notification type
function getNotificationCTA(type: NotificationType | string, requiresAction?: boolean, data?: string) {
  if (!requiresAction) return null;

  switch (type) {
    case NotificationType.ProfileActionRequired:
    case 'profile_action_required':
      return {
        label: 'Update profile',
        href: '/candidate/profile',
      };
    case NotificationType.CandidateResponded:
    case 'candidate_responded':
      // Parse shortlistId from data if available
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.shortlistId) {
            return {
              label: 'View responses',
              href: `/company/shortlists/${parsed.shortlistId}`,
            };
          }
        } catch {
          // Ignore parse errors
        }
      }
      return {
        label: 'View shortlists',
        href: '/company/shortlists',
      };
    default:
      return null;
  }
}

export default function NotificationItem({ notification, onMarkAsRead, compact = false }: NotificationItemProps) {
  const icon = getNotificationIcon(notification.type);
  const cta = getNotificationCTA(notification.type, notification.requiresAction, notification.data);

  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
  };

  const content = (
    <div
      onClick={handleClick}
      className={`
        flex items-start gap-3 p-4 rounded-lg transition-colors cursor-pointer
        ${notification.isRead
          ? 'bg-white hover:bg-gray-50'
          : 'bg-gray-50 hover:bg-gray-100'
        }
        ${compact ? 'p-3' : 'p-4'}
      `}
    >
      {/* Unread indicator dot */}
      <div className="shrink-0 mt-0.5">
        {!notification.isRead ? (
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        ) : (
          <div className="w-2 h-2" />
        )}
      </div>

      {/* Icon */}
      <div className="shrink-0">{icon}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${notification.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
          {notification.title}
        </p>
        {notification.message && !compact && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notification.message}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {new Date(notification.createdAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: new Date(notification.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
          })}
        </p>
      </div>

      {/* CTA Button */}
      {cta && !compact && (
        <div className="shrink-0">
          <Link
            href={cta.href}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            {cta.label}
          </Link>
        </div>
      )}
    </div>
  );

  return content;
}
