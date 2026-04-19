import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db, doc, getDoc, setDoc, deleteDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';
import { Invitation } from '../types';

export const AcceptInvite: React.FC = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const navigate = useNavigate();
  const { firebaseUser, loginWithGoogle } = useAuth();
  
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  // 1. Fetch the invitation details
  useEffect(() => {
    const fetchInvite = async () => {
      if (!inviteId) return;
      try {
        const snap = await getDoc(doc(db, 'invitations', inviteId));
        if (!snap.exists()) {
          setError('ลิงก์คำเชิญไม่ถูกต้องหรือถูกยกเลิกแล้ว');
        } else {
          const data = snap.data() as Invitation;
          if (data.status !== 'pending') {
            setError('คำเชิญนี้ถูกใช้งานไปแล้ว');
          } else if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
            setError('ลิงก์คำเชิญหมดอายุแล้ว');
          } else {
            setInvitation({ id: snap.id, ...data });
          }
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการตรวจสอบคำเชิญ');
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [inviteId]);

  // 2. Process acceptance when user logs in
  useEffect(() => {
    const processInvitation = async () => {
      if (firebaseUser && invitation && !accepting) {
        setAccepting(true);
        try {
          // Verify email matches if required, but for MVP we allow any signed in Google account to claim it if they have the link
          // Create or update UserProfile
          await setDoc(doc(db, 'users', firebaseUser.uid), {
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Staff',
            role: invitation.role,
            tenantId: invitation.tenantId,
            createdAt: serverTimestamp(),
          }, { merge: true });

          // Consume invitation
          await deleteDoc(doc(db, 'invitations', invitation.id));

          // Redirect to store dashboard
          navigate('/');
        } catch (err) {
          setError('เกิดข้อผิดพลาดในการยืนยันสิทธิ์ กรุณาลองใหม่');
          setAccepting(false);
        }
      }
    };
    processInvitation();
  }, [firebaseUser, invitation, navigate, accepting]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
         <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
           <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <ShieldCheck size={32} />
           </div>
           <h2 className="text-xl font-bold text-text-main mb-2">ไม่สามารถใช้งานคำเชิญได้</h2>
           <p className="text-text-muted text-sm">{error}</p>
           <button onClick={() => navigate('/')} className="mt-8 btn-primary w-full py-3">กลับสู่หน้าแรก</button>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="bg-white p-10 rounded-[2rem] shadow-xl max-w-md w-full border border-border">
        
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-2xl font-bold font-serif mb-2 text-text-main">คำเชิญเข้าร่วมร้านค้า</h1>
          <p className="text-sm text-text-muted">
            คุณได้รับเชิญให้เข้าถึงร้านค้าในฐานะ<br/>
            <span className="font-bold text-primary text-base inline-block mt-1">
              {invitation.role === 'store_owner' ? 'ผู้จัดการร้าน (Store Owner)' : 'พนักงาน (Staff)'}
            </span>
          </p>
        </div>

        {accepting ? (
          <div className="text-center py-4 space-y-4">
            <Loader2 className="animate-spin text-primary mx-auto" size={24} />
            <p className="text-xs font-bold text-text-muted">กำลังกำหนดสิทธิ์การเข้าถึง...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <button 
              onClick={loginWithGoogle}
              className="w-full btn-primary py-3.5 flex justify-center items-center gap-3 shadow-lg shadow-primary/20"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 bg-white rounded-full p-0.5" />
              <span>เข้าสู่ระบบด้วย Google เพื่อตอบรับ</span>
            </button>
            <p className="text-[10px] text-center text-text-muted leading-relaxed">
              *หากอีเมลที่คุณใช้สมัครไม่ตรงกับที่ได้รับเชิญ ระบบจะยังคงให้สิทธิ์ตามบัญชีที่คุณเข้าสู่ระบบ
            </p>
          </div>
        )}

      </div>
    </motion.div>
  );
};
