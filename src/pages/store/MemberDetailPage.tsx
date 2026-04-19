import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';
import { 
  db, collection, doc, onSnapshot, query, where, orderBy, 
  addDoc, updateDoc, deleteDoc, getDocs, writeBatch, serverTimestamp,
  handleFirestoreError, OperationType
} from '../../firebase';
import { Member, Package, Transaction, PackageTemplate, ServiceTemplate } from '../../types';
import { MemberDetails } from '../../components/MemberDetails';

export const MemberDetailPage: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const { tenantId, branches } = useTenant();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [packageTemplates, setPackageTemplates] = useState<PackageTemplate[]>([]);
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);

  // Listen to member
  useEffect(() => {
    if (!memberId) return;
    const unsub = onSnapshot(doc(db, 'members', memberId), (snap) => {
      if (snap.exists()) {
        setMember({ id: snap.id, ...snap.data() } as Member);
      }
    });
    return () => unsub();
  }, [memberId]);

  // Listen to packages
  useEffect(() => {
    if (!memberId) return;
    const q = query(collection(db, 'packages'), where('memberId', '==', memberId));
    const unsub = onSnapshot(q, (snap) => {
      setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Package)));
    });
    return () => unsub();
  }, [memberId]);

  // Listen to transactions
  useEffect(() => {
    if (!memberId) return;
    const q = query(
      collection(db, 'transactions'),
      where('memberId', '==', memberId),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    });
    return () => unsub();
  }, [memberId]);

  // Listen to templates
  useEffect(() => {
    const q1 = query(collection(db, 'packageTemplates'), where('tenantId', '==', tenantId));
    const unsub1 = onSnapshot(q1, (snap) => {
      setPackageTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as PackageTemplate)));
    });

    const q2 = query(collection(db, 'serviceTemplates'), where('tenantId', '==', tenantId));
    const unsub2 = onSnapshot(q2, (snap) => {
      setServiceTemplates(snap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceTemplate)));
    });

    return () => { unsub1(); unsub2(); };
  }, [tenantId]);

  const recordTransaction = async (type: string, details?: any) => {
    if (!member) return;

    let pointsChange = details?.pointsChange || 0;
    let amount = details?.amount || 0;
    let service = details?.serviceName || 'Standard Service';

    if (type === 'point_earn' && !details) {
      amount = 500; pointsChange = 50; service = 'Gel Refresh';
    } else if (type === 'package_buy') {
      if (!details) { amount = 2500; pointsChange = 250; service = 'Premium Mani-Pedi x10'; }
      await addDoc(collection(db, 'packages'), {
        tenantId,
        memberId: member.id,
        title: service,
        totalSessions: details?.totalSessions || 10,
        remainingSessions: details?.totalSessions || 10,
        status: 'active',
        expiryDate: details?.expiryDate || null,
      });
    }

    await addDoc(collection(db, 'transactions'), {
      tenantId,
      memberId: member.id,
      type,
      amount,
      pointsChange,
      serviceName: service,
      timestamp: serverTimestamp(),
    });

    const memberRef = doc(db, 'members', member.id);
    const newTotal = member.totalSpent + amount;
    await updateDoc(memberRef, {
      points: member.points + pointsChange,
      totalSpent: newTotal,
      lastVisit: serverTimestamp(),
      tier: newTotal > 10000 ? 'Gold' : newTotal > 5000 ? 'Silver' : 'Bronze',
    });
  };

  const usePackageSession = async (pkg: Package) => {
    if (pkg.remainingSessions <= 0) return;
    await updateDoc(doc(db, 'packages', pkg.id), {
      remainingSessions: pkg.remainingSessions - 1,
      status: pkg.remainingSessions - 1 === 0 ? 'depleted' : 'active',
    });
    await addDoc(collection(db, 'transactions'), {
      tenantId,
      memberId: pkg.memberId,
      type: 'package_use',
      amount: 0,
      pointsChange: 0,
      serviceName: `Session used: ${pkg.title}`,
      timestamp: serverTimestamp(),
    });
  };

  const deleteMember = async (id: string) => {
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'members', id));

      const pkgsSnap = await getDocs(query(collection(db, 'packages'), where('memberId', '==', id)));
      pkgsSnap.forEach(d => batch.delete(d.ref));

      const txsSnap = await getDocs(query(collection(db, 'transactions'), where('memberId', '==', id)));
      txsSnap.forEach(d => batch.delete(d.ref));

      await batch.commit();
      navigate('/members');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `members/${id}`);
    }
  };

  if (!member) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-muted">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <MemberDetails
      member={member}
      packages={packages}
      transactions={transactions}
      onAddTransaction={recordTransaction}
      onUsePackage={usePackageSession}
      onDeleteMember={deleteMember}
      onPreviewSmartphone={(id) => navigate(`/preview?member=${id}`)}
      packageTemplates={packageTemplates}
      serviceTemplates={serviceTemplates}
      branches={branches}
    />
  );
};
