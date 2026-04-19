import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Smartphone } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';
import { db, collection, onSnapshot, query, where, orderBy, addDoc, serverTimestamp } from '../../firebase';
import { Member, Package, ServiceTemplate, Booking } from '../../types';
import { CustomerCard } from '../../components/CustomerCard';

export const CustomerSimPage: React.FC = () => {
  const { tenantId, shopConfig, branches } = useTenant();
  const [searchParams] = useSearchParams();
  const initialMemberId = searchParams.get('member');

  const [members, setMembers] = useState<Member[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);
  const [previewMemberId, setPreviewMemberId] = useState<string | null>(initialMemberId);

  useEffect(() => {
    const q = query(collection(db, 'members'), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Member));
      setMembers(data);
      if (!previewMemberId && data.length > 0) setPreviewMemberId(data[0].id);
    });
    return () => unsub();
  }, [tenantId]);

  useEffect(() => {
    const selectedId = previewMemberId || (members.length > 0 ? members[0].id : null);
    if (!selectedId) return;

    const q = query(collection(db, 'packages'), where('memberId', '==', selectedId));
    const unsub = onSnapshot(q, (snap) => {
      setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Package)));
    });
    return () => unsub();
  }, [previewMemberId, members]);

  useEffect(() => {
    const q = query(collection(db, 'serviceTemplates'), where('tenantId', '==', tenantId));
    const unsub = onSnapshot(q, (snap) => {
      setServiceTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceTemplate)));
    });
    return () => unsub();
  }, [tenantId]);

  const handleCreateBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>) => {
    await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      tenantId,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  };

  const currentMember = members.find(m => m.id === (previewMemberId || members[0]?.id));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-full flex flex-col items-center justify-center py-6">
      {members.length > 0 && (
        <div className="mb-6 w-[375px] flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-border">
          <span className="text-xs font-bold text-text-muted">พรีวิวในหน้าจอของ:</span>
          <select
            className="text-sm font-bold bg-transparent outline-none cursor-pointer max-w-[150px] truncate text-primary"
            value={previewMemberId || members[0]?.id}
            onChange={(e) => setPreviewMemberId(e.target.value)}
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Mobile Frame */}
      <div className="w-[375px] h-[780px] bg-text-main rounded-[50px] p-3 shadow-2xl relative border-[4px] border-border/20 flex-shrink-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-text-main rounded-b-2xl z-50" />
        <div className="w-full h-full rounded-[40px] overflow-hidden bg-white">
          {currentMember ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-auto">
                <CustomerCard
                  member={currentMember}
                  packages={packages.filter(p => p.memberId === currentMember.id)}
                  branches={branches}
                  serviceTemplates={serviceTemplates}
                  shopConfig={shopConfig}
                  onSubmitBooking={handleCreateBooking}
                />
              </div>
            </div>
          ) : (
            <div className="p-10 text-center flex flex-col items-center justify-center h-full">
              <Smartphone size={40} className="text-neutral-100 mb-4" />
              <p className="text-sm text-text-muted mb-6">ลงทะเบียนลูกค้าเพื่อดูพรีวิว</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
