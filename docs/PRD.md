# 📋 PRD — NailSaaS: ระบบ CRM สำหรับร้านทำเล็บแบบ Multi-Tenant

> **Version:** 1.0  
> **Author:** Project Owner (greatgolemn)  
> **Date:** 2026-04-19  
> **Status:** Draft — Pending Approval

---

## 1. ภาพรวมโปรเจกต์ (Product Overview)

### 1.1 ปัญหา (Problem Statement)
ร้านทำเล็บขนาดเล็ก-กลางในประเทศไทยส่วนใหญ่ยังไม่มีระบบ CRM ที่ใช้งานง่าย ราคาไม่แพง และรองรับฟีเจอร์สำคัญอย่างการเชื่อมต่อ LINE Official Account, ระบบสะสมแต้ม, แพ็กเกจเหมาจ่าย และการจองคิวออนไลน์ ระบบ CRM ที่มีอยู่ในตลาดมักมีราคาสูง ซับซ้อนเกินไป หรือไม่ได้ออกแบบมาเพื่อธุรกิจร้านเล็บโดยเฉพาะ

### 1.2 วิสัยทัศน์ (Vision)
สร้างแพลตฟอร์ม **SaaS (Software as a Service)** ที่เจ้าของร้านทำเล็บสามารถสมัครใช้งาน ตั้งค่าร้านของตนเอง และเริ่มใช้ระบบ CRM ได้ทันที — โดยไม่ต้องมีความรู้ด้านเทคนิค

### 1.3 เป้าหมายหลัก (Goals)
| # | เป้าหมาย | ตัวชี้วัด (KPI) |
|---|---------|----------------|
| 1 | แปลง Single-tenant เป็น Multi-tenant | 1 Firebase project รองรับ ≥100 ร้านค้า |
| 2 | ระบบ Onboarding สำหรับเจ้าของร้านใหม่ | สมัคร → ใช้งานได้ภายใน < 5 นาที |
| 3 | ระบบ Super Admin สำหรับเจ้าของแพลตฟอร์ม | จัดการร้านค้า, ดูสถิติรวม, ระงับบัญชี |
| 4 | รายได้จากค่าบริการรายเดือน | มี Subscription Tier อย่างน้อย 2 ระดับ |
| 5 | LINE Integration ที่แยกอิสระต่อร้าน | แต่ละร้านมี LINE Webhook ของตัวเอง |

---

## 2. กลุ่มผู้ใช้งาน (User Personas)

### 2.1 🦸 Super Admin (เจ้าของแพลตฟอร์ม)
- **คือใคร:** คุณ (ผู้พัฒนาและเจ้าของระบบ)
- **ต้องการ:** ดูภาพรวมร้านค้าทั้งหมด, จัดการ Subscription, ระงับ/เปิดบัญชี, ดูรายได้รวม
- **Pain Point:** ต้องจัดการหลายร้านโดยไม่ให้ข้อมูลปนกัน

### 2.2 👩‍💼 Store Owner (เจ้าของร้านทำเล็บ)
- **คือใคร:** เจ้าของเดี่ยวหรือหุ้นส่วนร้านทำเล็บ
- **ต้องการ:** สมัครเปิดร้าน, ตั้งค่าข้อมูลร้าน, เชื่อม LINE, จัดการบริการ/แพ็กเกจ, ดูรายงาน
- **Pain Point:** ไม่มีความรู้ด้านเทคโนโลยี อยากได้ระบบที่คลิก ๆ แล้วใช้ได้เลย

### 2.3 👷 Staff (พนักงานร้าน)
- **คือใคร:** ช่างทำเล็บหรือพนักงานรับลูกค้า
- **ต้องการ:** ค้นหาลูกค้า, สะสมแต้ม, ตัดรอบแพ็กเกจ, ดูตารางจองคิว
- **Pain Point:** ไม่อยากใช้อะไรยุ่งยาก อยากได้หน้าจอที่กดง่าย ๆ

### 2.4 💅 End Customer (ลูกค้าร้านทำเล็บ)
- **คือใคร:** คนที่มาใช้บริการร้านทำเล็บ
- **ต้องการ:** ดูแต้มสะสม, จองคิว, ดูสาขาร้าน ผ่าน LINE LIFF หรือ WebApp
- **Pain Point:** ไม่อยากโหลดแอปใหม่ อยากใช้ผ่าน LINE ที่มีอยู่แล้ว

---

## 3. ฟีเจอร์หลัก (Core Features)

### 3.1 Phase 1 — Multi-Tenant Foundation (MVP)

#### F1.1: ระบบ Authentication & Role Management
- สมัครสมาชิกด้วย Email/Password หรือ Google
- กำหนดบทบาท: `super_admin`, `store_owner`, `staff`
- Auto-assign `store_owner` เมื่อสมัครร้านค้าใหม่
- เจ้าของร้านเชิญพนักงานเข้าร่วมร้าน (Invite System)

#### F1.2: Tenant Isolation (การแยกข้อมูลร้านค้า)
- ทุก Collection ใน Firestore มี `tenantId` กำกับ
- Firestore Security Rules บังคับ filter ด้วย `tenantId`
- ผู้ใช้ไม่สามารถเข้าถึงข้อมูลของ Tenant อื่นได้

#### F1.3: Store Onboarding Flow
- หน้า Landing Page สำหรับสมัครใช้งาน
- ฟอร์มตั้งค่าร้าน: ชื่อร้าน, เบอร์โทร, ที่อยู่, เวลาทำการ
- เลือกแพลนบริการ (Free Trial / Basic / Pro)
- เมื่อกดยืนยัน → สร้าง Tenant document, shopConfig, ค่าเริ่มต้นให้อัตโนมัติ

