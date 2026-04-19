import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Store, Search, ToggleLeft, ToggleRight, ChevronRight, Users } from 'lucide-react';
import { db, collection, onSnapshot, query, doc, updateDoc, getDocs, where } from '../../firebase';
import { Tenant } from '../../types';

export const TenantList: React.FC = () => {
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const q = query(collection(db, 'tenants'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tenant));
      setTenants(data);

      // Fetch member counts per tenant
      data.forEach(async (tenant) => {
        try {
          const membersQ = query(collection(db, 'members'), where('tenantId', '==', tenant.id));
          const snap = await getDocs(membersQ);
          setMemberCounts(prev => ({ ...prev, [tenant.id]: snap.size }));
        } catch {
          // ignore
        }
      });
    });
    return () => unsub();
  }, []);

  const toggleTenantActive = async (tenantId: string, currentState: boolean) => {
    try {
      await updateDoc(doc(db, 'tenants', tenantId), { isActive: !currentState });
    } catch (err) {
      console.error('Failed to toggle tenant:', err);
    }
  };

  const filtered = tenants.filter(t =>
    t.shopName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold">จัดการร้านค้า</h1>
          <p className="text-sm text-text-muted mt-1">ร้านค้าทั้งหมด {tenants.length} ร้าน</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="ค้นหาร้านค้า..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 py-3 bg-white border border-border rounded-2xl text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all w-full shadow-sm"
          />
        </div>
      </div>

      {/* Tenant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(tenant => (
          <motion.div
            key={tenant.id}
            whileHover={{ y: -4 }}
            className="glass-card p-6 group hover:border-purple-300 transition-all cursor-pointer"
            onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                <Store size={24} />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                  tenant.subscription?.plan === 'pro'
                    ? 'bg-purple-50 text-purple-600 border-purple-200'
                    : tenant.subscription?.plan === 'basic'
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  {tenant.subscription?.plan || 'trial'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTenantActive(tenant.id, tenant.isActive); }}
                  className="text-text-muted hover:text-primary transition-colors"
                  title={tenant.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                >
                  {tenant.isActive
                    ? <ToggleRight size={24} className="text-green-500" />
                    : <ToggleLeft size={24} className="text-gray-300" />
                  }
                </button>
              </div>
            </div>

            <h4 className="text-lg font-bold mb-1 group-hover:text-purple-600 transition-colors">{tenant.shopName}</h4>
            <p className="text-xs text-text-muted mb-4">{tenant.shopPhone || 'ไม่ระบุเบอร์'}</p>

            <div className="flex justify-between items-end border-t border-border pt-4">
              <div className="flex items-center gap-2 text-xs text-text-muted">
                <Users size={14} />
                <span className="font-bold">{memberCounts[tenant.id] ?? '...'} ลูกค้า</span>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${tenant.isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-border">
          <Store size={48} className="mx-auto text-text-muted/30 mb-4" />
          <p className="text-text-muted font-bold">ไม่พบร้านค้าที่ค้นหา</p>
        </div>
      )}
    </motion.div>
  );
};
