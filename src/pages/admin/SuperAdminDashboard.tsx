import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Store, Users, TrendingUp, Shield, Activity } from 'lucide-react';
import { db, collection, onSnapshot, query, getDocs } from '../../firebase';
import { Tenant } from '../../types';

export const SuperAdminDashboard: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'tenants'));
    const unsub = onSnapshot(q, (snapshot) => {
      setTenants(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tenant)));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchMemberCount = async () => {
      try {
        const snap = await getDocs(collection(db, 'members'));
        setTotalMembers(snap.size);
      } catch {
        setTotalMembers(0);
      }
    };
    fetchMemberCount();
  }, [tenants]);

  const activeTenants = tenants.filter(t => t.isActive);
  const proTenants = tenants.filter(t => t.subscription?.plan === 'pro');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-serif font-black tracking-tight text-text-main flex items-center gap-3">
          <Shield size={36} className="text-purple-500" />
          ภาพรวมแพลตฟอร์ม
        </h1>
        <p className="text-sm text-text-muted">
          จัดการร้านค้าทั้งหมดในระบบ NailSaaS
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="ร้านค้าทั้งหมด"
          value={tenants.length}
          icon={<Store size={20} />}
          color="purple"
        />
        <StatCard
          label="ร้านค้า Active"
          value={activeTenants.length}
          icon={<Activity size={20} />}
          color="green"
        />
        <StatCard
          label="ลูกค้ารวมทั้งระบบ"
          value={totalMembers}
          icon={<Users size={20} />}
          color="blue"
        />
        <StatCard
          label="ร้านค้า Pro Plan"
          value={proTenants.length}
          icon={<TrendingUp size={20} />}
          color="gold"
        />
      </div>

      {/* Recent Tenants */}
      <div className="glass-card p-6">
        <h3 className="text-base font-semibold mb-6">ร้านค้าล่าสุดที่สมัครใช้งาน</h3>
        <div className="divide-y divide-border/30">
          {tenants.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-sm italic">
              ยังไม่มีร้านค้าในระบบ
            </div>
          ) : (
            tenants.slice(0, 10).map(t => (
              <div key={t.id} className="grid grid-cols-[48px_1fr_auto_auto] items-center py-4 gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                  <Store size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold">{t.shopName}</p>
                  <p className="text-xs text-text-muted">
                    {t.shopPhone || 'ไม่ระบุเบอร์'}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                  t.subscription?.plan === 'pro'
                    ? 'bg-purple-50 text-purple-600'
                    : t.subscription?.plan === 'basic'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {t.subscription?.plan || 'trial'}
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${t.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colors: Record<string, { bg: string; text: string; iconBg: string }> = {
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100' },
    gold: { bg: 'bg-amber-50', text: 'text-amber-600', iconBg: 'bg-amber-100' },
  };
  const c = colors[color] || colors.purple;

  return (
    <div className="glass-card overflow-hidden group hover:-translate-y-1 transition-all duration-500">
      <div className={`h-1.5 w-full ${c.iconBg}`} />
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <p className="text-[10px] uppercase font-black text-text-muted tracking-[0.2em]">{label}</p>
          <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center ${c.text}`}>
            {icon}
          </div>
        </div>
        <h4 className={`text-4xl font-bold tracking-tight font-serif ${c.text}`}>{value}</h4>
      </div>
    </div>
  );
}
