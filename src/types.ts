import { Timestamp } from './firebase';

// =============================================
// Roles & Auth
// =============================================
export type UserRole = 'super_admin' | 'store_owner' | 'staff';
export type Tier = 'Bronze' | 'Silver' | 'Gold';
export type TransactionType = 'point_earn' | 'point_redeem' | 'package_buy' | 'package_use';
export type SubscriptionPlan = 'trial' | 'basic' | 'pro';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

// =============================================
// Multi-Tenant Core
// =============================================
export interface Tenant {
  id: string;
  shopName: string;
  shopPhone?: string;
  ownerId: string; // Firebase Auth UID of the store owner
  subscription: Subscription;
  lineConfig?: LineConfig;
  theme?: TenantTheme;
  isActive: boolean;
  createdAt: Timestamp;
}

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  maxMembers: number;
  expiresAt: Timestamp | null;
  startedAt: Timestamp;
}

export interface LineConfig {
  channelAccessToken: string;
  channelSecret: string;
  webhookUrl?: string; // auto-generated: /api/line-webhook/{tenantId}
}

export interface TenantTheme {
  primaryColor: string;    // e.g. "#C89595"
  logoUrl?: string;        // Firebase Storage URL
}

export interface UserProfile {
  id: string;              // same as Firebase Auth UID
  email: string;
  displayName: string;
  role: UserRole;
  tenantId: string | null; // null for super_admin (has access to all)
  createdAt: Timestamp;
}

export interface Invitation {
  id: string;
  tenantId: string;
  email: string;
  role: UserRole;
  invitedBy: string;       // UID of the inviter
  status: 'pending' | 'accepted' | 'expired';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

// =============================================
// Business Entities (all with tenantId)
// =============================================
export interface Member {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  points: number;
  totalSpent: number;
  tier: Tier;
  preferredBranchId?: string;
  lineUserId?: string;
  lineDisplayName?: string;
  lastVisit: Timestamp | null;
  createdAt: Timestamp;
}

export interface Package {
  id: string;
  tenantId: string;
  memberId: string;
  title: string;
  totalSessions: number;
  remainingSessions: number;
  expiryDate: Timestamp | null;
  status: 'active' | 'expired' | 'depleted';
}

export interface Transaction {
  id: string;
  tenantId: string;
  memberId: string;
  type: TransactionType;
  amount: number;
  pointsChange: number;
  serviceName: string;
  timestamp: Timestamp;
}

export interface PackageTemplate {
  id: string;
  tenantId: string;
  title: string;
  price: number;
  sessions: number;
}

export interface ServiceTemplate {
  id: string;
  tenantId: string;
  name: string;
  price: number;
}

export interface ShopConfig {
  shopName: string;
  shopPhone?: string;
  businessHours?: BusinessDay[];
  theme?: TenantTheme;
}

export interface BusinessDay {
  day: string; // e.g., 'Monday', 'วันจันทร์'
  open: string; // e.g., '09:00'
  close: string; // e.g., '20:00'
  isOpen: boolean;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  phone?: string;
  lat: number;
  lng: number;
  address?: string;
  createdAt: Timestamp;
}

export interface SalonStats {
  totalMembers: number;
  activePackages: number;
  totalRevenue: number;
  recentVisits: number;
}

export interface Booking {
  id: string;
  tenantId: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  serviceName: string;
  date: string;
  timeSlot: string;
  branchId: string;
  branchName: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Timestamp;
}
