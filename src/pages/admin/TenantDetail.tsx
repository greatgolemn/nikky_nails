import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Store, Users, ArrowLeft, ToggleLeft, ToggleRight, Calendar, 
  CreditCard, TrendingUp, Phone, Mail, Clock
} from 'lucide-react';
import { 
  db, collection, doc, onSnapshot, query, where, getDocs, updateDoc 
} from '../../firebase';
import { Tenant, Member, Booking } from '../../types';

export const TenantDetail: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);

  // Listen to tenant
  useEffect(() => {
    if (!tenantId) return;
    const unsub = onSnapshot(doc(db, 'tenants', tenantId), (snap) => {
      if (snap.exists()) {
        setTenant({ id: snap.id, ...snap.data() } as Tenant);
      }
    });
    return () => unsub();
  }, [tenantId]);

  // Fetch stats
  useEffect(() => {
    if (!tenantId) return;

    const fetchStats = async () => {
      try {
        const membersQ = query(collection(db, 'members'), where('tenantId', '==', tenantId));
        const membersSnap = await getDocs(membersQ);
        setMemberCount(membersSnap.size);
        setRecentMembers(
          membersSnap.docs.slice(0, 5).map(d => ({ id: d.id, ...d.data() } as Member))
        );

        const bookingsQ = query(collection(db, 'bookings'), where('tenantId', '==', tenantId));
        const bookingsSnap = await getDocs(bookingsQ);
        setBookingCount(bookingsSnap.size);
      } catch (err) {
        console.error('Failed to fetch tenant stats:', err);
      }
    };
    fetchStats();
  }, [tenantId]);

  const toggleActive = async () => {
    if (!tenant || !tenantId) return;
    try {
      await updateDoc(doc(db, 'tenants', tenantId), { isActive: !tenant.isActive });
    } catch (err) {
      console.error('Failed to toggle tenant:', err);
    }
  };

  if (!tenant) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  const planColors: Record<string, string> = {
    pro: 'bg-purple-50 text-purple-600 border-purple-200',
    basic: 'bg-blue-50 text-blue-600 border-blue-200',
    trial: 'bg-gray-50 text-gray-500 border-gray-200',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/tenants')}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-primary font-bold transition-colors"
      >
        <ArrowLeft size={16} /> กลับไปรายการร้านค้า
      </button>

      {/* Header */}
      <div className="glass-card p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center text-purple-500">
              <Store size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold">{tenant.shopName}</h1>
              <div className="flex items-center gap-4 mt-2">
                {tenant.shopPhone && (
                  <span className="text-xs text-text-muted flex items-center gap-1.5">
                    <Phone size={12} /> {tenant.shopPhone}
                  </span>
                )}
                <span className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${planColors[tenant.subscription?.plan] || planColors.trial}`}>
                  {tenant.subscription?.plan || 'trial'} plan
                </span>
                <span className={`flex items-center gap-1.5 text-xs font-bold ${tenant.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${tenant.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
                  {tenant.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={toggleActive}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all ${
              tenant.isActive
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
            }`}
          >
            {tenant.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {tenant.isActive ? 'ระงับร้านค้า' : 'เปิดใช้งานร้านค้า'}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">จำนวนลูกค้า</p>
              <p className="text-2xl font-bold text-blue-600">{memberCount}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">จำนวนการจอง</p>
              <p className="text-2xl font-bold text-emerald-600">{bookingCount}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-text-muted tracking-wider">แพลน</p>
              <p className="text-2xl font-bold text-purple-600 capitalize">{tenant.subscription?.plan || 'trial'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Details */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
          <CreditCard size={18} className="text-purple-500" /> ข้อมูล Subscription
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-[10px] uppercase font-bold text-text-muted mb-1">แพลน</p>
            <p className="text-sm font-bold capitalize">{tenant.subscription?.plan || 'trial'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-text-muted mb-1">สถานะ</p>
            <p className={`text-sm font-bold ${tenant.subscription?.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
              {tenant.subscription?.status || 'active'}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-text-muted mb-1">จำนวนลูกค้าสูงสุด</p>
            <p className="text-sm font-bold">{tenant.subscription?.maxMembers?.toLocaleString() || '50'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-text-muted mb-1">วันหมดอายุ</p>
            <p className="text-sm font-bold">
              {tenant.subscription?.expiresAt 
                ? new Date(tenant.subscription.expiresAt.seconds * 1000).toLocaleDateString('th-TH')
                : 'ไม่มีกำหนด'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Recent Members */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold mb-6 flex items-center gap-2">
          <Users size={18} className="text-blue-500" /> ลูกค้าล่าสุด
        </h3>
        <div className="divide-y divide-border/30">
          {recentMembers.length === 0 ? (
            <div className="py-8 text-center text-sm text-text-muted italic">ยังไม่มีลูกค้า</div>
          ) : (
            recentMembers.map(m => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-500">
                    {m.name.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{m.name}</p>
                    <p className="text-xs text-text-muted">{m.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{m.points} แต้ม</p>
                  <p className="text-[10px] uppercase text-text-muted font-bold">{m.tier}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};
