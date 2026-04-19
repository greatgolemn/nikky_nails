/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserPlus, BarChart3, Settings, LogOut, Search, 
  Smartphone, Plus, Menu, X, ArrowLeft, Gem, CreditCard,
  Phone, MapPin, Map as MapIcon, Trash2, Save, Edit, History, Calendar, ChevronRight
} from 'lucide-react';
import { 
  auth, db, googleProvider, signInWithPopup, OperationType, handleFirestoreError,
  collection, onSnapshot, query, where, orderBy, doc, addDoc, updateDoc, deleteDoc, writeBatch, getDocs,
  serverTimestamp, Timestamp, setDoc
} from './firebase';
import { Member, Package, Transaction, SalonStats, PackageTemplate, ShopConfig, Branch, ServiceTemplate } from './types';
import { MemberDetails } from './components/MemberDetails';
import { CustomerCard } from './components/CustomerCard';
import { CRMCharts } from './components/CRMCharts';
import { PackageTemplatesManager } from './components/PackageTemplatesManager';
import { ServiceTemplatesManager } from './components/ServiceTemplatesManager';
import { BookingManager } from './components/BookingManager';
import { BookingForm } from './components/BookingForm';
import { BusinessHoursManager } from './components/BusinessHoursManager';
import { MapPicker } from './components/MapPicker';

