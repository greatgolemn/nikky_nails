import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import liff from '@line/liff';
import { Loader2, AlertCircle } from 'lucide-react';
import { db, doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp } from '../../firebase';
import { ShopConfig, Member, ServiceTemplate, Branch } from '../../types';
import { CustomerCard } from '../../components/CustomerCard';
import { BookingForm } from '../../components/BookingForm';

export const LiffEntry: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tenantId = searchParams.get('tenantId');
  
  const [shopConfig, setShopConfig] = useState<ShopConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [lineProfile, setLineProfile] = useState<{ userId: string; displayName: string; pictureUrl?: string } | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [services, setServices] = useState<ServiceTemplate[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [phoneToLink, setPhoneToLink] = useState('');
  const [linking, setLinking] = useState(false);

  // 1. Fetch ShopConfig and inject theme
  useEffect(() => {
    if (!tenantId) {
      setError('ไม่พบรหัสร้านค้า (tenantId)');
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, 'shopConfig', tenantId));
        if (snap.exists()) {
          const config = snap.data() as ShopConfig;
          setShopConfig(config);
          if (config.theme?.primaryColor) {
            document.documentElement.style.setProperty('--color-primary', config.theme.primaryColor);
          }

          // Fetch Services & Branches
          const sQ = query(collection(db, 'serviceTemplates'), where('tenantId', '==', tenantId));
          const bQ = query(collection(db, 'branches'), where('tenantId', '==', tenantId));
          const [sSnap, bSnap] = await Promise.all([getDocs(sQ), getDocs(bQ)]);
          
          setServices(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceTemplate)));
          setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as Branch)));

        } else {
          setError('ร้านค้านี้ไม่มีอยู่ในระบบ');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการโหลดข้อมูลร้านค้า');
      }
    };
    fetchConfig();
  }, [tenantId]);

  // 2. Initialize LIFF
  useEffect(() => {
    if (!shopConfig) return; // Wait for config

    const initLiff = async () => {
      try {
        const liffId = (import.meta as any).env.VITE_MASTER_LIFF_ID || '16xxxxxx-xxxxxx';
        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile();
        setLineProfile({
          userId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl
        });

      } catch (err) {
        console.error('LIFF Init Error:', err);
        // For development outside of LINE, we'll mock a Line User
        if (process.env.NODE_ENV === 'development') {
           setLineProfile({
             userId: 'mock_line_user_123',
             displayName: 'Dev Tester',
           });
        } else {
           setError('ไม่สามารถเชื่อมต่อ LINE ได้ กรุณาเปิดผ่านแอปพลิเคชัน LINE');
        }
      }
    };

    initLiff();
  }, [shopConfig]);

  // 3. Find existing Member by lineUserId
  useEffect(() => {
    if (!tenantId || !lineProfile) return;

    const findMember = async () => {
      try {
        const q = query(
          collection(db, 'members'), 
          where('tenantId', '==', tenantId),
          where('lineUserId', '==', lineProfile.userId)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const mDoc = querySnapshot.docs[0];
          setMember({ id: mDoc.id, ...mDoc.data() } as Member);
        }
        setLoading(false);
      } catch (err) {
        console.error('Find member error:', err);
        setError('ไม่สามารถดึงข้อมูลสมาชิกได้');
        setLoading(false);
      }
    };
    findMember();
  }, [tenantId, lineProfile]);

  // 4. Handle Link Account (Phone match -> update, OR create new)
  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !lineProfile || !phoneToLink) return;
    
    setLinking(true);
    try {
      // Find if phone exists in this tenant
      const q = query(
        collection(db, 'members'),
        where('tenantId', '==', tenantId),
        where('phone', '==', phoneToLink)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        // Link to existing member
        const mDoc = snap.docs[0];
        await updateDoc(doc(db, 'members', mDoc.id), {
          lineUserId: lineProfile.userId,
          lineDisplayName: lineProfile.displayName
        });
        setMember({ id: mDoc.id, ...mDoc.data(), lineUserId: lineProfile.userId } as Member);
      } else {
        // Create new member
        const newMemberRef = await addDoc(collection(db, 'members'), {
          tenantId,
          name: lineProfile.displayName,
          phone: phoneToLink,
          points: 0,
          totalSpent: 0,
          tier: 'Bronze',
          lineUserId: lineProfile.userId,
          lineDisplayName: lineProfile.displayName,
          createdAt: serverTimestamp(),
          lastVisit: null
        });
        
        const newlyCreatedDoc = await getDoc(newMemberRef);
        setMember({ id: newlyCreatedDoc.id, ...newlyCreatedDoc.data() } as Member);
      }
    } catch (err) {
      console.error('Error linking account', err);
      alert('เกิดข้อผิดพลาดในการผูกบัญชี');
    } finally {
      setLinking(false);
    }
  };

  const handleBookingSubmit = async (data: any) => {
    if (!tenantId || !member) return;
    
    try {
      // 1. Save to Firestore
      const bookingData = {
        ...data,
        tenantId,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'bookings'), bookingData);

      // 2. Trigger LINE Webhook push notification via our Backend
      if (member.lineUserId) {
         fetch(`/api/notify-booking/${tenantId}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             lineUserId: member.lineUserId,
             serviceName: data.serviceName,
             branchName: data.branchName,
             date: data.date,
             timeSlot: data.timeSlot,
             status: 'pending'
           })
         }).catch(err => console.error('Failed to trigger notification', err));
      }

      alert('บันทึกการจองสำเร็จ ระบบกำลังส่งข้อความยืนยันทางแชท LINE (กรุณากดยืนยันเพื่อปิดหน้าต่างนี้)');
      if (liff.isInClient()) {
         liff.closeWindow(); // Close LIFF app and return to chat if inside LINE
      } else {
         window.close(); // For external browsers
      }
    } catch (err) {
      console.error('Submit booking error', err);
      alert('เกิดข้อผิดพลาดในการบันทึกการจอง');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-primary mb-4" size={32} />
        <p className="text-sm font-bold text-text-muted">กำลังโหลดข้อมูลร้านค้าและโปรไฟล์ LINE...</p>
      </div>
    );
  }

  if (error || !shopConfig) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-3xl w-full text-center shadow-sm">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-lg font-bold text-text-main mb-2">ไม่สามารถใช้งานได้</h2>
          <p className="text-sm text-text-muted">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface md:bg-bg md:py-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
        className="max-w-md mx-auto bg-surface md:bg-white md:rounded-[2.5rem] md:shadow-2xl md:border md:border-border min-h-screen md:min-h-0 overflow-hidden relative"
      >
        {/* Header Ribbon / Shop Banner */}
        <div className="bg-primary/10 pt-12 pb-6 px-6 text-center border-b border-primary/20">
          {shopConfig.theme?.logoUrl ? (
             <img src={shopConfig.theme.logoUrl} alt={shopConfig.shopName} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-md" />
          ) : (
             <div className="w-20 h-20 rounded-full mx-auto mb-4 bg-primary text-white flex items-center justify-center text-2xl font-black shadow-md border-4 border-white">
               {shopConfig.shopName[0]}
             </div>
          )}
          <h1 className="text-xl font-bold font-serif text-primary-dark">{shopConfig.shopName}</h1>
        </div>

        <div className="p-6">
          {!member ? (
            // Form to Link/Create account
            <div className="space-y-6">
               <div className="text-center">
                 <img src={lineProfile?.pictureUrl} alt="LINE Profile" className="w-16 h-16 rounded-full mx-auto mb-3 shadow-sm border-2 border-white"/>
                 <h2 className="text-lg font-bold text-text-main">สวัสดีคุณ {lineProfile?.displayName}</h2>
                 <p className="text-xs text-text-muted mt-1 leading-relaxed">
                   เพื่อความสะดวกในการจองคิวและสะสมแต้ม ขอทราบเบอร์โทรศัพท์เพื่อผูกบัญชีเข้ากับระบบของทางร้านครับ
                 </p>
               </div>
               
               <form onSubmit={handleLinkAccount} className="space-y-4">
                 <div>
                   <input
                     type="tel"
                     required
                     placeholder="08X-XXX-XXXX"
                     className="input-field w-full text-center text-lg tracking-widest py-3 font-mono"
                     value={phoneToLink}
                     onChange={e => setPhoneToLink(e.target.value)}
                   />
                 </div>
                 <button type="submit" disabled={linking} className="w-full btn-primary py-3.5 shadow-lg shadow-primary/30">
                   {linking ? <Loader2 className="animate-spin text-white mx-auto" size={20} /> : 'ยืนยันเบอร์โทรศัพท์'}
                 </button>
               </form>
            </div>
          ) : (
            // Dashboard / Tools (CustomerCard and BookingForm)
            <div className="space-y-8">
               <CustomerCard 
                 member={member} 
                 packages={[]}
                 branches={branches}
                 serviceTemplates={services}
                 shopConfig={shopConfig} 
                 onSubmitBooking={handleBookingSubmit}
               />
               
               <div className="pb-8">
                 <BookingForm 
                    member={member}
                    services={services}
                    branches={branches}
                    shopConfig={shopConfig}
                    onSubmit={handleBookingSubmit}
                    onClose={() => liff.closeWindow()}
                 />
               </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
