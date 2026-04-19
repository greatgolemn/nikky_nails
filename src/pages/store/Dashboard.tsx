import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Users, Phone, Search, Plus } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { db, collection, onSnapshot, query, where, orderBy } from '../../firebase';
import { Member } from '../../types';

export const StoreDashboard: React.FC = () => {
  const { tenantId, shopConfig } = useTenant();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'members'),
      where('tenantId', '==', tenantId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
    });
    return () => unsub();
  }, [tenantId]);

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery)
  );

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'อรุณสวัสดิ์';
    if (h < 16) return 'สวัสดีตอนบ่าย';
    if (h < 19) return 'สวัสดีตอนเย็น';
    return 'สวัสดีตอนค่ำ';
  })();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-serif font-black tracking-tight text-text-main leading-snug">
          {greeting}
          <span className="block text-primary italic font-medium mt-2">{shopConfig.shopName}</span>
        </h1>
        <p className="text-sm text-text-muted">ลูกค้าทั้งหมด {members.length} ราย</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="ลูกค้าทั้งหมด" value={members.length} color="primary" trend={`${members.length} รายการ`} />
        <StatCard label="ระดับ Gold" value={members.filter(m => m.tier === 'Gold').length} color="gold" trend="ยอดสะสม > 10,000" />
        <StatCard label="ระดับ Silver" value={members.filter(m => m.tier === 'Silver').length} color="silver" trend="ยอดสะสม > 5,000" />
        <StatCard label="ระดับ Bronze" value={members.filter(m => m.tier === 'Bronze').length} color="bronze" trend="ลูกค้าทั่วไป" />
      </div>

      {/* Quick Search + Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 glass-card p-6">
          <h3 className="text-base font-semibold mb-6">ลูกค้าล่าสุด</h3>
          <div className="divide-y divide-border/30">
            {members.slice(0, 5).map(m => (
              <div
                key={m.id}
                className="grid grid-cols-[48px_1fr_auto] items-center py-4 cursor-pointer hover:bg-bg/50 transition-colors rounded-xl px-2"
                onClick={() => navigate(`/members/${m.id}`)}
              >
                <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-400">
                  {m.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{m.name}</p>
                  <span className="text-xs text-text-muted">{m.phone}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 bg-accent-soft rounded">
                  {m.tier}
                </span>
              </div>
            ))}
            {members.length === 0 && (
              <div className="py-8 text-center text-text-muted text-sm italic">ยังไม่มีลูกค้า</div>
            )}
          </div>
        </div>

        <div className="glass-card p-6 bg-accent-soft/30 border-primary/20">
          <h3 className="text-base font-semibold mb-4">ค้นหาลูกค้า</h3>
          <input
            type="text"
            className="input-field mb-4 w-full"
            placeholder="ชื่อหรือเบอร์โทร"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {filteredMembers.length > 0 && searchQuery.length > 2 ? (
            <div className="p-4 bg-white rounded-xl border border-border shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <strong className="text-sm">{filteredMembers[0].name}</strong>
                <span className="text-[10px] bg-accent-soft text-primary px-2 py-0.5 rounded font-bold uppercase">
                  {filteredMembers[0].tier}
                </span>
              </div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-text-muted">แต้มสะสม:</span>
                <span className="font-bold">{filteredMembers[0].points} แต้ม</span>
              </div>
              <button
                onClick={() => navigate(`/members/${filteredMembers[0].id}`)}
                className="w-full py-2.5 bg-text-main text-white rounded-lg text-xs font-bold"
              >
                จัดการรายการ
              </button>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-text-muted border border-dashed border-border rounded-xl">
              ค้นหาลูกค้าเพื่อดูข้อมูลสรุป
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

function StatCard({ label, value, trend, color }: { label: string; value: number; trend: string; color: string }) {
  const getColors = () => {
    switch (color) {
      case 'gold': return { bar: 'bg-[#D4AF37]', text: 'text-[#8E6F1F]', bg: 'bg-[#FDF5E6]' };
      case 'silver': return { bar: 'bg-[#94a3b8]', text: 'text-[#475569]', bg: 'bg-[#F8FAFC]' };
      case 'bronze': return { bar: 'bg-[#CD7F32]', text: 'text-[#92400e]', bg: 'bg-[#FFF7ED]' };
      case 'primary': return { bar: 'bg-primary', text: 'text-primary', bg: 'bg-primary-light/10' };
      default: return { bar: 'bg-border', text: 'text-text-main', bg: 'bg-bg' };
    }
  };
  const colors = getColors();

  return (
    <div className="glass-card overflow-hidden group hover:-translate-y-1 transition-all duration-500">
      <div className={`h-1.5 w-full ${colors.bar} opacity-60`} />
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <p className="text-[10px] uppercase font-black text-text-muted tracking-[0.2em]">{label}</p>
        </div>
        <h4 className={`text-4xl font-bold tracking-tight font-serif ${colors.text}`}>{value}</h4>
        <div className="flex items-center gap-1.5 py-1 px-2.5 bg-bg rounded-lg w-fit border border-border/50 mt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{trend}</span>
        </div>
      </div>
    </div>
  );
}