type View = 'dashboard' | 'members' | 'bookings' | 'add-member' | 'customer-sim' | 'packages' | 'settings';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [packageTemplates, setPackageTemplates] = useState<PackageTemplate[]>([]);
  const [serviceTemplates, setServiceTemplates] = useState<ServiceTemplate[]>([]);
  const [shopConfig, setShopConfig] = useState<ShopConfig>({ shopName: 'Nickki nail' });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isEditingShopInfo, setIsEditingShopInfo] = useState(false);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeCatalogTab, setActiveCatalogTab] = useState<'packages' | 'services'>('packages');
  const [bookings, setBookings] = useState<any[]>([]);
  const [tempBusinessHours, setTempBusinessHours] = useState<any[]>([]);
  
  // Custom state just for the mobile preview
  const [previewMemberId, setPreviewMemberId] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      setUser(user);
    });
  }, []);

  // Data Sync
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Member[];
      setMembers(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'members'));

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'shopConfig', 'main'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ShopConfig;
        setShopConfig(data);
        if (data.businessHours) {
          setTempBusinessHours(data.businessHours);
        }
      }
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'branches'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Branch[];
      setBranches(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'branches'));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'packageTemplates'), orderBy('title', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as PackageTemplate[];
      setPackageTemplates(data);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'serviceTemplates'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ServiceTemplate[];
      setServiceTemplates(data);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setBookings(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'bookings'));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    // If no specific member is selected in member details view, try to fall back to the selected preview member
    // or the first member strictly for populating the smartphone preview mockup side.
    const memberIdToFetch = selectedMember?.id || previewMemberId || (members.length > 0 ? members[0].id : null);

    if (!memberIdToFetch) {
      setPackages([]);
      setTransactions([]);
      return;
    }

    const pkgQ = query(collection(db, 'packages'), where('memberId', '==', memberIdToFetch));
    const unsubPkgs = onSnapshot(pkgQ, (snapshot) => {
      setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Package[]);
    });

    const txQ = query(collection(db, 'transactions'), where('memberId', '==', memberIdToFetch), orderBy('timestamp', 'desc'));
    const unsubTxs = onSnapshot(txQ, (snapshot) => {
      setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[]);
    });

    return () => { unsubPkgs(); unsubTxs(); };
  }, [selectedMember, previewMemberId, members]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMember = {
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      preferredBranchId: formData.get('preferredBranchId') as string || null,
      points: 0,
      totalSpent: 0,
      tier: 'Bronze' as const,
      createdAt: serverTimestamp(),
      lastVisit: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, 'members'), newMember);
      setCurrentView('members');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'members');
    }
  };

  const handleAddTemplate = async (template: Omit<PackageTemplate, 'id'>) => {
    try {
      await addDoc(collection(db, 'packageTemplates'), template);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'packageTemplates');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'packageTemplates', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'packageTemplates');
    }
  };

  const handleAddService = async (service: Omit<ServiceTemplate, 'id'>) => {
    try {
      await addDoc(collection(db, 'serviceTemplates'), service);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'serviceTemplates');
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'serviceTemplates', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'serviceTemplates');
    }
  };

  const handleUpdateShopConfig = async (config: Partial<ShopConfig>) => {
    try {
      const configRef = doc(db, 'shopConfig', 'main');
      await setDoc(configRef, { ...shopConfig, ...config }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shopConfig');
    }
  };

  const handleAddBranch = async (branch: Omit<Branch, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'branches'), {
        ...branch,
        createdAt: serverTimestamp()
      });
      setShowAddBranch(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'branches');
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('ยืนยันการลบสาขานี้?')) return;
    try {
      await deleteDoc(doc(db, 'branches', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'branches');
    }
  };

  const handleUpdateBranch = async (id: string, branch: Partial<Branch>) => {
    try {
      await updateDoc(doc(db, 'branches', id), branch);
      setEditingBranch(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'branches');
    }
  };

  const recordTransaction = async (type: string, details?: any) => {
    if (!selectedMember) return;
    
    let pointsChange = details?.pointsChange || 0;
    let amount = details?.amount || 0;
    let service = details?.serviceName || "Standard Service";

    if (type === 'point_earn') {
      if (!details) {
        amount = 500;
        pointsChange = 50;
        service = "Gel Refresh";
      }
    } else if (type === 'package_buy') {
      if (!details) {
        amount = 2500;
        pointsChange = 250;
        service = "Premium Mani-Pedi x10";
      }
      
      // Add the package
      await addDoc(collection(db, 'packages'), {
        memberId: selectedMember.id,
        title: service,
        totalSessions: details?.totalSessions || 10,
        remainingSessions: details?.totalSessions || 10,
        status: 'active',
        expiryDate: details?.expiryDate || null
      });
    }

    await addDoc(collection(db, 'transactions'), {
      memberId: selectedMember.id,
      type,
      amount,
      pointsChange,
      serviceName: service,
      timestamp: serverTimestamp()
    });

    // Update member points
    const memberRef = doc(db, 'members', selectedMember.id);
    await updateDoc(memberRef, {
      points: selectedMember.points + pointsChange,
      totalSpent: selectedMember.totalSpent + amount,
      lastVisit: serverTimestamp(),
      tier: (selectedMember.totalSpent + amount > 10000) ? 'Gold' : (selectedMember.totalSpent + amount > 5000) ? 'Silver' : 'Bronze'
    });
  };

  const deleteMember = async (memberId: string) => {
    try {
      const batch = writeBatch(db);
      
      // 1. Delete member doc
      batch.delete(doc(db, 'members', memberId));
      
      // 2. Delete related packages
      const pkgsQuery = query(collection(db, 'packages'), where('memberId', '==', memberId));
      const pkgsSnap = await getDocs(pkgsQuery);
      pkgsSnap.forEach(d => batch.delete(d.ref));
      
      // 3. Delete related transactions
      const txsQuery = query(collection(db, 'transactions'), where('memberId', '==', memberId));
      const txsSnap = await getDocs(txsQuery);
      txsSnap.forEach(d => batch.delete(d.ref));
      
      await batch.commit();
      setSelectedMember(null);
      setCurrentView('members');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `members/${memberId}`);
    }
  };

  const usePackageSession = async (pkg: Package) => {
    if (pkg.remainingSessions <= 0) return;

    const pkgRef = doc(db, 'packages', pkg.id);
    await updateDoc(pkgRef, {
      remainingSessions: pkg.remainingSessions - 1,
      status: pkg.remainingSessions - 1 === 0 ? 'depleted' : 'active'
    });

    await addDoc(collection(db, 'transactions'), {
      memberId: pkg.memberId,
      type: 'package_use',
      amount: 0,
      pointsChange: 0,
      serviceName: `Session used: ${pkg.title}`,
      timestamp: serverTimestamp()
    });
  };

  const handleCreateBooking = async (bookingData: any) => {
    try {
      await addDoc(collection(db, 'bookings'), {
        ...bookingData,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'bookings');
    }
  };

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'bookings');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bookings', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'bookings');
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.phone.includes(searchQuery)
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_#c4a48420,_transparent)]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-card rounded-[40px] p-12 text-center"
        >
          <div className="w-20 h-20 bg-primary text-white rounded-3xl mx-auto flex items-center justify-center mb-8 rotate-12">
            <Gem size={40} />
          </div>
          <h1 className="text-4xl font-display mb-4">{shopConfig.shopName}</h1>
          <p className="text-muted mb-8 leading-relaxed">
            Professional CRM system to know your customers, track packages, and grow your salon loyalty.
          </p>
          <button onClick={handleLogin} className="w-full btn-primary py-4 text-lg">
            Login as Salon Admin
          </button>
          <div className="mt-8 text-xs text-muted uppercase tracking-widest border-t border-black/5 pt-8">
            The standard in boutique CRM
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            
            <motion.div 
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              className="w-64 bg-sidebar-bg text-text-main flex flex-col z-50 fixed md:relative h-full max-h-screen border-r border-border shadow-2xl md:shadow-none overflow-y-auto scrollbar-hide"
            >
              <div className="p-8 pb-12 flex items-center justify-between">
                 <span className="text-xl font-bold text-primary">✨ {shopConfig.shopName}</span>
                 <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-text-muted">
                   <X size={20} />
                 </button>
              </div>
              
              <nav className="flex-1 px-4 space-y-1">
                {[
                  { id: 'dashboard', icon: <BarChart3 size={18}/>, label: 'แดชบอร์ด' },
                  { id: 'members', icon: <Users size={18}/>, label: 'รายชื่อลูกค้า' },
                  { id: 'bookings', icon: <Calendar size={18}/>, label: 'รายการจองคิว' },
                  { id: 'packages', icon: <CreditCard size={18}/>, label: 'บริการ & แพ็กเกจ' },
                  { id: 'add-member', icon: <UserPlus size={18}/>, label: 'ลงทะเบียนลูกค้า' },
                  { id: 'customer-sim', icon: <Smartphone size={18}/>, label: 'พรีวิวสมาร์ทโฟน' },
                  { id: 'settings', icon: <Settings size={18}/>, label: 'ตั้งค่าระบบ' },
                ].map((item) => (
                  <NavBtn 
                    key={item.id}
                    active={currentView === item.id} 
                    icon={item.icon} 
                    label={item.label} 
                    onClick={() => {
                      setCurrentView(item.id as View); 
                      setSelectedMember(null);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }} 
                  />
                ))}
              </nav>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-full bg-accent-soft flex items-center justify-center text-primary font-bold overflow-hidden border border-border">
                  {user.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-semibold truncate">{user.email}</p>
                  <p className="text-[10px] text-text-muted">Administrator</p>
                </div>
              </div>
              <button 
                onClick={() => auth.signOut()}
                className="flex items-center gap-2 text-xs text-text-muted hover:text-text-main transition-colors"
              >
                <LogOut size={14} /> ออกจากระบบ
              </button>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-bg relative">
        <header className="h-24 flex items-center justify-between px-10 bg-bg/80 backdrop-blur-md sticky top-0 z-30 border-b border-border/40">
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-3 bg-white border border-border rounded-2xl text-text-muted hover:text-primary transition-all hover:shadow-md">
              {isSidebarOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
            <h2 className="text-xl font-bold font-serif hidden lg:block">{shopConfig.shopName} CRM</h2>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="relative group hidden md:block">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" size={16} />
              <input 
                type="text" 
                placeholder="ค้นหาลูกค้าด้วยชื่อหรือเบอร์โทร..." 
                className="pl-13 pr-6 py-3.5 bg-white border border-border rounded-2xl text-sm w-96 outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {currentView === 'dashboard' && !selectedMember && (
              <button 
                onClick={() => setCurrentView('add-member')}
                className="btn-primary !px-5 !py-2.5 !text-sm flex items-center gap-2"
              >
                <Plus size={16} />
                <span>เพิ่มลูกค้าใหม่</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 max-w-7xl mx-auto w-full scroll-smooth">
          <AnimatePresence mode="wait">
            {selectedMember ? (
              <MemberDetails 
                key="details"
                member={members.find(m => m.id === selectedMember.id) || selectedMember} 
                packages={packages} 
                transactions={transactions}
                onAddTransaction={recordTransaction}
                onUsePackage={usePackageSession}
                onDeleteMember={deleteMember}
                onPreviewSmartphone={(id) => {
                  setPreviewMemberId(id);
                  setSelectedMember(null);
                  setCurrentView('customer-sim');
                }}
                packageTemplates={packageTemplates}
                serviceTemplates={serviceTemplates}
                branches={branches}
              />
            ) : currentView === 'dashboard' ? (
              <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                <div className="flex flex-col gap-1">
                  <h1 className="text-4xl font-serif font-black tracking-tight text-text-main leading-snug">
                    {new Date().getHours() < 12 ? 'อรุณสวัสดิ์' : 
                     new Date().getHours() < 16 ? 'สวัสดีตอนบ่าย' : 
                     new Date().getHours() < 19 ? 'สวัสดีตอนเย็น' : 'สวัสดีตอนค่ำ'}
                     <span className="block text-primary italic font-medium mt-2">{shopConfig.shopName}</span>
                  </h1>
                  <p className="text-sm text-text-muted">วันนี้มีลูกค้าใหม่เพิ่มขึ้น {members.filter(m => m.points === 0).length} ท่าน</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    label="ลูกค้าทั้งหมด" 
                    value={members.length} 
                    trend={`+${members.filter(m => m.points === 0).length} รายการใหม่`} 
                    color="primary" 
                  />
                  <StatCard 
                    label="ลูกค้าระดับ Gold" 
                    value={members.filter(m => m.tier === 'Gold').length} 
                    trend="ยอดสะสม > 10,000" 
                    color="gold" 
                  />
                  <StatCard 
                    label="ลูกค้าระดับ Silver" 
                    value={members.filter(m => m.tier === 'Silver').length} 
                    trend="ยอดสะสม > 5,000" 
                    color="silver" 
                  />
                  <StatCard 
                    label="ลูกค้าระดับ Bronze" 
                    value={members.filter(m => m.tier === 'Bronze').length} 
                    trend="ลูกค้าทั่วไป" 
                    color="bronze" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                  <div className="md:col-span-2 glass-card p-6">
                    <h3 className="text-16 font-semibold mb-6">กิจกรรมล่าสุด (Real-time)</h3>
                    <div className="divide-y divide-border/30">
                      {members.slice(0, 5).map(m => (
                        <div key={m.id} className="grid grid-cols-[48px_1fr_auto] items-center py-4">
                          <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-400">
                            {m.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="activity-info">
                            <p className="text-sm font-semibold">{m.name}</p>
                            <span className="text-xs text-text-muted">สมัครลูกค้าใหม่ (CRM)</span>
                          </div>
                          <div className="text-sm font-bold text-primary">+ 10 แต้ม</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-6 bg-accent-soft/30 border-primary/20">
                    <h3 className="text-16 font-semibold mb-4">เช็กแต้มด่วน</h3>
                    <input 
                      type="text" 
                      className="input-field mb-4" 
                      placeholder="ใส่ชื่อหรือเบอร์โทร" 
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {filteredMembers.length > 0 && searchQuery.length > 3 ? (
                      <div className="p-4 bg-white rounded-xl border border-border shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <strong className="text-sm">{filteredMembers[0].name}</strong>
                          <span className="text-[10px] bg-accent-soft text-primary px-2 py-0.5 rounded font-bold uppercase">{filteredMembers[0].tier} Member</span>
                        </div>
                        <div className="mb-4">
                          <a 
                            href={`tel:${filteredMembers[0].phone}`} 
                            className="flex items-center gap-1.5 w-fit text-xs text-text-muted hover:text-primary hover:underline transition-all"
                          >
                            <Phone size={10} className="opacity-80" />
                            {filteredMembers[0].phone}
                          </a>
                        </div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-text-muted">แต้มสะสม:</span>
                          <span className="font-bold">{filteredMembers[0].points} แต้ม</span>
                        </div>
                        <div className="flex justify-between text-xs mb-4">
                          <span className="text-text-muted">สมัครเมื่อ:</span>
                          <span className="font-bold">{new Date(filteredMembers[0].createdAt?.toDate()).toLocaleDateString() || 'n/a'}</span>
                        </div>
                        <button 
                          onClick={() => { setSelectedMember(filteredMembers[0]); setCurrentView('dashboard' as any); /* Logic to show details */ }}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass-card p-6">
                    <h3 className="text-base font-semibold mb-6">ภาพรวมรายได้</h3>
                    {members.length > 0 ? (
                      <CRMCharts type="revenue" data={[
                        { name: 'Mon', revenue: members.filter(m => m.tier === 'Bronze').length * 500 },
                        { name: 'Tue', revenue: 0 },
                        { name: 'Wed', revenue: members.filter(m => m.tier === 'Silver').length * 1500 },
                        { name: 'Thu', revenue: 0 },
                        { name: 'Fri', revenue: members.filter(m => m.tier === 'Gold').length * 3000 },
                        { name: 'Sat', revenue: 0 },
                        { name: 'Sun', revenue: 0 },
                      ]} />
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-text-muted text-sm italic">ไม่มีข้อมูลรายได้</div>
                    )}
                  </div>
                  <div className="glass-card p-6">
                    <h3 className="text-base font-semibold mb-6">ยอดการจองคิว</h3>
                    {members.length > 0 ? (
                      <CRMCharts type="visits" data={[
                        { name: 'W1', visits: members.length },
                        { name: 'W2', visits: 0 },
                        { name: 'W3', visits: 0 },
                        { name: 'W4', visits: 0 },
                      ]} />
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-text-muted text-sm italic">ไม่มีรายการจอง</div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : currentView === 'members' ? (
              <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="relative group flex-1 sm:max-w-md">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" size={16} />
                      <input 
                        type="text" 
                        placeholder="ค้นหาชื่อหรือเบอร์โทร..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button onClick={() => setCurrentView('add-member')} className="btn-primary whitespace-nowrap">
                      + เพิ่มลูกค้าใหม่
                    </button>
                  </div>
                  <h2 className="text-24 font-bold">รายชื่อลูกค้า</h2>
                </div>
                {filteredMembers.length === 0 && (
                   <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-border shadow-sm">
                      <Search size={48} className="mx-auto text-text-muted/30 mb-4" />
                      <p className="text-text-muted font-bold">ไม่พบรายชื่อลูกค้านี้ในระบบ</p>
                   </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMembers.map(m => (
                    <motion.div 
                      key={m.id} 
                      whileHover={{ y: -4 }}
                      onClick={() => setSelectedMember(m)}
                      className="glass-card p-6 cursor-pointer hover:border-primary/40 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                          <Users size={20} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 bg-accent-soft rounded">{m.tier}</span>
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
                          <p className="text-[10px] uppercase font-bold text-text-muted">รายการล่าสุด</p>
                          <p className="text-sm font-bold text-success">+ 50 แต้ม</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : currentView === 'bookings' ? (
              <motion.div key="bookings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <BookingManager 
                   bookings={bookings} 
                   onUpdateStatus={handleUpdateBookingStatus} 
                   onDelete={handleDeleteBooking} 
                />
              </motion.div>
            ) : currentView === 'packages' ? (
              <motion.div key="tpls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-6 pt-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 bg-white p-6 rounded-3xl border border-border shadow-sm">
                  <div>
                    <h2 className="text-24 font-bold tracking-tight">แคตตาล็อกร้านค้า</h2>
                    <p className="text-sm text-text-muted mt-1">ตั้งค่าชื่อบริการและแพ็กเกจเพื่อให้พนักงานเลือกใช้งานง่ายขึ้น</p>
                  </div>
                  <div className="flex bg-accent-soft/30 p-1.5 rounded-xl border border-border/50">
                    <button 
                      onClick={() => setActiveCatalogTab('packages')}
                      className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeCatalogTab === 'packages' ? 'bg-primary text-white shadow-md ring-1 ring-primary' : 'text-text-muted hover:text-text-main'}`}
                    >
                      แพ็กเกจเหมาจ่าย
                    </button>
                    <button 
                      onClick={() => setActiveCatalogTab('services')}
                      className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeCatalogTab === 'services' ? 'bg-primary text-white shadow-md ring-1 ring-primary' : 'text-text-muted hover:text-text-main'}`}
                    >
                      บริการ (รายครั้ง)
                    </button>
                  </div>
                </div>

                {activeCatalogTab === 'packages' ? (
                  <PackageTemplatesManager 
                    templates={packageTemplates}
                    onAdd={handleAddTemplate}
                    onDelete={handleDeleteTemplate}
                  />
                ) : (
                  <ServiceTemplatesManager 
                    services={serviceTemplates}
                    onAdd={handleAddService}
                    onDelete={handleDeleteService}
                  />
                )}
              </motion.div>
            ) : currentView === 'add-member' ? (
              <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto py-12">
                 <h2 className="text-24 font-bold mb-8 text-center text-primary">ลงทะเบียนลูกค้าใหม่</h2>
                 <form onSubmit={handleAddMember} className="glass-card p-10 space-y-6">
                    <div>
                      <label className="text-xs uppercase font-bold text-text-muted mb-2 block">ชื่อ-นามสกุล</label>
                      <input name="name" required placeholder="เช่น คุณสมศรี ใจดี" className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs uppercase font-bold text-text-muted mb-2 block">เบอร์โทรศัพท์</label>
                      <input name="phone" required placeholder="08x-xxx-xxxx" className="input-field" />
                    </div>
                    <div>
                      <label className="text-xs uppercase font-bold text-text-muted mb-2 block">สาขาที่ลงทะเบียน</label>
                      <select name="preferredBranchId" className="input-field bg-white">
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
            ) : currentView === 'settings' ? (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto space-y-8 py-8">
                <div className="flex items-center gap-4 mb-8 px-4">
                   <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Settings size={24} />
                   </div>
                   <div>
                      <h2 className="text-24 font-bold">ตั้งค่าระบบ</h2>
                      <p className="text-sm text-text-muted text-balance">จัดการข้อมูลพื้นฐาน พิกัดตำแหน่ง และเวลาทำการของร้านค้า</p>
                   </div>
                </div>

                <div className="glass-card overflow-hidden">
                   <div className="p-6 border-b border-border bg-accent-soft/30">
                      <h3 className="font-bold text-sm uppercase tracking-wider text-primary">ข้อมูลร้านค้าและการตั้งค่า</h3>
                   </div>
                   <div className="p-8">
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          handleUpdateShopConfig({ 
                             shopName: formData.get('shopName') as string,
                             shopPhone: formData.get('shopPhone') as string,
                             businessHours: tempBusinessHours
                           });
                           setIsEditingShopInfo(false);
                           setIsEditingHours(false);
                        }}
                        className="space-y-12"
                      >
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="space-y-6">
                               <div className="space-y-4">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                                     <Users size={14} className="text-primary" /> ข้อมูลพื้นฐาน
                                  </h4>
                                  <div>
                                     <label className="text-[10px] uppercase font-bold text-text-muted mb-2 block ml-1">ชื่อร้านค้า</label>
                                     <input 
                                       name="shopName" 
                                       defaultValue={shopConfig.shopName} 
                                       readOnly={!isEditingShopInfo}
                                       className={`input-field w-full ${!isEditingShopInfo ? 'bg-bg/50 border-transparent' : 'bg-white'}`}
                                     />
                                  </div>
                                  <div>
                                     <label className="text-[10px] uppercase font-bold text-text-muted mb-2 block ml-1">เบอร์โทรศัพท์ร้านค้า</label>
                                     <input 
                                       name="shopPhone" 
                                       readOnly={!isEditingShopInfo}
                                       defaultValue={shopConfig.shopPhone} 
                                       className={`input-field w-full ${!isEditingShopInfo ? 'bg-bg/50 border-transparent' : 'bg-white'}`}
                                     />
                                  </div>
                                  <button 
                                    type="button"
                                    onClick={() => setIsEditingShopInfo(!isEditingShopInfo)}
                                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${isEditingShopInfo ? 'bg-red-50 text-red-600' : 'btn-secondary'}`}
                                   >
                                     {isEditingShopInfo ? 'ยกเลิกการแก้ไขข้อมูลพื้นฐาน' : 'แก้ไขข้อมูลพื้นฐาน'}
                                   </button>
                               </div>
                               <div className="p-6 bg-accent-soft/20 rounded-3xl border border-primary/10">
                                  <p className="text-xs text-text-muted leading-relaxed italic">"ข้อมูลส่วนนี้จะใช้สำหรับแสดงผลในหน้าพรีวิวสมาร์ทโฟนของลูกค้า เพื่อให้ลูกค้าติดต่อและจดจำแบรนด์ร้านคุณได้ง่ายขึ้น"</p>
                               </div>
                            </div>

                            <div>
                               <div className="mb-4">
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
                                     <Calendar size={14} className="text-primary" /> เวลาทำการ
                                  </h4>
                               </div>
                               <BusinessHoursManager 
                                 businessHours={tempBusinessHours.length > 0 ? tempBusinessHours : (shopConfig.businessHours || [])}
                                 isEditing={isEditingHours}
                                 onUpdate={setTempBusinessHours}
                               />
                                <button 
                                  type="button"
                                  onClick={() => setIsEditingHours(!isEditingHours)}
                                  className={`w-full mt-4 py-2.5 rounded-xl text-xs font-bold transition-all ${isEditingHours ? 'bg-red-50 text-red-600' : 'btn-secondary'}`}
                                 >
                                   {isEditingHours ? 'ยกเลิกการแก้ไขเวลาทำการ' : 'แก้ไขเวลาทำการ'}
                                 </button>
                            </div>
                         </div>

                         {(isEditingShopInfo || isEditingHours) && (
                           <div className="flex justify-end pt-8 border-t border-border/50">
                             <button type="submit" className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm">
                               <Save size={16} /> บันทึกข้อมูลที่แก้ไข
                             </button>
                           </div>
                         )}
                      </form>
                   </div>
                </div>

                <div className="glass-card overflow-hidden">
                   <div className="p-6 border-b border-border bg-accent-soft/30 flex justify-between items-center">
                      <h3 className="font-bold text-sm uppercase tracking-wider text-primary">จัดการสาขา</h3>
                       <button 
                         onClick={() => setShowAddBranch(true)}
                         className="btn-primary py-2 px-4 text-xs flex items-center gap-2 shadow-sm"
                       >
                         <Plus size={14} /> เพิ่มสาขาใหม่
                       </button>
                    </div>
                    <div className="p-8 space-y-6">
                       {(showAddBranch || editingBranch) && (
                         <motion.div 
                           initial={{ opacity: 0, scale: 0.95 }} 
                           animate={{ opacity: 1, scale: 1 }}
                           className="bg-accent-soft/10 p-6 rounded-3xl border border-primary/10 space-y-4 mb-4"
                         >
                            <div className="flex justify-between items-center">
                               <h4 className="font-bold text-sm text-text-main">{editingBranch ? 'แก้ไขข้อมูลสาขา' : 'ข้อมูลสาขาใหม่'}</h4>
                               <button onClick={() => { setShowAddBranch(false); setEditingBranch(null); }} className="text-text-muted hover:text-text-main group">
                                  <X size={16} className="group-hover:rotate-90 transition-transform"/>
                               </button>
                            </div>
                            <form onSubmit={(e) => {
                              e.preventDefault();
                              const formData = new FormData(e.currentTarget);
                              const lat = Number(formData.get('lat'));
                              const lng = Number(formData.get('lng'));
                               
                               if (!lat || !lng) {
                                 alert('กรุณาปักหมุดตำแหน่งร้านบนแผนที่');
                                 return;
                               }

                               if (editingBranch) {
                                  handleUpdateBranch(editingBranch.id, {
                                    name: formData.get('name') as string,
                                    phone: formData.get('phone') as string,
                                    lat: lat,
                                    lng: lng,
                                    address: formData.get('address') as string
                                  });
                               } else {
                                  handleAddBranch({
                                    name: formData.get('name') as string,
                                    phone: formData.get('phone') as string,
                                    lat: lat,
                                    lng: lng,
                                    address: formData.get('address') as string
                                  });
                               }
                             }} className="space-y-4">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                     <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block ml-1">ชื่อสาขา</label>
                                     <input name="name" required defaultValue={editingBranch?.name} placeholder="เช่น สาขาสยาม" className="input-field w-full" />
                                  </div>
                                  <div>
                                     <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block ml-1">เบอร์โทรสาขา</label>
                                     <input name="phone" defaultValue={editingBranch?.phone} placeholder="08x-xxx-xxxx" className="input-field w-full" />
                                  </div>
                               </div>
                               <div>
                                  <label className="text-[10px] uppercase font-bold text-text-muted mb-1 block ml-1">ที่อยู่สาขา</label>
                                  <input name="address" defaultValue={editingBranch?.address} placeholder="เลขที่, อาคาร, ถนน..." className="input-field w-full" />
                               </div>
                               
                               <div className="pt-2">
                                  <label className="text-[10px] uppercase font-bold text-text-muted mb-2 block ml-1">ปักหมุดตำแหน่ง</label>
                                  <MapPicker initialPos={editingBranch ? { lat: editingBranch.lat, lng: editingBranch.lng } : undefined} 
                                    onSelect={(pos) => {
                                      const latInput = document.getElementById('new-branch-lat') as HTMLInputElement;
                                      const lngInput = document.getElementById('new-branch-lng') as HTMLInputElement;
                                      if (latInput && lngInput) {
                                        latInput.value = pos.lat.toString();
                                        lngInput.value = pos.lng.toString();
                                      }
                                    }}
                                  />
                                  <input type="hidden" name="lat" id="new-branch-lat" defaultValue={editingBranch?.lat} />
                                  <input type="hidden" name="lng" id="new-branch-lng" defaultValue={editingBranch?.lng} />
                               </div>

                               <button type="submit" className="w-full btn-primary py-3.5 shadow-lg shadow-primary/20">{editingBranch ? "บันทึกการแก้ไข" : "บันทึกสาขา"}</button>
                            </form>
                         </motion.div>
                       )}

                       <div className="space-y-3">
                          {branches.length === 0 ? (
                            <div className="text-center py-12 bg-bg/50 rounded-3xl border border-dashed border-border flex flex-col items-center">
                               <MapIcon size={32} className="text-neutral-100 mb-2" />
                               <p className="text-sm text-text-muted italic">ยังไม่มีข้อมูลสาขา</p>
                               <button onClick={() => setShowAddBranch(true)} className="mt-4 text-xs text-primary font-bold hover:underline">เพิ่มสาขาแรกของคุณที่นี่</button>
                            </div>
                          ) : (
                            branches.map(branch => (
                              <div key={branch.id} className="bg-white p-5 rounded-2xl border border-border flex items-center justify-between gap-4 group hover:shadow-sm transition-all border-l-4 border-l-primary/30 min-w-0">
                                <div className="flex items-center gap-4 min-w-0">
                                   <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                                      <MapPin size={20} />
                                   </div>
                                   <div className="flex-1 min-w-0">
                                       <div className="font-bold text-sm tracking-tight truncate">{branch.name}</div>
                                      <div className="text-[10px] text-text-muted flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                                         {branch.phone && <span className="flex items-center gap-1"><Phone size={10} />{branch.phone}</span>}
                                         {branch.address && <span className="truncate">• {branch.address}</span>}
                                      </div>
                                   </div>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                   <a 
                                     href={`https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`}
                                     target="_blank"
                                     rel="noreferrer"
                                     className="p-2 text-primary hover:bg-accent-soft rounded-lg transition-colors"
                                     title="เปิดแผนที่"
                                   >
                                     <MapIcon size={18} />
                                   </a>
                                   <button 
                                     onClick={() => { setEditingBranch(branch); setShowAddBranch(false); }}
                                      className="p-2 text-text-muted hover:bg-neutral-100 rounded-lg transition-colors"
                                      title="แก้ไขสาขา"
                                    >
                                      <Edit size={18} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteBranch(branch.id)}
                                     className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                     title="ลบสาขา"
                                   >
                                     <Trash2 size={18} />
                                   </button>
                                </div>
                              </div>
                            ))
                          )}
                       </div>
                    </div>

                 </div>
              </motion.div>
            ) : (
              <motion.div key="sim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative h-full flex flex-col items-center justify-center py-6">
                 
                 {/* Preview Selector */}
                 {members.length > 0 && (
                   <div className="mb-6 w-[375px] flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl shadow-sm border border-border">
                     <span className="text-xs font-bold text-text-muted">พรีวิวในหน้าจอของ:</span>
                     <select 
                       className="text-sm font-bold bg-transparent outline-none cursor-pointer max-w-[150px] truncate text-primary"
                       value={previewMemberId || members[0].id}
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
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-text-main rounded-b-2xl z-50"></div>
                    <div className="w-full h-full rounded-[40px] overflow-hidden bg-white">
                      {members.length > 0 ? (
                        <div className="h-full flex flex-col">
                          <div className="flex-1 overflow-auto">
                            <CustomerCard 
                               member={members.find(m => m.id === (previewMemberId || members[0].id)) || members[0]} 
                               packages={packages.filter(p => p.memberId === (previewMemberId || members[0].id))} 
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
                           
                           <button 
                             onClick={async () => {
                               try {
                                 const res = await fetch('/api/simulate-line-follow', {
                                   method: 'POST',
                                   headers: { 'Content-Type': 'application/json' },
                                   body: JSON.stringify({ userId: 'U' + Math.random().toString(36).slice(2, 9), displayName: 'คุณจำลอง (LINE)' })
                                 });
                                 const data = await res.json();
                                 alert(data.message || 'Simulated successfully');
                               } catch (err) {
                                 console.error(err);
                               }
                             }}
                             className="btn-primary w-full bg-[#06C755] border-none text-white hover:bg-[#05a647]"
                           >
                             จำลองการแอดไลน์ (Auto Signup)
                           </button>
                        </div>
                      )}
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

function NavBtn({ icon, label, onClick, active }: any) {
  return (
    <button 
      onClick={onClick}
      className={`sidebar-item group w-full ${active ? 'sidebar-item-active' : ''}`}
    >
      <div className={`${active ? 'text-primary' : 'text-text-muted group-hover:text-primary-dark shadow-sm'} transition-colors`}>
        {icon}
      </div>
      <span className="text-sm font-semibold tracking-wide">{label}</span>
    </button>
  );
}

function StatCard({ label, value, trend, color }: any) {
  const getColors = () => {
    switch(color) {
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
          <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center text-[10px] font-bold ${colors.text}`}>
             {color.charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <h4 className={`text-4xl font-bold tracking-tight font-serif ${colors.text}`}>{value}</h4>
          <div className="flex items-center gap-1.5 py-1 px-2.5 bg-bg rounded-lg w-fit border border-border/50">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${color === 'primary' ? 'text-primary' : 'text-text-muted'}`}>{trend}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

