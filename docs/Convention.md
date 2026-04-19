# 📐 Convention — NailSaaS Coding Standards

> **Version:** 1.0  
> **Date:** 2026-04-19

---

## 1. ภาษาและการตั้งชื่อ (Language & Naming)

### 1.1 Code Language

| สิ่งที่เขียน | ภาษาที่ใช้ | ตัวอย่าง |
|------------|-----------|---------|
| ชื่อตัวแปร, ฟังก์ชัน, interface | **English** | `handleAddMember`, `tenantId` |
| UI Labels, ข้อความบนหน้าจอ | **ภาษาไทย** | `"ลงทะเบียนลูกค้าใหม่"` |
| Comments | **English** (preferred) | `// Fetch members for this tenant` |
| Commit messages | **English** | `feat: add multi-tenant support` |
| Docs (PRD, Architecture) | **ภาษาไทย + English ปน** | ตามความเหมาะสม |

### 1.2 Naming Conventions

```typescript
// Components — PascalCase
MemberDetails.tsx
BookingManager.tsx
SuperAdminDashboard.tsx

// Hooks — camelCase with "use" prefix
useAuth.ts
useTenant.ts
useFirestoreQuery.ts

// Contexts — PascalCase with "Context" suffix
AuthContext.tsx
TenantContext.tsx

// Interfaces/Types — PascalCase
interface Member { ... }
interface Tenant { ... }
type UserRole = 'super_admin' | 'store_owner' | 'staff';

// enum — PascalCase with UPPER_CASE values
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
}

// Files — PascalCase for components, camelCase for utilities
PascalCase:  MemberDetails.tsx, OnboardingWizard.tsx
camelCase:   firebase.ts, types.ts, useAuth.ts

// Firestore collections — camelCase (plural)
members, packages, transactions, tenants

// Firestore fields — camelCase
tenantId, createdAt, lineUserId, totalSessions
```

---

## 2. File Organization

### 2.1 Directory Rules

```
src/
├── components/   → Reusable UI components (ไม่มี business logic หนัก)
├── pages/        → Page-level components (มี data fetching)
├── contexts/     → React Contexts (global state)
├── hooks/        → Custom React Hooks
├── guards/       → Route protection components
├── layouts/      → Page layout wrappers (sidebar, header)
├── types.ts      → All TypeScript interfaces & types
└── firebase.ts   → Firebase initialization & helpers
```

### 2.2 Component File Rules

- **1 component ต่อ 1 file** (ยกเว้น sub-components ขนาดเล็กเช่น `NavBtn`, `StatCard`)
- **ทุก component export เป็น named export** (ไม่ใช้ `export default` ยกเว้น `App.tsx`)
- **Props interface ต้องอยู่ในไฟล์เดียวกับ component** หรือใน `types.ts` ถ้าใช้ร่วมกัน

```typescript
// ✅ Good
export const MemberDetails: React.FC<MemberDetailsProps> = ({ ... }) => { ... };

// ❌ Bad
export default function MemberDetails() { ... }
```

### 2.3 Import Order

```typescript
// 1. React & React libraries
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// 2. Third-party libraries
import { Users, Settings } from 'lucide-react';

// 3. Internal: contexts & hooks
import { useTenant } from '../hooks/useTenant';
import { useAuth } from '../hooks/useAuth';

// 4. Internal: components
import { MemberDetails } from '../components/MemberDetails';

// 5. Internal: types & utilities
import { Member, Tenant } from '../types';
import { db, collection, query, where } from '../firebase';
```

---

## 3. Firestore Conventions

### 3.1 ทุก Query ต้องมี tenantId

```typescript
// ✅ Good — ใส่ tenantId ทุกครั้ง
const q = query(
  collection(db, 'members'),
  where('tenantId', '==', tenantId),
  orderBy('createdAt', 'desc')
);

// ❌ Bad — ลืม tenantId (จะเห็นข้อมูลทุกร้าน!)
const q = query(
  collection(db, 'members'),
  orderBy('createdAt', 'desc')
);
```

### 3.2 ทุก Document ที่สร้างต้องมี tenantId

```typescript
// ✅ Good
await addDoc(collection(db, 'members'), {
  tenantId,          // ★ ต้องมีเสมอ
  name: 'สมศรี',
  phone: '0891234567',
  points: 0,
  tier: 'Bronze',
  createdAt: serverTimestamp(),
});

// ❌ Bad — ลืมใส่ tenantId
await addDoc(collection(db, 'members'), {
  name: 'สมศรี',
  // tenantId ไม่ได้ใส่!
});
```

### 3.3 Error Handling

```typescript
// ใช้ handleFirestoreError ทุกครั้งที่มี Firestore operation
try {
  await addDoc(collection(db, 'members'), newMember);
} catch (err) {
  handleFirestoreError(err, OperationType.CREATE, 'members');
}
```

### 3.4 Timestamps

```typescript
// ใช้ serverTimestamp() สำหรับ createdAt, updatedAt, lastVisit
createdAt: serverTimestamp(),

// ไม่ใช้ new Date() โดยตรง (เพราะอาจไม่ตรงกับเวลา server)
// ❌ createdAt: new Date().toISOString()
```

---

## 4. Styling Conventions (Tailwind CSS v4)

### 4.1 Class Order

