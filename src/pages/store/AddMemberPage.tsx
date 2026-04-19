import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTenant } from '../../contexts/TenantContext';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../../firebase';

export const AddMemberPage: React.FC = () => {
  const { tenantId, branches } = useTenant();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await addDoc(collection(db, 'members'), {
        tenantId,
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        preferredBranchId: formData.get('preferredBranchId') as string || null,
        points: 0,
        totalSpent: 0,
        tier: 'Bronze',
        createdAt: serverTimestamp(),
        lastVisit: serverTimestamp(),
      });
      navigate('/members');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'members');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-8 text-center text-primary">ลงทะเบียนลูกค้าใหม่</h2>
      <form onSubmit={handleSubmit} className="glass-card p-10 space-y-6">
        <div>
          <label className="text-xs uppercase font-bold text-text-muted mb-2 block">ชื่อ-นามสกุล</label>
          <input name="name" required placeholder="เช่น คุณสมศรี ใจดี" className="input-field w-full" />
        </div>
        <div>
          <label className="text-xs uppercase font-bold text-text-muted mb-2 block">เบอร์โทรศัพท์</label>
          <input name="phone" required placeholder="08x-xxx-xxxx" className="input-field w-full" />
        </div>
        <div>
          <label className="text-xs uppercase font-bold text-text-muted mb-2 block">สาขาที่ลงทะเบียน</label>
          <select name="preferredBranchId" className="input-field bg-white w-full">
            <option value="">เลือกสาขา (ถ้ามี)</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="w-full btn-primary py-3.5 mt-4">
          บันทึกข้อมูลและสมัครลูกค้า
        </button>
      </form>
    </motion.div>
  );
};
