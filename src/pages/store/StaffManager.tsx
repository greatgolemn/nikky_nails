import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, Trash2, Mail, Copy, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTenant } from '../../contexts/TenantContext';
import { db, collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, handleFirestoreError, OperationType } from '../../firebase';
import { UserProfile, Invitation, UserRole } from '../../types';

export const StaffManager: React.FC = () => {
  const { tenantId } = useTenant();
  const { firebaseUser, userProfile } = useAuth();
  
  const [staff, setStaff] = useState<UserProfile[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch staff members
  useEffect(() => {
    if (!tenantId) return;
    const q = query(collection(db, 'users'), where('tenantId', '==', tenantId));
    const unsub = onSnapshot(q, (snap) => {
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    });
    return () => unsub();
  }, [tenantId]);

  // Fetch pending invitations
  useEffect(() => {
    if (!tenantId) return;
    const q = query(collection(db, 'invitations'), where('tenantId', '==', tenantId), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snap) => {
      setInvitations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invitation)));
    });
    return () => unsub();
  }, [tenantId]);

  const handleSendInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const role = formData.get('role') as UserRole;

    try {
      await addDoc(collection(db, 'invitations'), {
        tenantId,
        email,
        role,
        invitedBy: firebaseUser?.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        // Expires in 7 days
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
      setShowInviteForm(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'invitations');
    }
  };

  const cancelInvitation = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'invitations', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'invitations');
    }
  };

  const removeStaff = async (id: string) => {
    if (id === firebaseUser?.uid) {
      alert('คุณไม่สามารถลบบัญชีของตัวเองได้');
      return;
    }
    if (!confirm('พนักงานจะถูกตัดสิทธิ์การเข้าถึงระบบทันที ยืนยันหรือไม่?')) return;
    
    try {
      // Free them from this tenant by nullifying or deleting their profile
      await updateDoc(doc(db, 'users', id), { tenantId: null });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'users');
    }
  };

  const copyInviteLink = (inviteId: string) => {
    const url = `${window.location.origin}/invite/${inviteId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(inviteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-8 pt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">การจัดการพนักงาน</h2>
          <p className="text-sm text-text-muted mt-1">เชิญและแก้ไขสิทธิ์ผู้ใช้งานภายในร้าน</p>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className={`btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm shadow-md transition-all ${showInviteForm ? 'bg-red-50 text-red-600 border-none' : ''}`}
        >
          {showInviteForm ? 'ยกเลิก' : <><UserPlus size={16} /> เชิญพนักงานใหม่</>}
        </button>
      </div>

      {showInviteForm && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-card p-6 border-l-4 border-l-primary"
        >
          <div className="mb-4">
            <h3 className="font-bold text-lg">สร้างลิงก์คำเชิญ</h3>
            <p className="text-xs text-text-muted">กรอกอีเมลและระดับสิทธิ์ พนักงานจะสามารถนำลิงก์ไปสร้างรหัสผ่านเพื่อเข้าใช้งานร้านค้านี้ได้</p>
          </div>
          <form onSubmit={handleSendInvite} className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="text-[10px] uppercase font-bold text-text-muted mb-1.5 block ml-1">อีเมลพนักงาน</label>
              <input name="email" type="email" required placeholder="staff@example.com" className="input-field w-full" />
            </div>
            <div className="w-full md:w-64">
              <label className="text-[10px] uppercase font-bold text-text-muted mb-1.5 block ml-1">สิทธิ์การเข้าถึง</label>
              <select name="role" className="input-field bg-white w-full">
                <option value="staff">พนักงานทั่วไป (Staff)</option>
                <option value="store_owner">ผู้จัดการร้าน (Store Owner)</option>
              </select>
            </div>
            <button type="submit" className="w-full md:w-auto btn-primary py-3 px-8 shadow-sm">
              สร้างคำเชิญ
            </button>
          </form>
        </motion.div>
      )}

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-border bg-orange-50 flex items-center gap-2">
            <Mail size={16} className="text-orange-500" />
            <h3 className="font-bold text-sm text-orange-700">คำเชิญที่รอการตอบรับ ({invitations.length})</h3>
          </div>
          <div className="divide-y divide-border/50">
            {invitations.map(invite => (
              <div key={invite.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-neutral-50">
                <div>
                  <p className="font-bold text-sm">{invite.email}</p>
                  <p className="text-xs text-text-muted">สิทธิ์: {invite.role === 'store_owner' ? 'ผู้จัดการร้าน' : 'พนักงาน'}</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => copyInviteLink(invite.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-text-main text-white text-xs font-bold rounded-lg hover:bg-black transition-colors"
                  >
                    {copiedId === invite.id ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} />}
                    {copiedId === invite.id ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์เชิญ'}
                  </button>
                  <button 
                    onClick={() => cancelInvitation(invite.id)}
                    className="p-2 text-text-muted hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    title="ยกเลิกคำเชิญ"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Staff List */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-border bg-accent-soft/30">
           <h3 className="font-bold text-sm uppercase tracking-wider text-primary">บุคลากรในร้าน ({staff.length})</h3>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-neutral-50/50">
                <th className="p-4 text-[10px] uppercase font-bold text-text-muted tracking-wider">ชื่อผู้ใช้งาน</th>
                <th className="p-4 text-[10px] uppercase font-bold text-text-muted tracking-wider">อีเมล</th>
                <th className="p-4 text-[10px] uppercase font-bold text-text-muted tracking-wider">สถานะสิทธิ์</th>
                <th className="p-4 text-[10px] uppercase font-bold text-text-muted tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
               {staff.map(member => (
                 <tr key={member.id} className="hover:bg-neutral-50/50 transition-colors">
                   <td className="p-4">
                     <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase border border-primary/20">
                         {member.displayName?.[0] || member.email[0]}
                       </div>
                       <span className="font-bold text-sm">{member.displayName}</span>
                       {member.id === firebaseUser?.uid && (
                         <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold ml-2">ฉัน</span>
                       )}
                     </div>
                   </td>
                   <td className="p-4 text-xs text-text-muted">{member.email}</td>
                   <td className="p-4">
                     <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                       member.role === 'store_owner' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                     }`}>
                       {member.role === 'store_owner' ? 'Owner' : 'Staff'}
                     </span>
                   </td>
                   <td className="p-4 text-right">
                     {member.id !== firebaseUser?.uid && (
                       <button onClick={() => removeStaff(member.id)} className="text-xs text-red-500 font-bold hover:underline">
                         ลบสิทธิ์
                       </button>
                     )}
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
