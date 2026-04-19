import React from 'react';
import { motion } from 'motion/react';
import { Member, Package, Transaction, PackageTemplate, Branch, ServiceTemplate } from '../types';
import { Phone, User, Star, MapPin, Package as PkgIcon, History as HistoryIcon, Plus, Trash2, X, CreditCard, ChevronRight, Zap, Smartphone } from 'lucide-react';
import { formatTimestamp } from '../firebase';

interface MemberDetailsProps {
  member: Member;
  packages: Package[];
  transactions: Transaction[];
  onAddTransaction: (type: string, details?: any) => void;
  onUsePackage: (pkg: Package) => void;
  onDeleteMember: (id: string) => void;
  onPreviewSmartphone?: (memberId: string) => void;
  packageTemplates: PackageTemplate[];
  serviceTemplates: ServiceTemplate[];
  branches: Branch[];
}

export const MemberDetails: React.FC<MemberDetailsProps> = ({ 
  member, 
  packages, 
  transactions,
  onAddTransaction,
  onUsePackage,
  onDeleteMember,
  onPreviewSmartphone,
  packageTemplates,
  serviceTemplates,
  branches
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showPackageForm, setShowPackageForm] = React.useState(false);
  const [showPointsForm, setShowPointsForm] = React.useState(false);
  const [selectedPkgType, setSelectedPkgType] = React.useState<any>(null);
  const [selectedServiceType, setSelectedServiceType] = React.useState<ServiceTemplate | null>(null);
  const [serviceAmount, setServiceAmount] = React.useState<string>("");

  const handlePackageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const details = {
      serviceName: formData.get('title') as string,
      amount: Number(formData.get('price')),
      totalSessions: Number(formData.get('sessions')),
      pointsChange: Math.floor(Number(formData.get('price')) / 10) // Default 10% points
    };
    onAddTransaction('package_buy', details);
    setShowPackageForm(false);
    setSelectedPkgType(null);
  };

  const handlePointsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get('amount'));
    const serviceName = formData.get('serviceName') as string;
    const pointsChange = Math.floor(amount / 10);

    const details = {
      serviceName,
      amount,
      pointsChange
    };

    onAddTransaction('point_earn', details);
    setShowPointsForm(false);
    setSelectedServiceType(null);
    setServiceAmount("");
  };

  const handleServiceSelect = (service: ServiceTemplate) => {
    setSelectedServiceType(service);
    setServiceAmount(service.price.toString());
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header Profile */}
      <div className="glass-card p-10 flex flex-col md:flex-row items-center gap-10">
        <div className="w-32 h-32 bg-primary-light/20 flex items-center justify-center text-primary rounded-[32px] border border-primary/10 shadow-inner">
          <User size={64} strokeWidth={1.5} />
        </div>
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
             <h2 className="text-4xl font-serif font-bold tracking-tight text-text-main">{member.name}</h2>
             {onPreviewSmartphone && (
               <button onClick={() => onPreviewSmartphone(member.id)} className="bg-text-main text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-black transition-all shadow-md shrink-0">
                 <Smartphone size={16} /> ดูพรีวิวมือถือ
               </button>
             )}
          </div>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm">
            <a href={`tel:${member.phone}`} className="flex items-center gap-2 font-semibold text-text-muted hover:text-primary transition-all">
              <Phone size={16} /> <span>{member.phone}</span>
            </a>
            {member.preferredBranchId && (
              <span className="flex items-center gap-2 text-text-muted font-medium">
                <MapPin size={16} className="text-primary/60" /> <span>{branches.find(b => b.id === member.preferredBranchId)?.name || 'ไม่แจ้งสาขา'}</span>
              </span>
            )}
            <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-[10px] border border-primary/5">
                {member.tier}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end p-8 bg-bg rounded-[32px] border border-border/60 min-w-[200px]">
          <div className="text-[10px] uppercase font-black tracking-[0.2em] text-text-muted mb-2">แต้มสะสมทั้งหมด</div>
          <div className="text-5xl font-black text-primary font-serif">{member.points.toLocaleString()}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Active Packages */}
        <div className="space-y-4">
          <h3 className="text-16 font-semibold flex items-center gap-2 px-2">
            <PkgIcon size={18} className="text-primary" /> แพ็กเกจที่กำลังใช้งาน
          </h3>
          <div className="space-y-3">
            {packages.filter(p => p.status === 'active').length === 0 && (
              <div className="text-sm text-text-muted italic bg-white border border-border border-dashed p-6 rounded-2xl text-center">
                ยังไม่มีแพ็กเกจที่เปิดใช้งาน
              </div>
            )}
            {packages.filter(p => p.status === 'active').map(pkg => (
              <div key={pkg.id} className="glass-card p-5 flex items-center justify-between border-l-4 border-l-primary">
                <div>
                  <div className="font-bold text-sm mb-0.5">{pkg.title}</div>
                  <div className="text-xs text-text-muted">
                    คงเหลือ {pkg.remainingSessions} จาก {pkg.totalSessions} ครั้ง
                  </div>
                </div>
                <button 
                  onClick={() => onUsePackage(pkg)}
                  className="px-4 py-2 bg-text-main text-white text-xs rounded-lg font-bold hover:opacity-90 transition-all"
                >
                  ตัดรอบ
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent History */}
        <div className="space-y-4">
          <h3 className="text-16 font-semibold flex items-center gap-2 px-2">
            <HistoryIcon size={18} className="text-primary" /> ประวัติกิจกรรมล่าสุด
          </h3>
          <div className="glass-card divide-y divide-border/30 overflow-hidden">
            {transactions.slice(0, 5).map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between text-sm hover:bg-bg/50 transition-colors">
                <div>
                  <div className="font-bold">{t.serviceName || t.type.replace('_', ' ')}</div>
                  <div className="text-[10px] text-text-muted mt-0.5">{formatTimestamp(t.timestamp)}</div>
                </div>
                <div className={`font-bold ${t.pointsChange > 0 ? 'text-success' : 'text-red-500'}`}>
                  {t.pointsChange > 0 ? '+' : ''}{t.pointsChange} แต้ม
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
               <div className="p-8 text-center text-xs text-text-muted italic">ยังไม่มีประวัติกิจกรรม</div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-8 border-t border-border/50">
        <button onClick={() => setShowPointsForm(true)} className="btn-primary flex items-center gap-2 px-8 py-3.5">
          สะสมแต้มบริการ
        </button>
        <button onClick={() => setShowPackageForm(true)} className="btn-secondary flex items-center gap-2 px-8 py-3.5">
          ขายแพ็กเกจใหม่
        </button>
      </div>

      {/* Points Form Modal */}
      {showPointsForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-2xl p-0 overflow-hidden shadow-2xl flex flex-col md:flex-row h-auto max-h-[90vh]"
          >
            {/* Left Side: Services List */}
            <div className="w-full md:w-64 bg-accent-soft/30 border-r border-border p-6 overflow-y-auto">
              <h4 className="text-[10px] uppercase font-bold text-primary tracking-widest mb-4">เลือกบริการ</h4>
              <div className="space-y-2">
                {serviceTemplates.map(service => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                      selectedServiceType?.id === service.id 
                        ? 'bg-white border-primary shadow-sm' 
                        : 'bg-white/50 border-transparent hover:border-primary/30'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] font-bold text-text-main">{service.name}</div>
                      <div className="text-[10px] text-text-muted">{service.price}฿</div>
                    </div>
                    <Zap size={12} className={`transition-all ${selectedServiceType?.id === service.id ? 'scale-110 text-primary' : 'text-text-muted opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
                {serviceTemplates.length === 0 && (
                  <div className="text-[10px] text-text-muted italic p-2">
                    ยังไม่มีข้อมูลบริการ
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Points Form */}
            <div className="flex-1 p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Star size={20} className="text-primary" /> สะสมแต้มบริการ
                </h3>
                <button onClick={() => { setShowPointsForm(false); setSelectedServiceType(null); setServiceAmount(""); }} className="text-text-muted hover:text-text-main">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handlePointsSubmit} key={selectedServiceType?.id || 'custom-points'} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-muted block mb-1.5 ml-1">ชื่อบริการ</label>
                  <input 
                    name="serviceName" 
                    required 
                    placeholder="เช่น ทำสีผม, สปาเล็บ" 
                    defaultValue={selectedServiceType?.name || "บริการทั่วไป"}
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-muted block mb-1.5 ml-1">ยอดเงินที่ลูกค้าจ่ายจริง (บาท)</label>
                  <input 
                    name="amount" 
                    type="number" 
                    required 
                    placeholder="0.00" 
                    value={serviceAmount}
                    onChange={(e) => setServiceAmount(e.target.value)}
                    className="input-field text-xl font-bold" 
                  />
                </div>
                
                <div className="bg-accent-soft/50 p-4 rounded-2xl border border-primary/10">
                  <div className="text-[10px] uppercase font-bold text-text-muted mb-1 text-center">แต้มที่จะได้รับ (10.- = 1 แต้ม)</div>
                  <div className="text-28 font-black text-primary text-center">
                    {Math.floor(Number(serviceAmount) / 10) || 0}
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full btn-primary py-3.5 shadow-lg shadow-primary/20">
                    ยืนยันการสะสมแต้ม
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Package Form Modal */}
      {showPackageForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-lg p-0 overflow-hidden shadow-2xl flex flex-col md:flex-row h-auto max-h-[90vh]"
          >
            {/* Left Side: Predefined List */}
            <div className="w-full md:w-64 bg-accent-soft/30 border-r border-border p-6 overflow-y-auto">
              <h4 className="text-[10px] uppercase font-bold text-primary tracking-widest mb-4">เลือกจากรายการ</h4>
              <div className="space-y-2">
                {packageTemplates.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkgType(pkg)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                      selectedPkgType?.id === pkg.id 
                        ? 'bg-white border-primary shadow-sm' 
                        : 'bg-white/50 border-transparent hover:border-primary/30'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] font-bold text-text-main">{pkg.title}</div>
                      <div className="text-[10px] text-text-muted">{pkg.price}฿ • {pkg.sessions} ครั้ง</div>
                    </div>
                    <ChevronRight size={12} className={`transition-transform ${selectedPkgType?.id === pkg.id ? 'translate-x-1 text-primary' : 'text-text-muted opacity-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
                {packageTemplates.length === 0 && (
                  <div className="text-[10px] text-text-muted italic p-2">
                    ยังไม่มีข้อมูลแพ็กเกจ (ตั้งค่าได้ที่เมนูจัดการแพ็กเกจ)
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Custom Form */}
            <div className="flex-1 p-8">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold flex items-center gap-2">
                   <CreditCard size={20} className="text-primary" /> {selectedPkgType ? 'ยืนยันแพ็กเกจ' : 'ข้อมูลแพ็กเกจ'}
                 </h3>
                 <button onClick={() => { setShowPackageForm(false); setSelectedPkgType(null); }} className="text-text-muted hover:text-text-main">
                   <X size={20} />
                 </button>
              </div>

              <form onSubmit={handlePackageSubmit} key={selectedPkgType?.id || 'custom'} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-text-muted block mb-1.5 ml-1">ชื่อแพ็กเกจ</label>
                  <input name="title" required defaultValue={selectedPkgType?.title || "Gel Nails x10"} className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted block mb-1.5 ml-1">ราคา (บาท)</label>
                    <input name="price" type="number" required defaultValue={selectedPkgType?.price || "2500"} className="input-field" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-text-muted block mb-1.5 ml-1">จำนวนครั้ง</label>
                    <input name="sessions" type="number" required defaultValue={selectedPkgType?.sessions || "10"} className="input-field" />
                  </div>
                </div>
                <div className="pt-6">
                  <button type="submit" className="w-full btn-primary py-3.5 shadow-lg shadow-primary/20">
                    ยืนยันการขายแพ็กเกจ
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="pt-12">
        <div className="rounded-3xl border border-red-100 bg-red-50/30 p-8 flex flex-col items-center gap-4 text-center">
            {!showDeleteConfirm ? (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-2.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-xl hover:bg-red-50 transition-all shadow-sm"
              >
                ลบลูกค้ารายนี้
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onDeleteMember(member.id)}
                  className="px-6 py-2.5 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all shadow-md"
                >
                  ยืนยันการลบถาวร
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-2.5 bg-white text-text-muted text-xs font-bold rounded-xl border border-border hover:bg-bg transition-all"
                >
                  ยกเลิก
                </button>
              </div>
            )}

            <div className="max-w-md">
              <p className="text-xs text-red-900/60 font-medium">
                ลบข้อมูลลูกค้ารายนี้ออกจากระบบถาวร ข้อมูลแพ็กเกจและประวัติทั้งหมดไม่สามารถกู้คืนได้
              </p>
            </div>
        </div>
      </div>

    </motion.div>
  );
};
