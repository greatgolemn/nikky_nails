# 🛠️ Skill Map — NailSaaS Technical Reference

> **Version:** 1.0  
> **Date:** 2026-04-19

---

## 1. Tech Stack & Dependencies

### 1.1 Frontend (Client-Side)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI Framework |
| **Vite** | 6.2+ | Build Tool & Dev Server |
| **TypeScript** | 5.8+ | Type Safety |
| **Tailwind CSS** | 4.x | Utility-First Styling |
| **Framer Motion** | (via `motion/react`) | Animations & Page Transitions |
| **React Router** | 7.x (จะติดตั้ง) | Client-Side Routing |
| **Lucide React** | Latest | Icon Library |
| **Recharts** | 3.x | Data Visualization (Charts) |
| **Leaflet + React-Leaflet** | 1.9 / 5.0 | Interactive Maps |
| **clsx + tailwind-merge** | Latest | Conditional CSS Class Utility |

### 1.2 Backend (Server-Side)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Express.js** | 4.x | HTTP Server & API Routes |
| **tsx** | 4.x | TypeScript Execution (Node) |
| **dotenv** | 17.x | Environment Variables |
| **@line/bot-sdk** | 11.x | LINE Messaging API |
| **firebase-admin** | 13.x | Server-Side Firestore Access |

### 1.3 Database & Auth

| Technology | Version | Purpose |
|------------|---------|---------|
| **Firebase Firestore** | 12.x (Web SDK) | NoSQL Database (Real-time) |
| **Firebase Auth** | 12.x | Authentication (Google, Email/Password) |
| **Firebase Storage** | 12.x (จะใช้) | File Upload (Logos, Images) |

---

## 2. Key Patterns in Current Codebase

### 2.1 Real-Time Data Sync (Firestore onSnapshot)

ระบบปัจจุบันใช้ `onSnapshot` เป็นหลักในการ sync data แบบ real-time ทุกครั้งที่มีการเปลี่ยนแปลงข้อมูลใน Firestore, UI จะอัปเดตทันที

```typescript
// Pattern ที่ใช้อยู่:
useEffect(() => {
  if (!user) return;
  const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Member[];
    setMembers(data);
  }, (err) => handleFirestoreError(err, OperationType.LIST, 'members'));
  return () => unsubscribe();
}, [user]);
```

**สิ่งที่ต้องปรับ:** เพิ่ม `where('tenantId', '==', tenantId)` ในทุก query

### 2.2 Error Handling Pattern

```typescript
// ใช้ handleFirestoreError จาก firebase.ts ทุกที่
try {
  await addDoc(collection(db, 'members'), newMember);
} catch (err) {
  handleFirestoreError(err, OperationType.CREATE, 'members');
}
```

### 2.3 Form Handling Pattern

ระบบใช้ native `FormData` API แทน controlled forms:

```typescript
const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const newMember = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    // ...
  };
  await addDoc(collection(db, 'members'), newMember);
};
```

### 2.4 Component Pattern

ทุก Component ใช้ `React.FC<Props>` + named export:

```typescript
interface MemberDetailsProps {
  member: Member;
  packages: Package[];
  // ...
}

export const MemberDetails: React.FC<MemberDetailsProps> = ({ member, packages }) => {
  // ...
};
```

### 2.5 Animation Pattern

ใช้ Framer Motion สำหรับ page transitions และ modal animation:

```typescript
// Page transition
<AnimatePresence mode="wait">
  <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    {/* content */}
  </motion.div>
</AnimatePresence>

// Modal
<motion.div 
  initial={{ scale: 0.9, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  className="glass-card"
>
```

---

## 3. Design System (CSS Architecture)

### 3.1 Theme Tokens (Tailwind CSS v4)

ไฟล์ `src/index.css` กำหนด Design Token ผ่าน `@theme`:

```css
@theme {
  /* Typography */
  --font-serif: "Kanit", sans-serif;
  --font-sans: "Prompt", sans-serif;

  /* Colors */
  --color-primary: #C89595;
  --color-primary-dark: #A67373;
  --color-primary-light: #E9D5D5;
  --color-accent: #D4AF37;
  --color-bg: #F9F7F5;
  --color-text-main: #2D2424;
  --color-text-muted: #8C7B7B;
  --color-border: #E8E1DF;
  --color-success: #34D399;
}
```

**สิ่งที่ต้องทำ (Multi-tenant Theming):** ทำให้ `--color-primary` เป็นค่า dynamic ที่เปลี่ยนได้ต่อร้านค้า โดยใช้ CSS Custom Properties ที่ถูก inject เข้ามาตาม shopConfig ของ tenant

### 3.2 Component Classes

```css
/* Reusable component classes */
.glass-card    → bg-white/80 backdrop-blur-md rounded-[40px] shadow-xl
.btn-primary   → bg-primary text-white rounded-2xl + hover/active states
.btn-secondary → bg-white border rounded-2xl
.input-field   → bg-white border rounded-2xl + focus ring
.sidebar-item  → flex items-center gap-4 px-6 py-4.5 rounded-3xl
```

### 3.3 Font Stack

- **หัวข้อ (h1-h6):** Kanit — ฟอนต์ไทยที่อ่านง่าย, ดูเป็นทางการ
- **เนื้อหาทั่วไป:** Prompt — ฟอนต์ไทยที่สวยงาม, อ่านสบาย
- **โค้ด/ตัวเลข:** JetBrains Mono — monospace ที่ชัดเจน

---

## 4. Firebase Configuration

### 4.1 Project Info

