import { Timestamp } from './firebase';

export type Tier = 'Bronze' | 'Silver' | 'Gold';
export type TransactionType = 'point_earn' | 'point_redeem' | 'package_buy' | 'package_use';

export interface Member {
  id: string;
  name: string;
  phone: string;
  points: number;
  totalSpent: number;
  tier: Tier;
  preferredBranchId?: string;
  lastVisit: Timestamp | null;
  createdAt: Timestamp;
}

export interface Package {
  id: string;
  memberId: string;
  title: string;
  totalSessions: number;
  remainingSessions: number;
  expiryDate: Timestamp | null;
  status: 'active' | 'expired' | 'depleted';
}

export interface Transaction {
  id: string;
  memberId: string;
  type: TransactionType;
  amount: number;
  pointsChange: number;
  serviceName: string;
  timestamp: Timestamp;
}

export interface PackageTemplate {
  id: string;
  title: string;
  price: number;
  sessions: number;
}

export interface ServiceTemplate {
  id: string;
  name: string;
  price: number;
}

export interface ShopConfig {
  shopName: string;
  shopPhone?: string;
  businessHours?: BusinessDay[];
}

export interface BusinessDay {
  day: string; // e.g., 'Monday', 'วันจันทร์'
  open: string; // e.g., '09:00'
  close: string; // e.g., '20:00'
  isOpen: boolean;
}

export interface Branch {
  id: string;
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
