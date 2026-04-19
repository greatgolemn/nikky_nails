import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, Zap, Check, AlertCircle } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';

export const BillingPage: React.FC = () => {
  const { tenant } = useTenant();

  if (!tenant) return null;

  const { subscription } = tenant;
  const isTrial = subscription.plan === 'trial';
  
  // Calculate days remaining simply
  let daysRemaining = 0;
  if (subscription.expiresAt) {
    const msDiff = subscription.expiresAt.toDate().getTime() - new Date().getTime();
    daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="flex items-center gap-4 mb-8 px-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <CreditCard size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold">แพ็กเกจและการชำระเงิน</h2>
          <p className="text-sm text-text-muted">จัดการแผนการใช้งานและดูสถานะแพ็กเกจของร้านคุณ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Current Plan Overview */}
        <div className="glass-card p-8 border-t-4 border-t-primary relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Zap size={100} />
          </div>
          <h3 className="text-xs uppercase font-bold text-text-muted mb-2 tracking-widest">แผนการใช้งานปัจจุบัน</h3>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-black text-text-main capitalize">
              {subscription.plan}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {subscription.status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-4 mb-8 text-sm">
            <div className="flex justify-between pb-3 border-b border-border/50">
              <span className="text-text-muted">จำนวนสมาชิกสูงสุด</span>
              <span className="font-bold">{subscription.maxMembers} บัญชี</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-border/50">
              <span className="text-text-muted">เริ่มต้นเมื่อ</span>
              <span className="font-bold">{subscription.startedAt?.toDate().toLocaleDateString('th-TH')}</span>
            </div>
            {subscription.expiresAt && (
              <div className="flex justify-between pb-3 border-b border-border/50 text-orange-600">
                <span className="font-bold flex items-center gap-2"><AlertCircle size={14}/> วันหมดอายุ</span>
                <span className="font-bold">{subscription.expiresAt.toDate().toLocaleDateString('th-TH')} (เหลือ {daysRemaining} วัน)</span>
              </div>
            )}
          </div>

          {isTrial && (
            <button className="w-full btn-primary py-3 shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
              <Zap size={16} /> อัปเกรดเป็น Basic Plan
            </button>
          )}
        </div>

        {/* Upgrade / Pricing Display (Mockup for UX) */}
        <div className="glass-card p-8 flex flex-col items-center justify-center text-center">
            <div className="w-full p-6 bg-accent-soft/30 rounded-3xl border border-primary/20 space-y-4">
               <h4 className="font-bold text-lg text-primary">Basic Plan</h4>
               <p className="text-3xl font-black">฿990<span className="text-sm font-normal text-text-muted"> / เดือน</span></p>
               <ul className="text-left text-sm space-y-3 mt-6">
                 <li className="flex items-center gap-2"><Check size={16} className="text-[#06C755]"/> พนักงานไม่จำกัด</li>
                 <li className="flex items-center gap-2"><Check size={16} className="text-[#06C755]"/> ตั้งค่า LINE Webhook</li>
                 <li className="flex items-center gap-2"><Check size={16} className="text-[#06C755]"/> สร้างและปรับแต่งธีมร้านค้า</li>
               </ul>
               <button className="w-full mt-6 py-2.5 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary hover:text-white transition-colors">
                  เลือกแพ็กเกจนี้
               </button>
            </div>
        </div>

      </div>
    </motion.div>
  );
};
