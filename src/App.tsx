/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { AuthGuard } from './guards/AuthGuard';
import { RoleGuard } from './guards/RoleGuard';
import { LoginPage } from './pages/LoginPage';
import { OnboardingWizard } from './pages/OnboardingWizard';
import { StoreLayout } from './layouts/StoreLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { SuperAdminDashboard } from './pages/admin/SuperAdminDashboard';
import { TenantList } from './pages/admin/TenantList';
import { TenantDetail } from './pages/admin/TenantDetail';
import { StoreDashboard } from './pages/store/Dashboard';
import { MemberListPage } from './pages/store/MemberList';
import { AddMemberPage } from './pages/store/AddMemberPage';
import { BookingsPage } from './pages/store/BookingsPage';
import { CatalogPage } from './pages/store/CatalogPage';
import { SettingsPage } from './pages/store/SettingsPage';
import { CustomerSimPage } from './pages/store/CustomerSimPage';
import { MemberDetailPage } from './pages/store/MemberDetailPage';
import { StaffManager } from './pages/store/StaffManager';
import { BillingPage } from './pages/store/BillingPage';
import { AcceptInvite } from './pages/AcceptInvite';
import { LiffEntry } from './pages/liff/LiffEntry';
import { ErrorBoundary } from './components/ErrorBoundary';

/**
 * AppRoutes handles routing logic based on userProfile state.
 * - No profile → Onboarding
 * - Super Admin → Admin routes
 * - Store Owner/Staff → Store routes
 */
const AppRoutes: React.FC = () => {
  const { firebaseUser, userProfile, loading } = useAuth();

  // Still loading auth/profile
  if (loading) return null;

  // Not logged in
  if (!firebaseUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/invite/:inviteId" element={<AcceptInvite />} />
        <Route path="/liff" element={<LiffEntry />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Logged in but no profile → needs onboarding
  if (!userProfile) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="/invite/:inviteId" element={<AcceptInvite />} />
        <Route path="/liff" element={<LiffEntry />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    );
  }

  // Super Admin routes
  if (userProfile.role === 'super_admin') {
    return (
      <Routes>
        <Route path="/invite/:inviteId" element={<AcceptInvite />} />
        <Route path="/liff" element={<LiffEntry />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<SuperAdminDashboard />} />
          <Route path="/admin/tenants" element={<TenantList />} />
          <Route path="/admin/tenants/:tenantId" element={<TenantDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  // Store Owner / Staff routes — Wrapped in TenantProvider
  return (
    <TenantProvider>
      <Routes>
        <Route path="/invite/:inviteId" element={<AcceptInvite />} />
        <Route path="/liff" element={<LiffEntry />} />
        <Route element={<StoreLayout />}>
          <Route index element={<StoreDashboard />} />
          <Route path="/members" element={<MemberListPage />} />
          <Route path="/members/new" element={<AddMemberPage />} />
          <Route path="/members/:memberId" element={<MemberDetailPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/settings" element={<RoleGuard allowedRoles={['store_owner']}><SettingsPage /></RoleGuard>} />
          <Route path="/staff" element={<RoleGuard allowedRoles={['store_owner']}><StaffManager /></RoleGuard>} />
          <Route path="/billing" element={<RoleGuard allowedRoles={['store_owner']}><BillingPage /></RoleGuard>} />
          <Route path="/preview" element={<CustomerSimPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </TenantProvider>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