```json
{
  "projectId": "boanoi",
  "firestoreDatabaseId": "ai-studio-59f411db-82f3-4c27-ad0f-caf4881612ea"
}
```

> ⚠️ **หมายเหตุ:** ระบบใช้ Named Database ของ Firestore (ไม่ใช่ default) 
> ดังนั้น `getFirestore(app, databaseId)` ต้องระบุ databaseId เสมอ

### 4.2 Collections สำคัญ

| Collection | ใช้ทำอะไร | Primary Key |
|-----------|----------|-------------|
| `members` | ข้อมูลลูกค้า | Auto-gen |
| `packages` | แพ็กเกจที่ลูกค้าซื้อ | Auto-gen |
| `transactions` | ประวัติธุรกรรม | Auto-gen |
| `bookings` | การจองคิว | Auto-gen |
| `packageTemplates` | แม่แบบแพ็กเกจ | Auto-gen |
| `serviceTemplates` | แม่แบบบริการ | Auto-gen |
| `shopConfig` | ข้อมูลร้าน | Document ID = `"main"` → จะเปลี่ยนเป็น `tenantId` |
| `branches` | สาขาร้าน | Auto-gen |

### 4.3 Security Rules Summary (ปัจจุบัน)

- ใช้ `isAdmin()` ตรวจสอบ 2 แบบ: role จาก `/users/{uid}` หรือ email hardcode
- `isOwner()` ใช้เฉพาะ member ดูข้อมูลตัวเอง
- **ปัญหา:** ยังไม่มี tenant isolation

---

## 5. LINE Integration Knowledge

### 5.1 Current Setup

- ใช้ `@line/bot-sdk` v11
- Webhook endpoint: `POST /api/line-webhook`
- Events ที่ handle: `follow` (คนแอดเพื่อน)
- เมื่อมีคน follow → สร้าง member อัตโนมัติ + ส่งข้อความต้อนรับ

### 5.2 LINE Messaging API Key Concepts

```
Channel Access Token  → ใช้ส่งข้อความ (push/reply)
Channel Secret        → ใช้ verify webhook signature
Webhook URL           → URL ที่ LINE ส่ง event มาหา (ต้องเป็น HTTPS)
User ID               → รหัสเฉพาะของผู้ใช้ LINE ต่อ Channel
```

### 5.3 Multi-Tenant LINE Architecture

```
ร้าน A → LINE OA ร้าน A → Webhook: /api/line-webhook/tenant-a-id
ร้าน B → LINE OA ร้าน B → Webhook: /api/line-webhook/tenant-b-id
ร้าน C → LINE OA ร้าน C → Webhook: /api/line-webhook/tenant-c-id

แต่ละร้านมี Channel Access Token / Secret ของตัวเอง
เก็บใน /tenants/{tenantId}.lineConfig
```

---

## 6. Project Structure (Current → Target)

```
nickki-nail/
├── docs/                           ← NEW: เอกสารโปรเจกต์
│   ├── PRD.md
│   ├── Architecture.md
│   ├── Task.md
│   ├── Skill.md
│   └── Convention.md
│
├── src/
│   ├── App.tsx                     ← REFACTOR: เป็น Router + Layout
│   ├── main.tsx
│   ├── index.css
│   ├── firebase.ts                 ← ไม่ต้องแก้มาก
│   ├── types.ts                    ← เพิ่ม Tenant, UserProfile, etc.
│   │
│   ├── contexts/                   ← NEW
│   │   ├── AuthContext.tsx
│   │   └── TenantContext.tsx
│   │
│   ├── hooks/                      ← NEW
│   │   ├── useAuth.ts
│   │   ├── useTenant.ts
│   │   └── useFirestoreQuery.ts
│   │
│   ├── guards/                     ← NEW
│   │   ├── AuthGuard.tsx
│   │   └── RoleGuard.tsx
│   │
│   ├── layouts/                    ← NEW
│   │   ├── StoreLayout.tsx          (ดึงจาก App.tsx เดิม)
│   │   └── AdminLayout.tsx
│   │
│   ├── pages/                      ← NEW
│   │   ├── LoginPage.tsx
│   │   ├── OnboardingWizard.tsx
│   │   ├── store/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── MemberList.tsx
│   │   │   ├── BookingsPage.tsx
│   │   │   ├── CatalogPage.tsx
│   │   │   ├── SettingsPage.tsx
│   │   │   └── StaffManager.tsx
│   │   └── admin/
│   │       ├── SuperAdminDashboard.tsx
│   │       ├── TenantList.tsx
│   │       └── TenantDetail.tsx
│   │
│   └── components/                 ← EXISTING (ปรับเพิ่ม tenantId)
│       ├── BookingForm.tsx
│       ├── BookingManager.tsx
│       ├── BusinessHoursManager.tsx
│       ├── CRMCharts.tsx
│       ├── CustomerCard.tsx
│       ├── ErrorBoundary.tsx
│       ├── MapPicker.tsx
│       ├── MemberDetails.tsx
│       ├── PackageTemplatesManager.tsx
│       └── ServiceTemplatesManager.tsx
│
├── server.ts                       ← ปรับ routes + auth middleware
├── firestore.rules                 ← เขียนใหม่ (multi-tenant)
├── firebase-blueprint.json         ← อัปเดต schema
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 7. Useful Commands

```bash
# Development
npm run dev              # Start Express + Vite dev server (port 3000)
npm run build            # Build for production
npm run lint             # TypeScript type check

# Firebase
firebase deploy --only firestore:rules    # Deploy security rules
firebase emulators:start                  # Start local emulators

# Git
git add . && git commit -m "message" && git push
```
