import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Store, Phone, Clock, CreditCard, ChevronRight, ChevronLeft, Check, Gem, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, setDoc, addDoc, collection, serverTimestamp } from '../firebase';
import { BusinessHoursManager } from '../components/BusinessHoursManager';
import { SubscriptionPlan } from '../types';

const DEFAULT_BUSINESS_HOURS = [
  { day: 'วันจันทร์', open: '10:00', close: '20:00', isOpen: true },
  { day: 'วันอังคาร', open: '10:00', close: '20:00', isOpen: true },
  { day: 'วันพุธ', open: '10:00', close: '20:00', isOpen: true },
  { day: 'วันพฤหัสบดี', open: '10:00', close: '20:00', isOpen: true },
  { day: 'วันศุกร์', open: '10:00', close: '20:00', isOpen: true },
  { day: 'วันเสาร์', open: '10:00', close: '20:00', isOpen: true },
  { day: 'วันอาทิตย์', open: '10:00', close: '20:00', isOpen: false },
];

const PLANS: { id: SubscriptionPlan; name: string; price: string; features: string[]; highlight?: boolean }[] = [
  {
    id: 'trial',
    name: 'ทดลองใช้ฟรี',
    price: '฿0 / 14 วัน',
    features: ['ลูกค้าสูงสุด 50 ราย', 'ระบบจองคิว', 'ระบบแต้มสะสม', 'ไม่เชื่อมต่อ LINE'],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '฿499 / เดือน',
    features: ['ลูกค้าสูงสุด 500 ราย', 'ระบบจองคิว', 'ระบบแต้มสะสม + แพ็กเกจ', 'รายงานเบื้องต้น'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '฿1,499 / เดือน',
    features: ['ลูกค้าไม่จำกัด', 'เชื่อมต่อ LINE OA', 'ระบบสมาชิกอัตโนมัติ', 'รายงานขั้นสูง', 'White-label (โลโก้ + สีร้าน)'],
    highlight: true,
  },
];

export const OnboardingWizard: React.FC = () => {
  const { firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [businessHours, setBusinessHours] = useState(DEFAULT_BUSINESS_HOURS);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('trial');

  const handleFinish = async () => {
    if (!firebaseUser) return;
    setIsSubmitting(true);

    try {
      // 1. Create tenant document
      const tenantRef = doc(collection(db, 'tenants'));
      const tenantId = tenantRef.id;

      const now = serverTimestamp();
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + 14);

      await setDoc(tenantRef, {
        shopName,
        shopPhone,
        ownerId: firebaseUser.uid,
        subscription: {
          plan: selectedPlan,
          status: 'active',
          maxMembers: selectedPlan === 'pro' ? 999999 : selectedPlan === 'basic' ? 500 : 50,
          startedAt: now,
          expiresAt: selectedPlan === 'trial' ? trialExpiry : null,
        },
        theme: {
          primaryColor: '#C89595',
        },
        isActive: true,
        createdAt: now,
      });

      // 2. Create user profile document
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email: firebaseUser.email,
        displayName: shopName || firebaseUser.displayName || firebaseUser.email,
        role: 'store_owner',
        tenantId,
        createdAt: now,
      });

      // 3. Create shopConfig document (keyed by tenantId)
      await setDoc(doc(db, 'shopConfig', tenantId), {
        shopName,
        shopPhone,
        businessHours,
      });

      // Done — navigate to dashboard
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Onboarding error:', err);
      alert('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return shopName.trim().length > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] bg-[radial-gradient(circle_at_top_right,_#c4a48420,_transparent)] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full glass-card rounded-[40px] overflow-hidden"
      >
        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center rotate-6">
                <Gem size={20} />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold">ตั้งค่าร้านของคุณ</h1>
                <p className="text-[10px] text-text-muted uppercase tracking-widest font-bold">ขั้นตอนที่ {step} จาก 3</p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${step >= s ? 'bg-primary' : 'bg-border'}`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Shop Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Store size={20} />
                  </div>
                  <h2 className="text-lg font-bold">ข้อมูลร้านค้า</h2>
                </div>

                <div>
                  <label className="text-xs uppercase font-bold text-text-muted mb-2 block">ชื่อร้านค้า *</label>
                  <input
                    type="text"
                    placeholder="เช่น Nikki Nail Studio"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="input-field w-full"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs uppercase font-bold text-text-muted mb-2 block">เบอร์โทรศัพท์ร้าน</label>
                  <input
                    type="tel"
                    placeholder="08x-xxx-xxxx"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="input-field w-full"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Business Hours */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Clock size={20} />
                  </div>
                  <h2 className="text-lg font-bold">เวลาทำการ</h2>
                </div>

                <BusinessHoursManager
                  businessHours={businessHours}
                  isEditing={true}
                  onUpdate={setBusinessHours}
                />
              </motion.div>
            )}

            {/* Step 3: Plan Selection */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <CreditCard size={20} />
                  </div>
                  <h2 className="text-lg font-bold">เลือกแพลนบริการ</h2>
                </div>

                <div className="space-y-4">
                  {PLANS.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full text-left p-6 rounded-3xl border transition-all ${
                        selectedPlan === plan.id
                          ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                          : 'border-border bg-white hover:border-primary/30'
                      } ${plan.highlight ? 'ring-2 ring-primary/20' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-base">{plan.name}</h3>
                          {plan.highlight && (
                            <span className="text-[9px] bg-primary text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                              <Sparkles size={10} /> แนะนำ
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-primary">{plan.price}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {plan.features.map((f, i) => (
                          <span key={i} className="text-[10px] bg-bg text-text-muted px-2.5 py-1 rounded-lg font-medium">
                            {f}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/40">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 text-sm text-text-muted hover:text-primary font-bold transition-colors"
              >
                <ChevronLeft size={16} /> ย้อนกลับ
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="btn-primary flex items-center gap-2 !px-8"
              >
                ถัดไป <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={isSubmitting || !canProceed()}
                className="btn-primary flex items-center gap-2 !px-8 !bg-green-500 hover:!bg-green-600 shadow-lg shadow-green-500/20"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Check size={16} /> เปิดร้านเลย!
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
