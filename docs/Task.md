# ✅ Task Breakdown — NailSaaS Multi-Tenant Migration

> **Version:** 1.0  
> **Date:** 2026-04-19  
> **Status:** Planning

---

## Phase 1: Multi-Tenant Foundation (MVP)

### 1.1 Data Layer — Types & Models
- [ ] สร้าง `Tenant` interface ใน `src/types.ts`
- [ ] สร้าง `UserProfile` interface (role, tenantId)
- [ ] สร้าง `Invitation` interface
- [ ] สร้าง `Subscription` interface
- [ ] ปรับ `Member`, `Package`, `Transaction`, `Booking` เพิ่มฟิลด์ `tenantId`
- [ ] ปรับ `ShopConfig` เพิ่มฟิลด์ `theme` (primaryColor, logo)
- [ ] ปรับ `PackageTemplate`, `ServiceTemplate`, `Branch` เพิ่มฟิลด์ `tenantId`
- [ ] อัปเดต `firebase-blueprint.json` ให้ตรงกับ schema ใหม่

### 1.2 Authentication & Routing
- [ ] ติดตั้ง `react-router-dom` v7
- [ ] สร้าง `src/contexts/AuthContext.tsx` — จัดการ Firebase Auth state
- [ ] สร้าง `src/contexts/TenantContext.tsx` — จัดการ tenantId + role
- [ ] สร้าง `src/hooks/useTenant.ts` — Custom hook ดึง tenantId
- [ ] สร้าง `src/hooks/useAuth.ts` — Custom hook ดึง user + role
- [ ] สร้าง `src/guards/AuthGuard.tsx` — Redirect ถ้ายังไม่ login
- [ ] สร้าง `src/guards/RoleGuard.tsx` — ป้องกันเข้าถึงตาม role
- [ ] ปรับ `src/App.tsx` เป็น Router-based architecture
- [ ] สร้าง Route structure:
  - [ ] `/login` — หน้า Login
  - [ ] `/onboarding` — Onboarding Wizard ร้านค้าใหม่
  - [ ] `/` — Store Dashboard (store_owner / staff)
  - [ ] `/members` — รายชื่อลูกค้า
  - [ ] `/members/:id` — รายละเอียดลูกค้า
  - [ ] `/bookings` — จัดการคิว
  - [ ] `/catalog` — บริการ & แพ็กเกจ
  - [ ] `/settings` — ตั้งค่าร้าน
  - [ ] `/admin` — Super Admin Dashboard
  - [ ] `/admin/tenants` — รายการร้านค้า
  - [ ] `/admin/tenants/:id` — รายละเอียดร้านค้า

### 1.3 Login & Registration Page
- [ ] ปรับหน้า Login ให้รองรับ Email/Password (นอกเหนือจาก Google)
- [ ] เพิ่มปุ่ม "สมัครใช้งาน / สร้างร้านค้าใหม่"
- [ ] สร้างหน้า Registration (email + password + ยืนยัน)
- [ ] หลัง Register สำเร็จ → ส่งไป Onboarding

### 1.4 Store Onboarding Wizard
- [ ] สร้าง `src/pages/OnboardingWizard.tsx`
- [ ] Step 1: ข้อมูลร้านค้า (ชื่อร้าน, เบอร์โทร, ที่อยู่)
- [ ] Step 2: เวลาทำการ (ใช้ `BusinessHoursManager` component เดิม)
- [ ] Step 3: เลือกแผนบริการ (Free Trial / Basic / Pro) — UI เท่านั้น
- [ ] Step 4: ยืนยัน → สร้าง Tenant doc + User doc + ShopConfig
- [ ] Redirect ไปหน้า Dashboard หลังสร้างสำเร็จ

### 1.5 Tenant Context Integration (ปรับโค้ดเดิมทั้งหมด)
- [ ] ปรับ `App.tsx` — ทุก Firestore query เพิ่ม `where('tenantId', '==', tenantId)`
- [ ] ปรับ `App.tsx` — ทุก `addDoc()` เพิ่ม `tenantId` ลงใน document
- [ ] ปรับ `MemberDetails.tsx` — transaction/package queries เพิ่ม tenantId
- [ ] ปรับ `BookingManager.tsx` — booking queries เพิ่ม tenantId
- [ ] ปรับ `CustomerCard.tsx` — ดึง shopConfig จาก tenantId
- [ ] ปรับ `BookingForm.tsx` — booking create เพิ่ม tenantId
- [ ] ปรับ `PackageTemplatesManager.tsx` — queries เพิ่ม tenantId
- [ ] ปรับ `ServiceTemplatesManager.tsx` — queries เพิ่ม tenantId
- [ ] ปรับ `BusinessHoursManager.tsx` — shopConfig key เป็น tenantId
- [ ] ปรับ `MapPicker.tsx` — ไม่ต้องแก้ (ไม่มี Firestore query)

### 1.6 Super Admin Dashboard
- [ ] สร้าง `src/pages/admin/SuperAdminDashboard.tsx`
  - [ ] แสดง Stat Cards: จำนวนร้านค้า, ร้านค้า Active, ลูกค้ารวม, รายได้รวม
  - [ ] แสดงกราฟ: ร้านค้าใหม่ต่อสัปดาห์
