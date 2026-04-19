import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTenant } from '../../contexts/TenantContext';
import { db, collection, onSnapshot, query, where, orderBy, getDocs } from '../../firebase';
import { Member, Transaction } from '../../types';

export const StoreDashboard: React.FC = () => {
  const { tenantId, shopConfig } = useTenant();
  const navigate = useNavigate();
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // 1. Fetch Members
    const qM = query(collection(db, 'members'), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
    const unsubM = onSnapshot(qM, (snap) => setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Member))));

    // 2. Fetch Transactions for Analytics
    const qT = query(collection(db, 'transactions'), where('tenantId', '==', tenantId));
    const unsubT = onSnapshot(qT, (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))));

    return () => { unsubM(); unsubT(); };
  }, [tenantId]);

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone.includes(searchQuery)
  );

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'อรุณสวัสดิ์';
    if (h < 16) return 'สวัสดีตอนบ่าย';
    if (h < 19) return 'สวัสดีตอนเย็น';
    return 'สวัสดีตอนค่ำ';
  })();

  // Analyics Calculations
  const analytics = useMemo(() => {
    let totalRevenue = 0;
    const revenueByDay: Record<string, number> = {};
    const serviceCounts: Record<string, number> = {};

    transactions.forEach(tx => {
       if (tx.amount && tx.amount > 0) totalRevenue += tx.amount;
       
       // Revenue over time
       if (tx.timestamp) {
         const d = tx.timestamp.toDate();
         const dateString = `${d.getDate()}/${d.getMonth()+1}`;
         if (!revenueByDay[dateString]) revenueByDay[dateString] = 0;
         revenueByDay[dateString] += tx.amount || 0;
       }

       // Service Popularity
       if (tx.serviceName) {
         if (!serviceCounts[tx.serviceName]) serviceCounts[tx.serviceName] = 0;
         serviceCounts[tx.serviceName] += 1;
       }
    });

    const chartRevenue = Object.entries(revenueByDay).map(([date, total]) => ({ date, total }));
    const chartServices = Object.entries(serviceCounts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 5);

    return { totalRevenue, chartRevenue, chartServices };
  }, [transactions]);

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
        <StatCard label="รายได้รวม" value={`฿${analytics.totalRevenue.toLocaleString()}`} color="primary" trend="ทั้งหมด" />
        <StatCard label="ลูกค้าทั้งหมด" value={members.length.toString()} color="silver" trend="บัญชี" />
        <StatCard label="ระดับ Gold" value={members.filter(m => m.tier === 'Gold').length.toString()} color="gold" trend="ยอดสะสม > 10,000" />
        <StatCard label="บริการที่ขายไป" value={transactions.length.toString()} color="bronze" trend="ครั้ง" />
      </div>

      {/* Advanced Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6 h-80 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-6">รายได้ย้อนหลัง</h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.chartRevenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="total" stroke="var(--color-primary, #C89595)" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6 h-80 flex flex-col">
          <h3 className="text-sm font-bold uppercase tracking-wider text-text-muted mb-6">บริการยอดนิยม (Top 5)</h3>
          <div className="flex-1 min-h-0 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.chartServices} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#475569' }} width={120} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="var(--color-primary, #C89595)" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
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

function StatCard({ label, value, trend, color }: { label: string; value: string; trend: string; color: string }) {
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
        <h4 className={`text-3xl font-bold tracking-tight font-serif ${colors.text} truncate`}>{value}</h4>
        <div className="flex items-center gap-1.5 py-1 px-2.5 bg-bg rounded-lg w-fit border border-border/50 mt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">{trend}</span>
        </div>
      </div>
    </div>
  );
}
