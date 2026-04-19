import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Users, Phone, Search } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { db, collection, onSnapshot, query, where, orderBy } from '../../firebase';
import { Member } from '../../types';

export const MemberListPage: React.FC = () => {
  const { tenantId } = useTenant();
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

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery)
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative group flex-1 sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="ค้นหาชื่อหรือเบอร์โทร..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button onClick={() => navigate('/members/new')} className="btn-primary whitespace-nowrap">
          + เพิ่มลูกค้าใหม่
        </button>
      </div>

      <h2 className="text-2xl font-bold">รายชื่อลูกค้า ({filtered.length})</h2>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-border shadow-sm">
          <Search size={48} className="mx-auto text-text-muted/30 mb-4" />
          <p className="text-text-muted font-bold">ไม่พบรายชื่อลูกค้า</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(m => (
          <motion.div
            key={m.id}
            whileHover={{ y: -4 }}
            onClick={() => navigate(`/members/${m.id}`)}
            className="glass-card p-6 cursor-pointer hover:border-primary/40 transition-all group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                <Users size={20} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 bg-accent-soft rounded">
                {m.tier}
              </span>
            </div>
            <h4 className="text-lg font-bold mb-1">{m.name}</h4>
            <div className="mb-6 h-4">
              <a
                href={`tel:${m.phone}`}
                className="flex items-center gap-1.5 w-fit text-xs text-text-muted hover:text-primary hover:underline transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone size={10} className="opacity-80" />
                {m.phone}
              </a>
            </div>
            <div className="flex justify-between items-end border-t border-border pt-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-text-muted">แต้มปัจจุบัน</p>
                <p className="text-xl font-bold text-primary">{m.points}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-text-muted">ยอดสะสม</p>
                <p className="text-sm font-bold">฿{m.totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