- [ ] สร้าง `src/pages/admin/TenantList.tsx`
  - [ ] แสดงรายการร้านค้าทั้งหมดในรูปแบบตาราง/card
  - [ ] ค้นหาร้านค้าด้วยชื่อ
  - [ ] Filter ตาม subscription plan, status
- [ ] สร้าง `src/pages/admin/TenantDetail.tsx`
  - [ ] แสดงข้อมูลร้าน: ชื่อ, เจ้าของ, plan, สถานะ
  - [ ] แสดงจำนวนลูกค้า, การจอง, รายได้
  - [ ] ปุ่ม Enable/Disable ร้าน
- [ ] สร้าง Layout สำหรับ Super Admin (Sidebar แยกจาก Store)

### 1.7 Firestore Security Rules
- [ ] เขียน Security Rules ใหม่ตาม Multi-Tenant pattern
- [ ] เพิ่ม helper functions: `getUserTenantId()`, `getUserRole()`
- [ ] ทดสอบ Rules ด้วย Firestore Emulator

### 1.8 Backend (server.ts) Updates
- [ ] ปรับ `/api/simulate-line-follow` เพิ่ม tenantId
- [ ] ปรับ `/api/admin/diag` เพิ่ม tenantId filter
- [ ] เพิ่ม Auth middleware ตรวจสอบ Firebase ID Token
- [ ] เพิ่ม API: `GET /api/admin/tenants` (Super Admin only)
- [ ] เพิ่ม API: `PATCH /api/admin/tenants/:tenantId` (Enable/Disable)

---

## Phase 2: Enhanced Features

### 2.1 Dynamic LINE Webhook
- [ ] ปรับ LINE webhook เป็น `/api/line-webhook/:tenantId`
- [ ] ดึง LINE credentials จาก `/tenants/{tenantId}` แบบ dynamic
- [ ] Validate LINE signature ด้วย secret ของแต่ละ tenant
- [ ] สร้าง UI ให้ Store Owner ตั้งค่า LINE credentials ในหน้า Settings
- [ ] แสดง Webhook URL ที่ร้านค้าต้องนำไปตั้งค่าใน LINE Developers

### 2.2 Staff Management
- [ ] สร้าง `src/pages/StaffManager.tsx`
- [ ] ฟอร์มเชิญพนักงาน (ส่ง Email invitation)
- [ ] แสดงรายชื่อพนักงาน + สถานะ invitation
- [ ] ลบพนักงาน / เพิกถอนสิทธิ์
- [ ] พนักงานกดลิงก์ invitation → สร้างบัญชี → ผูกเข้า tenant

### 2.3 Theming & White-Label
- [ ] เพิ่มฟิลด์ `theme.primaryColor` ใน ShopConfig
- [ ] สร้าง Color Picker ในหน้า Settings
- [ ] ปรับ CSS variables (`--color-primary`) ให้ dynamic ตาม tenant
- [ ] เพิ่มฟิลด์ `theme.logo` — อัปโหลดโลโก้ไปยัง Firebase Storage
- [ ] ปรับ CustomerCard, Sidebar, Login ให้ใช้ dynamic theme

### 2.4 Subscription & Payment
- [ ] สร้าง Subscription UI (เลือก plan, ดูสถานะ, ยกเลิก)
- [ ] เพิ่ม middleware ตรวจสอบ subscription status
- [ ] แสดง warning เมื่อ trial ใกล้หมดอายุ
- [ ] สร้างหน้า Billing สำหรับ Store Owner
- [ ] (Optional) Integrate กับ Stripe หรือ PromptPay

---

## Phase 3: Scale & Growth

### 3.1 LINE LIFF App
- [ ] สร้าง LIFF entry point ที่ `/liff/:tenantId`
- [ ] ใช้ LIFF SDK ดึง LINE userId → ค้นหา member ใน tenant
- [ ] แสดง CustomerCard + BookingForm ใน LIFF

### 3.2 Advanced Analytics
- [ ] รายงานรายได้ (วัน/สัปดาห์/เดือน) per tenant
- [ ] Top 10 Services, Top 10 Customers
- [ ] Retention Rate, Visit Frequency

### 3.3 Notification System
- [ ] LINE Push Message: แจ้งยืนยันคิว, แจ้งแต้มที่ได้รับ
- [ ] Email Notification: สรุปรายวัน/รายสัปดาห์ ให้ Store Owner

---

## Non-Feature Tasks

### Testing
- [ ] เขียน Unit Tests สำหรับ TenantContext
- [ ] เขียน Integration Tests สำหรับ Security Rules
- [ ] ทดสอบ Multi-tenant isolation (สร้าง 2 tenants, ตรวจสอบว่าข้อมูลไม่ cross)

### DevOps
- [ ] ตั้งค่า GitHub Actions CI/CD
- [ ] สร้าง staging environment
- [ ] สร้าง database migration script (ย้ายข้อมูลเดิมจาก single-tenant)

### Documentation
- [ ] อัปเดต README.md
- [ ] เขียน User Guide สำหรับ Store Owner
- [ ] เขียน API Documentation