```html
<!-- ลำดับ class: layout → sizing → spacing → colors → effects → responsive -->
<div className="
  flex items-center                    // layout
  w-full h-12                         // sizing
  px-6 py-3 gap-4                     // spacing
  bg-white text-text-main             // colors
  border border-border rounded-2xl    // borders
  shadow-sm                           // effects
  transition-all hover:bg-bg          // interactions
  md:w-64                             // responsive
">
```

### 4.2 ใช้ Design Token เสมอ

```html
<!-- ✅ Good — ใช้ token จาก @theme -->
<div className="text-primary bg-accent-soft border-border">

<!-- ❌ Bad — ใช้ค่าตรง ๆ -->
<div className="text-[#C89595] bg-[#FDF5E6] border-[#E8E1DF]">
```

### 4.3 Component Classes ที่มีอยู่แล้ว

```
.glass-card    → ใช้สำหรับ card ทุกประเภท
.btn-primary   → ปุ่มหลัก (สี primary)
.btn-secondary → ปุ่มรอง (สีขาว + border)
.input-field   → input / select / textarea
.sidebar-item  → menu item ใน sidebar
```

### 4.4 Responsive Design

```
sm:  → 640px   (Mobile landscape)
md:  → 768px   (Tablet)
lg:  → 1024px  (Desktop)
xl:  → 1280px  (Large desktop)
```

---

## 5. Component Patterns

### 5.1 Page Component Pattern

```typescript
// src/pages/store/Dashboard.tsx
import { useTenant } from '../../hooks/useTenant';

export const Dashboard: React.FC = () => {
  const { tenantId, shopConfig } = useTenant();
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'members'),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => { ... });
    return () => unsub();
  }, [tenantId]);

  return ( ... );
};
```

### 5.2 Guard Component Pattern

```typescript
// src/guards/RoleGuard.tsx
export const RoleGuard: React.FC<{
  allowedRoles: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { userRole } = useAuth();
  
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};
```

### 5.3 Context Pattern

```typescript
// src/contexts/TenantContext.tsx
const TenantContext = createContext<TenantContextValue | null>(null);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // fetch tenant data, provide via context
  return (
    <TenantContext.Provider value={{ tenantId, tenantData, shopConfig }}>
      {children}
    </TenantContext.Provider>
  );
};

// Hook
export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant must be used within TenantProvider');
  return ctx;
};
```

---

## 6. Git Conventions

### 6.1 Commit Message Format

```
<type>: <description>

Types:
  feat:     ฟีเจอร์ใหม่
  fix:      แก้บัก
  refactor: ปรับโครงสร้างโค้ด (ไม่เปลี่ยน behavior)
  style:    แก้ CSS, formatting
  docs:     อัปเดตเอกสาร
  chore:    งานอื่น ๆ (dependencies, config)
  test:     เพิ่ม/แก้ test

Examples:
  feat: add TenantContext and multi-tenant query support
  fix: prevent cross-tenant data access in members query
  refactor: extract Dashboard logic from App.tsx into separate page
  docs: update Architecture.md with LINE webhook flow
```

### 6.2 Branch Strategy

```
main           → Production-ready code
develop        → Integration branch
feat/*         → Feature branches (e.g., feat/multi-tenant)
fix/*          → Bug fix branches
```

---

## 7. Security Rules

### 7.1 ห้ามเก็บ Secrets ในโค้ด

```typescript
// ❌ NEVER
const lineToken = "abc123xyz";

// ✅ ใช้ Environment Variables
const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

// ✅ ใช้ Firestore (encrypted at rest)
const tenantDoc = await db.collection('tenants').doc(tenantId).get();
const { lineConfig } = tenantDoc.data();
```

### 7.2 Tenant Isolation Checklist

ก่อน merge PR ที่มี Firestore query ใหม่ ให้ตรวจสอบ:

- [ ] มี `where('tenantId', '==', tenantId)` ใน query หรือไม่?
- [ ] `addDoc()` / `setDoc()` มีฟิลด์ `tenantId` หรือไม่?
- [ ] ถ้าเป็น server-side, มีการ validate tenantId จาก Auth token หรือไม่?
- [ ] Security Rules ครอบคลุม collection นี้หรือไม่?

---

## 8. Performance Guidelines

### 8.1 Firestore Query Optimization

```typescript
// ✅ ใช้ limit() เมื่อไม่ต้องการข้อมูลทั้งหมด
const q = query(
  collection(db, 'members'),
  where('tenantId', '==', tenantId),
  orderBy('createdAt', 'desc'),
  limit(50)  // ← ไม่ดึงเกินจำเป็น
);

// ✅ ใช้ composite index สำหรับ query ที่มี where + orderBy
// ดู Architecture.md > Section 2.3

// ❌ หลีกเลี่ยง getDocs() ใน loop
for (const member of members) {
  await getDocs(query(collection(db, 'packages'), where('memberId', '==', member.id)));
  // → ทำให้ช้า, ใช้ onSnapshot แทน
}
```

### 8.2 React Performance

```typescript
// ✅ ใช้ React.memo สำหรับ component ที่ re-render บ่อย
export const MemberCard = React.memo<MemberCardProps>(({ member }) => { ... });

// ✅ cleanup onSnapshot ใน useEffect return
useEffect(() => {
  const unsub = onSnapshot(q, callback);
  return () => unsub();  // ← สำคัญ! ป้องกัน memory leak
}, [tenantId]);
```
