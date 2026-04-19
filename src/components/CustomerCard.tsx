import React, { useState } from 'react';
import { Member, Package, Branch, ServiceTemplate, Booking, ShopConfig } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { BookingForm } from './BookingForm';
import { 
  Users, Smartphone, Calendar, ChevronRight, History as HistoryIcon,
  Search, Menu, Gift, MapPin, Phone, Home, Plus, QrCode, X, ExternalLink
} from 'lucide-react';

interface CustomerCardProps {
  member: Member;
  packages: Package[];
  branches?: Branch[];
  serviceTemplates?: ServiceTemplate[];
  shopConfig?: ShopConfig;
  onSubmitBooking?: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => Promise<void>;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ 
  member, 
  packages, 
  branches = [], 
  serviceTemplates = [],
  shopConfig,
  onSubmitBooking 
}) => {
  const [showBranches, setShowBranches] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="flex flex-col h-full bg-bg font-sans relative">
      {/* LINE Header Mockup */}
      <div className="bg-[#06C755] text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-[10px] font-bold italic">NN</span>
          </div>
          <span className="text-sm font-bold text-white">Nickki nail</span>
        </div>
        <div className="flex gap-3">
          <Search size={18} />
          <Menu size={18} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
      {/* Loyalty Card */}
        <div className="relative group">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative h-56 rounded-[32px] overflow-hidden shadow-2xl shadow-primary/30"
          >
            {/* Background Texture/Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br transition-all duration-700 ${
              member.tier === 'Gold' ? 'from-[#996515] via-[#D4AF37] to-[#B8860B]' :
              member.tier === 'Silver' ? 'from-[#334155] via-[#64748B] to-[#475569]' :
              'from-primary-dark via-primary to-primary'
            }`}>
               <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            </div>

            <div className="relative h-full p-8 flex flex-col justify-between text-white drop-shadow-md">
              <div className="flex justify-between items-start">
                 <div>
                   <p className="text-xs uppercase font-black tracking-[0.2em] opacity-90 mb-1">Elite Membership</p>
                   <h2 className="text-3xl font-serif font-bold tracking-tight">{member.name}</h2>
                 </div>
                 <div className="bg-black/20 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none text-white">
                      {member.tier}
                    </span>
                 </div>
              </div>

              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase font-bold opacity-90 tracking-wider">Available Points</p>
                  <div className="flex items-baseline gap-1">
                    <p className="text-6xl font-black font-serif leading-none tracking-tight">{member.points.toLocaleString()}</p>
                    <span className="text-sm font-bold opacity-90">pts</span>
                  </div>
                </div>
                <div 
                  onClick={() => setShowQR(true)}
                  className="w-16 h-16 bg-white/20 rounded-[20px] flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-inner hover:scale-105 active:scale-95 cursor-pointer transition-all duration-300"
                >
                   <QrCode size={32} strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </motion.div>
          
          <div className="absolute -bottom-1 -right-1 w-full h-full bg-primary/5 -z-10 rounded-[32px] blur-xl"></div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-4 gap-4 px-2">
           {[
             { label: 'พรีเมียม', icon: <Gift size={24}/>, color: 'text-primary' },
             { label: 'จองคิว', icon: <Calendar size={24}/>, color: 'text-stone-800', onClick: () => setShowBooking(true) },
             { label: 'ที่ตั้งร้าน', icon: <MapPin size={24}/>, color: 'text-accent', onClick: () => setShowBranches(true) },
             { 
               label: 'ติดต่อเรา', 
               icon: <Phone size={24}/>, 
               color: 'text-stone-800', 
               onClick: () => {
                 if (shopConfig?.shopPhone) {
                   window.location.href = `tel:${shopConfig.shopPhone}`;
                 } else {
                   alert('ยังไม่ได้ตั้งค่าเบอร์โทรศัพท์ร้าน');
                 }
               }
             },
           ].map((item, i) => (
             <div key={i} className="flex flex-col items-center gap-2">
                <button 
                  onClick={item.onClick}
                  className={`w-14 h-14 bg-white rounded-[20px] border border-border/80 flex items-center justify-center ${item.color} shadow-sm active:scale-95 transition-all hover:border-primary/40 hover:shadow-md group`}
                >
                   <div className="group-hover:scale-110 transition-transform duration-300 opacity-90 group-hover:opacity-100">
                    {item.icon}
                   </div>
                </button>
                <span className="text-[11px] font-bold text-text-main tracking-wide whitespace-nowrap">{item.label}</span>
             </div>
           ))}
        </div>

        {/* Packages Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-base font-bold text-text-main">แพ็กเกจของฉัน</h3>
            <span className="text-[11px] text-primary font-bold decoration-primary underline-offset-2 hover:underline cursor-pointer">ดูทั้งหมด</span>
          </div>
          <div className="space-y-3">
            {packages.length === 0 ? (
              <div className="bg-white border text-text-main border-border p-6 rounded-2xl text-center shadow-sm">
                 <p className="text-sm font-medium">ยังไม่มีแพ็กเกจที่ซื้อไว้</p>
                 <button className="mt-2 text-[11px] font-bold text-primary hover:underline">ดูโปรโมชั่นพิเศษ</button>
              </div>
            ) : (
              packages.map(pkg => (
                <div key={pkg.id} className="bg-white p-4 rounded-2xl border border-border flex items-center gap-4 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-1.5 h-full bg-primary opacity-30 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-12 h-12 bg-accent-soft/80 rounded-[14px] flex flex-col items-center justify-center text-primary font-bold border border-primary/10">
                    <span className="text-sm leading-none">{pkg.remainingSessions}</span>
                    <span className="text-[8px] uppercase tracking-widest mt-0.5 opacity-80">ครั้ง</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-text-main">{pkg.title}</h4>
                    <p className="text-xs text-text-muted mt-0.5 font-medium">ใช้ได้อีก {pkg.remainingSessions} ครั้ง</p>
                  </div>
                  <button className="p-2 text-primary hover:bg-accent-soft rounded-full transition-colors active:scale-95">
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* LINE Bottom Nav Bar Mockup */}
      <div className="bg-white border-t border-border px-6 py-4 flex justify-between items-center pb-8 mt-auto">
        <Home size={22} className="text-primary" />
        <HistoryIcon size={22} className="text-text-muted opacity-40" />
        <div className="w-12 h-12 bg-primary rounded-full -mt-10 flex items-center justify-center text-white shadow-lg border-4 border-white">
           <Plus size={24} />
        </div>
        <Users size={22} className="text-text-muted opacity-40" />
        <Menu size={22} className="text-text-muted opacity-40" />
      </div>

      {/* Branch Selection Modal */}
      <AnimatePresence>
        {showBranches && (
          <div className="absolute inset-0 z-50 flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBranches(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-[32px] p-8 max-h-[80%] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold">ที่ตั้งสาขาของเรา</h3>
                  <p className="text-xs text-text-muted">มีทั้งหมด {branches.length} สาขาพร้อมให้บริการ</p>
                </div>
                <button 
                  onClick={() => setShowBranches(false)}
                  className="w-8 h-8 rounded-full bg-bg flex items-center justify-center text-text-muted"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pb-10">
                {branches.length === 0 ? (
                  <div className="text-center py-10">
                    <MapPin size={32} className="mx-auto text-neutral-100 mb-2" />
                    <p className="text-sm text-text-muted italic">ยังไม่มีข้อมูลสาขาในขณะนี้</p>
                  </div>
                ) : (
                  branches.map(branch => (
                    <div key={branch.id} className="bg-bg/50 p-5 rounded-2xl border border-border flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm">{branch.name}</h4>
                          <p className="text-[10px] text-text-muted mt-0.5">{branch.address}</p>
                        </div>
                        <div className="flex gap-2">
                           {branch.phone && (
                             <a 
                               href={`tel:${branch.phone}`}
                               className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center text-green-500 shadow-sm"
                             >
                               <Phone size={14} />
                             </a>
                           )}
                           <a 
                             href={`https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`}
                             target="_blank"
                             rel="noreferrer"
                             className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20"
                           >
                             <ExternalLink size={14} />
                           </a>
                        </div>
                      </div>
                      
                      {/* Simplified Map Preview placeholder or link */}
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${branch.lat},${branch.lng}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="relative h-24 rounded-xl overflow-hidden bg-accent-soft group"
                      >
                         <div className="absolute inset-0 flex items-center justify-center">
                            <MapPin size={24} className="text-primary animate-bounce" />
                         </div>
                         <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors"></div>
                         <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[8px] font-bold shadow-sm">
                            คลิกเพื่อดูหมุดบน Google Maps
                         </div>
                      </a>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBooking && (
          <div className="absolute inset-0 z-50 flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBooking(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full bg-white rounded-t-[32px] overflow-hidden shadow-2xl h-[94%]"
            >
              <BookingForm 
                member={member}
                services={serviceTemplates}
                branches={branches}
                shopConfig={shopConfig}
                onClose={() => setShowBooking(false)}
                onSubmit={async (data) => {
                  if (onSubmitBooking) await onSubmitBooking(data);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="absolute inset-0 z-[60] flex items-center justify-center p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQR(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl flex flex-col items-center"
            >
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-bg flex items-center justify-center text-text-muted"
              >
                <X size={18} />
              </button>
              
              <h3 className="text-xl font-bold font-serif mb-1">{member.name}</h3>
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-8">{member.tier} Member</p>
              
              <div className="w-full aspect-square bg-white border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-4">
                 {/* Placeholder for real QR code later. Using dummy icon pattern */}
                 <QrCode size={120} className="text-text-main mb-4" strokeWidth={1} />
                 <p className="text-xs text-text-muted font-bold tracking-widest uppercase">Member ID</p>
                 <p className="font-mono text-sm tracking-widest">{member.id.substring(0, 8).toUpperCase()}</p>
              </div>
              
              <p className="text-center text-xs text-text-muted mt-8 leading-relaxed">
                แสดงเมนูนี้ให้พนักงานสแกน <br/> เพื่อรับสิทธิพิเศษหรือสะสมแต้ม
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