#### F1.4: Super Admin Dashboard
- ดูจำนวนร้านค้าทั้งหมด, ร้านค้าใหม่, ร้านค้าที่ Active/Inactive
- ดูรายได้รวมจาก Subscription
- Enable/Disable ร้านค้า
- ดูสถิติการใช้งาน (DAU, จำนวน Members ทั้งระบบ)

### 3.2 Phase 2 — Enhanced Features

#### F2.1: Dynamic LINE Webhook
- แต่ละร้านตั้งค่า LINE Channel Access Token / Secret ของตัวเอง
- Webhook URL แบบ Dynamic: `/api/line-webhook/:tenantId`
- Auto Sign-up จาก LINE ลงใน Tenant ที่ถูกต้อง

#### F2.2: Subscription & Payment
- Tier System:
  - **Free Trial:** 14 วัน, จำกัด 50 ลูกค้า
  - **Basic:** ฿499/เดือน, 500 ลูกค้า, ไม่มี LINE Integration
  - **Pro:** ฿1,499/เดือน, ไม่จำกัดลูกค้า, LINE Integration + รายงาน
- Integration กับ Stripe / PromptPay / บัตรเครดิต
- ระบบตรวจสอบ Subscription status ก่อนเข้าใช้งาน

#### F2.3: Theming & White-Label
- ร้านค้าตั้งค่าโทนสีหลัก (Primary Color) ของตัวเอง
- อัปโหลดโลโก้ร้าน
- Customer Card บนมือถือแสดงแบรนด์ของร้านนั้น ๆ

### 3.3 Phase 3 — Scale & Growth

#### F3.1: LINE LIFF App สำหรับลูกค้า
- สร้าง LIFF (LINE Front-end Framework) ให้ลูกค้าเปิดดูแต้ม, จองคิว ผ่าน LINE ได้เลย

#### F3.2: Analytics & Reports
- รายงานรายได้ประจำวัน/สัปดาห์/เดือน
- Top Services / Top Customers
- Retention Rate, Churn Rate

#### F3.3: Notification System
- ส่ง LINE Push Message แจ้งเตือนคิว, แจ้งเตือนแต้มใกล้หมดอายุ
- Email Notification สำหรับ Store Owner

---

## 4. ข้อจำกัดทางเทคนิค (Technical Constraints)

| หัวข้อ | รายละเอียด |
|--------|-----------|
| **Database** | Firebase Firestore (ใช้ต่อจาก project เดิม `boanoi`) |
| **Auth** | Firebase Authentication (Google + Email/Password) |
| **Frontend** | React 19 + Vite + Tailwind CSS v4 |
| **Backend** | Express.js (Node.js) — ไฟล์ `server.ts` |
| **Hosting** | Firebase Hosting / Cloud Run |
| **State Management** | React useState + Firestore onSnapshot (Real-time) |
| **LINE SDK** | @line/bot-sdk v11 |

---

## 5. Non-Functional Requirements

| หัวข้อ | ความต้องการ |
|--------|-----------|
| **Performance** | Dashboard โหลดภายใน < 2 วินาที |
| **Security** | Tenant isolation 100%, ไม่มี data leak ข้าม Tenant |
| **Scalability** | รองรับ ≥100 ร้านค้า บน 1 Firebase Project |
| **Usability** | เจ้าของร้านสมัคร + ตั้งค่าเสร็จภายใน 5 นาที |
| **Language** | UI ภาษาไทยเป็นหลัก, รองรับ English เป็น Phase 2 |
| **Mobile** | Responsive Design — ใช้งานบนมือถือได้ดี |

---

## 6. Release Plan (Phased Rollout)

```
Phase 1 (MVP) — ~4–6 สัปดาห์
├── Multi-tenant Database
├── Auth & Role System
├── Store Onboarding
├── Super Admin Dashboard
└── ปรับ UI ทั้งหมดให้ใช้ tenantId

Phase 2 — ~3–4 สัปดาห์
├── Dynamic LINE Webhook
├── Subscription & Payment
├── Theming & White-label
└── Invite Staff System

Phase 3 — ~4–6 สัปดาห์
├── LINE LIFF App
├── Advanced Analytics
├── Push Notifications
└── Multi-language Support
```

---

## 7. Success Metrics (ตัววัดความสำเร็จ)

| ตัวชี้วัด | เป้าหมาย Phase 1 | เป้าหมาย Phase 2 |
|----------|-------------------|-------------------|
| จำนวนร้านค้าที่สมัคร | ≥ 5 ร้าน | ≥ 30 ร้าน |
| Store Owner Retention | ≥ 70% หลัง 30 วัน | ≥ 80% |
| ร้านค้าที่เชื่อม LINE | — | ≥ 50% ของ Pro plan |
| Monthly Recurring Revenue | ≥ ฿5,000 | ≥ ฿30,000 |

---

## 8. Risks & Mitigations

| ความเสี่ยง | ผลกระทบ | แนวทางแก้ไข |
|-----------|---------|------------|
| Firestore ราคาแพงเมื่อข้อมูลมาก | สูง | ออกแบบ Query ให้มีประสิทธิภาพ, ใช้ Composite Index |
| Data leak ข้าม Tenant | วิกฤต | Security Rules + Server-side validation ซ้ำซ้อน |
| LINE API rate limit | ปานกลาง | Queue system สำหรับ Push Messages |
| เจ้าของร้านใช้ไม่เป็น | สูง | สร้าง Onboarding wizard + Tutorial ในตัว |
