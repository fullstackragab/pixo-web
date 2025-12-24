// Location types
export interface Location {
  country?: string;
  city?: string;
  timezone?: string;
  willingToRelocate?: boolean;
  displayText?: string;
}

export interface HiringLocation {
  isRemote: boolean;
  country?: string;
  city?: string;
  timezone?: string;
  displayText?: string;
}

export interface LocationRanking {
  preferRemote?: boolean;
  preferCountry?: string;
  preferTimezone?: string;
  preferRelocationFriendly?: boolean;
}

// Enums
export enum UserType {
  Candidate = 0,
  Company = 1,
  Admin = 2
}

export enum RemotePreference {
  Remote = 0,
  Onsite = 1,
  Hybrid = 2,
  Flexible = 3
}

export enum Availability {
  Open = 0,
  NotNow = 1,
  Passive = 2
}

export enum SeniorityLevel {
  Junior = 0,
  Mid = 1,
  Senior = 2,
  Lead = 3,
  Principal = 4
}

export enum SkillCategory {
  Language = 0,
  Framework = 1,
  Tool = 2,
  Database = 3,
  Cloud = 4,
  Other = 5
}

export enum SubscriptionTier {
  Free = 0,
  Starter = 1,
  Pro = 2
}

export enum ShortlistStatus {
  Pending = 0,
  Processing = 1,
  Completed = 2,
  Cancelled = 3
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auth types
export interface AuthResponse {
  userId: string;
  email: string;
  userType: UserType;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  candidateId?: string;
  companyId?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  userType: UserType;
  isActive: boolean;
  createdAt: string;
  lastActiveAt: string;
  candidateId?: string;
  companyId?: string;
}

// Candidate types
export interface CandidateSkill {
  id: string;
  skillName: string;
  confidenceScore: number;
  category: SkillCategory;
  isVerified: boolean;
}

export interface CandidateProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  linkedInUrl?: string;
  cvFileName?: string;
  cvDownloadUrl?: string;
  desiredRole?: string;
  locationPreference?: string;
  location?: Location;
  remotePreference?: RemotePreference;
  locationDisplayText?: string;
  availability: Availability;
  openToOpportunities: boolean;
  profileVisible: boolean;
  seniorityEstimate?: SeniorityLevel;
  skills: CandidateSkill[];
  recommendationsCount: number;
  profileViewsCount: number;
  createdAt: string;
  lastActiveAt: string;
}

// Company types
export interface CompanyProfile {
  id: string;
  companyName?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  logoUrl?: string;
  location?: Location;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: string;
  messagesRemaining: number;
  createdAt: string;
}

export interface TalentCandidate {
  candidateId: string;
  firstName?: string;
  lastName?: string;
  desiredRole?: string;
  locationPreference?: string;
  location?: Location;
  remotePreference?: RemotePreference;
  locationDisplayText?: string;
  availability: Availability;
  seniorityEstimate?: SeniorityLevel;
  topSkills: string[];
  recommendationsCount: number;
  lastActiveAt: string;
  matchScore: number;
  isSaved: boolean;
}

export interface TalentSearchResult {
  candidates: TalentCandidate[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Message types
export interface Message {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

// Shortlist types
export type ShortlistPricingType = 'new' | 'follow_up' | 'free_regen';

export interface ShortlistChainItem {
  id: string;
  roleTitle: string;
  createdAt: string;
  candidatesCount: number;
}

export interface ShortlistRequest {
  id: string;
  roleTitle: string;
  techStackRequired: string[];
  seniorityRequired?: SeniorityLevel;
  locationPreference?: string;
  hiringLocation?: HiringLocation;
  remoteAllowed: boolean;
  additionalNotes?: string;
  status: ShortlistStatus;
  pricePaid?: number;
  createdAt: string;
  completedAt?: string;
  candidatesCount: number;
  // Versioning fields
  previousRequestId?: string | null;
  pricingType?: ShortlistPricingType;
  followUpDiscount?: number;
  isFollowUp?: boolean;
  newCandidatesCount?: number;
  repeatedCandidatesCount?: number;
}

export interface ShortlistCandidate {
  candidateId: string;
  firstName: string | null;
  lastName: string | null;
  desiredRole: string | null;
  seniorityEstimate: SeniorityLevel | null;
  availability: Availability;
  matchScore: number;
  matchReason: string | null;
  rank: number;
  skills: string[];
  // Versioning fields
  isNew?: boolean;
  previouslyRecommendedIn?: string | null;
  reInclusionReason?: string | null;
  statusLabel?: string;
}

export interface ShortlistDetail extends ShortlistRequest {
  candidates: ShortlistCandidate[];
  chain?: ShortlistChainItem[];
}

// Send message types
export interface SendMessageRequest {
  // Content is now auto-generated by the backend
}

export interface SendMessageResponse {
  id: string;
  toCandidateId: string;
  toCandidateName: string;
  subject: string;
  content: string;
  createdAt: string;
  messagesRemaining: number;
}

// Notification types
export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  data?: string;
  isRead: boolean;
  createdAt: string;
}

// Support message types
export enum SupportMessageStatus {
  New = 0,
  Read = 1,
  Replied = 2
}

export interface SupportMessage {
  id: string;
  userId?: string;
  userType?: UserType;
  userEmail?: string;
  contactEmail?: string;
  subject: string;
  message: string;
  status: SupportMessageStatus;
  createdAt: string;
}

export interface SupportMessageListItem {
  id: string;
  subject: string;
  userType?: UserType;
  status: SupportMessageStatus;
  createdAt: string;
}

export interface CreateSupportMessageRequest {
  subject: string;
  message: string;
  contactEmail?: string;
}

// Shortlist Message types (company -> candidates in shortlist)
export interface ShortlistMessage {
  id: string;
  shortlistId: string;
  shortlistRoleTitle: string;
  companyId: string;
  companyName: string;
  content: string;
  createdAt: string;
}

export interface ShortlistMessageForCandidate {
  id: string;
  shortlistId: string;
  shortlistRoleTitle: string;
  companyId: string;
  companyName: string;
  companyLocation?: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface SendShortlistMessageRequest {
  // Content is now auto-generated by the backend
}

export interface SendShortlistMessageResponse {
  id: string;
  shortlistId: string;
  content: string;
  recipientCount: number;
  createdAt: string;
}
