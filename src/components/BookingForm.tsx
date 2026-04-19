import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Member, ServiceTemplate, Branch, Booking, ShopConfig } from '../types';
import { X, Calendar, Clock, MapPin, Scissors, MessageSquare, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

interface BookingFormProps {
  member: Member;
  services: ServiceTemplate[];
  branches: Branch[];
  shopConfig?: ShopConfig;
  onSubmit: (booking: Omit<Booking, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  onClose: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ member, services, branches, shopConfig, onSubmit, onClose }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState('');

  const getOpeningHoursForDate = (dateStr: string) => {
    if (!dateStr || !shopConfig?.businessHours) return null;
    const date = new Date(dateStr);
    const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const dayName = dayNames[date.getDay()];
    return shopConfig.businessHours.find(bh => bh.day === dayName);
  };

  const businessHoursForSelectedDate = getOpeningHoursForDate(selectedDate);

  const timeSlots = [
    "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const branch = branches.find(b => b.id === selectedBranch);
      await onSubmit({
        memberId: member.id,
        memberName: member.name,
        memberPhone: member.phone,
        serviceName: selectedService,
        date: selectedDate,
        timeSlot: selectedTime,
        branchId: selectedBranch,
        branchName: branch?.name || '',
        notes
      });
      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert('เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 h-full space-y-8 text-center bg-white">
        <div className="relative">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-green-500 text-white rounded-[32px] flex items-center justify-center shadow-2xl shadow-green-500/30"
          >
            <CheckCircle2 size={48} strokeWidth={1.5} />
          </motion.div>
          <div className="absolute inset-0 bg-green-500/20 blur-2xl -z-10 rounded-full"></div>
        </div>

        <div className="space-y-3">
          <h3 className="text-3xl font-serif font-bold tracking-tight text-text-main">จองคิวสำเร็จแล้ว!</h3>
          <p className="text-sm text-text-muted font-medium px-4">
            เราได้รับข้อมูลการนัดหมายของคุณเรียบร้อยแล้ว <br/>
            เจ้าหน้าที่จะติดต่อกลับเพื่อยืนยันคิวผ่านทาง LINE โดยเร็วที่สุด
          </p>
        </div>

        <div className="w-full glass-card p-8 text-left space-y-4 border-primary/10">
           <div className="text-[10px] uppercase font-black text-primary tracking-[0.2em]">รายการนัดหมายของคุณ</div>
           <div className="space-y-2">
             <p className="text-lg font-black text-text-main font-serif leading-tight">{selectedService}</p>
             <div className="flex flex-col gap-1 text-xs text-text-muted font-bold">
               <span className="flex items-center gap-2">
                  <Calendar size={12} className="text-primary/60" /> {selectedDate} @ {selectedTime} น.
               </span>
               <span className="flex items-center gap-2">
                  <MapPin size={12} className="text-primary/60" /> {branches.find(b => b.id === selectedBranch)?.name}
               </span>
             </div>
           </div>
        </div>
        
        <button 
          onClick={onClose} 
          className="btn-primary w-full py-5 text-lg shadow-xl shadow-primary/20"
        >
          กลับสู่หน้าหลัก
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-8 flex justify-between items-center border-b border-border/40 bg-white sticky top-0 z-20">
        <div>
          <h3 className="text-2xl font-serif font-bold tracking-tight">จองคิวรับบริการ</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(s => (
                <div key={s} className={`h-1 rounded-full transition-all duration-500 ${step >= s ? 'w-4 bg-primary' : 'w-2 bg-border'}`} />
              ))}
            </div>
            <p className="text-[9px] text-text-muted uppercase font-black tracking-[0.2em]">Step {step} of 4</p>
          </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-bg flex items-center justify-center text-text-muted hover:text-primary transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 pb-32">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Scissors size={16} strokeWidth={2.5} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">เลือกบริการที่คุณต้องการ</h4>
              </div>
              <div className="space-y-4">
                {services.map(svc => (
                  <button
                    key={svc.id}
                    onClick={() => { setSelectedService(svc.name); setStep(2); }}
                    className={`w-full text-left p-6 rounded-3xl border transition-all flex justify-between items-center group ${selectedService === svc.name ? 'border-primary bg-primary/5 shadow-inner' : 'border-border bg-white hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'}`}
                  >
                    <div>
                      <div className="text-lg font-bold text-text-main group-hover:text-primary transition-colors">{svc.name}</div>
                      <div className="text-xs font-bold text-primary mt-1">฿ {svc.price.toLocaleString()}</div>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${selectedService === svc.name ? 'bg-primary text-white rotate-90 scale-110' : 'bg-bg text-text-muted group-hover:text-primary'}`}>
                      <ChevronRight size={18} />
                    </div>
                  </button>
                ))}
                {services.length === 0 && (
                  <button
                    onClick={() => { setSelectedService('บริการทั่วไป'); setStep(2); }}
                    className="w-full text-left p-6 rounded-3xl border border-border bg-white hover:border-primary/30 transition-all font-bold text-center italic text-text-muted"
                  >
                    ไม่มีบริการที่ระบุ (คลิกเพื่อระบุบริการทั่วไป)
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin size={16} strokeWidth={2.5} />
                </div>
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">เลือกสาขาที่สะดวก</h4>
              </div>
              <div className="space-y-4">
                {branches.map(branch => (
                  <button
                    key={branch.id}
                    onClick={() => { setSelectedBranch(branch.id); setStep(3); }}
                    className={`w-full text-left p-6 rounded-3xl border transition-all flex justify-between items-center group ${selectedBranch === branch.id ? 'border-primary bg-primary/5 shadow-inner' : 'border-border bg-white hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5'}`}
                  >
                    <div className="flex-1">
                      <div className="text-lg font-bold text-text-main group-hover:text-primary transition-colors">{branch.name}</div>
                      <div className="text-xs text-text-muted mt-1 font-medium">{branch.address}</div>
                    </div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${selectedBranch === branch.id ? 'bg-primary text-white rotate-90 scale-110' : 'bg-bg text-text-muted group-hover:text-primary'}`}>
                      <ChevronRight size={18} />
                    </div>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setStep(1)} 
                className="w-full py-4 text-xs font-bold text-text-muted hover:text-primary transition-colors border border-dashed border-border rounded-2xl flex items-center justify-center gap-2"
              >
                ย้อนกลับไปเลือกบริการ
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar size={16} strokeWidth={2.5} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">ระบุวันและเวลานัดหมาย</h4>
                </div>
                
                <div className="relative">
                  <input 
                    type="date" 
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime('');
                    }}
                    className="w-full p-6 bg-bg rounded-3xl border border-border outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all font-bold text-lg text-text-main appearance-none cursor-pointer"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-primary">
                     <Calendar size={20} />
                  </div>
                </div>
                
                {businessHoursForSelectedDate && (
                  <div className={`p-6 rounded-3xl border animate-in fade-in slide-in-from-top-2 duration-500 flex items-start gap-4 ${businessHoursForSelectedDate.isOpen ? 'bg-green-50/10 border-green-100/50 text-green-700' : 'bg-red-50/10 border-red-100/50 text-red-700'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${businessHoursForSelectedDate.isOpen ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {businessHoursForSelectedDate.isOpen ? <Clock size={16}/> : <AlertCircle size={16}/>}
                    </div>
                    <div className="text-xs space-y-1">
                       <p className="font-black uppercase tracking-widest">{businessHoursForSelectedDate.day}</p>
                       {businessHoursForSelectedDate.isOpen ? (
                         <p className="font-medium">ยินดีให้บริการเวลา: <span className="font-bold underlineDecoration-primary decoration-2 underline-offset-4">{businessHoursForSelectedDate.open} - {businessHoursForSelectedDate.close} น.</span></p>
                       ) : (
                         <p className="font-bold text-base">ขออภัย ร้านปิดทำการในวันส่วนนี้</p>
                       )}
                    </div>
                  </div>
                )}
              </div>

              {selectedDate && businessHoursForSelectedDate?.isOpen && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Clock size={16} strokeWidth={2.5} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">เลือกเวลาที่คุณสะดวก</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {timeSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-4 rounded-2xl border text-sm font-bold transition-all ${selectedTime === time ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105' : 'bg-white text-text-main border-border hover:border-primary/40 hover:bg-primary/5'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate && selectedTime && (
                <button 
                  onClick={() => setStep(4)} 
                  className="btn-primary w-full py-5 mt-6 text-lg tracking-wide shadow-2xl shadow-primary/30"
                >
                  ถัดไป
                </button>
              )}

              <button 
                onClick={() => setStep(2)} 
                className="w-full py-4 text-xs font-bold text-text-muted hover:text-primary transition-colors border border-dashed border-border rounded-2xl flex items-center justify-center gap-2"
              >
                ย้อนกลับไปเลือกสาขา
              </button>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MessageSquare size={16} strokeWidth={2.5} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-text-muted">ความต้องการเพิ่มเติม</h4>
                </div>
                <textarea 
                  placeholder="เช่น สไตล์ที่ชอบ หรือ ข้อมูลเพิ่มเติมเพื่อเตรียมความพร้อมให้คุณ..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-6 h-40 rounded-[32px] border border-border bg-bg text-sm outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="glass-card p-10 space-y-6 border-primary/10 bg-gradient-to-br from-white to-primary-light/5">
                  <h4 className="text-[10px] uppercase font-black text-primary tracking-[0.3em] text-center">Review Booking</h4>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center pb-4 border-b border-border/40">
                      <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Service</span>
                      <span className="text-sm font-black text-text-main font-serif">{selectedService}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-border/40">
                      <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Branch</span>
                      <span className="text-sm font-bold text-text-main">{branches.find(b => b.id === selectedBranch)?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Appointment</span>
                      <span className="text-sm font-black text-primary">{selectedDate} @ {selectedTime} น.</span>
                    </div>
                  </div>
              </div>

              <button 
                disabled={isSubmitting}
                onClick={handleSubmit} 
                className="btn-primary w-full py-5 flex items-center justify-center gap-3 shadow-2xl shadow-primary/40 text-lg group"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ยืนยันการนัดหมาย</span>
                    <CheckCircle2 size={24} className="group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>

              <button 
                onClick={() => setStep(3)} 
                className="w-full py-4 text-xs font-bold text-text-muted hover:text-primary transition-colors border border-dashed border-border rounded-2xl flex items-center justify-center gap-2"
              >
                ย้อนกลับไปแก้ไขวันและเวลา
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
