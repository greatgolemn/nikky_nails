import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Booking } from '../types';
import { Calendar, Clock, User, Phone, MapPin, Search, CheckCircle2, XCircle, Clock4, Filter, Trash2 } from 'lucide-react';

interface BookingManagerProps {
  bookings: Booking[];
  onUpdateStatus: (id: string, status: Booking['status']) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const BookingManager: React.FC<BookingManagerProps> = ({ bookings, onUpdateStatus, onDelete }) => {
  const [filter, setFilter] = React.useState<Booking['status'] | 'all'>('all');
  const [search, setSearch] = React.useState('');

  const filtered = bookings.filter(b => {
    const matchesFilter = filter === 'all' || b.status === filter;
    const searchLower = search.toLowerCase();
    const name = b.memberName?.toLowerCase() || '';
    const phone = b.memberPhone || '';
    const matchesSearch = name.includes(searchLower) || phone.includes(search);
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status: Booking['status']) => {
    switch(status) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'confirmed': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-stone-100 text-stone-500 border-stone-200';
    }
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch(status) {
      case 'pending': return <Clock4 size={12} />;
      case 'confirmed': return <CheckCircle2 size={12} />;
      case 'completed': return <CheckCircle2 size={12} />;
      case 'cancelled': return <XCircle size={12} />;
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 px-4">
        <div>
          <h2 className="text-4xl font-serif font-bold tracking-tight">รายการจองคิว</h2>
          <p className="text-sm text-text-muted mt-2">จัดการคำขอจองคิวและยืนยันนัดหมายกับลูกค้าในระบบ</p>
        </div>
        
        <div className="flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto">
           <div className="relative w-full lg:w-72">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/60" size={16} />
             <input 
               type="text" 
               placeholder="ค้นหาชื่อหรือเบอร์โทร..." 
               className="pl-12 pr-6 py-3 bg-white border border-border rounded-2xl text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all w-full shadow-sm"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           
           <div className="flex bg-white rounded-2xl border border-border shadow-sm w-full lg:w-72 relative h-[50px]">
             <select
               value={filter}
               onChange={(e) => setFilter(e.target.value as any)}
               className="w-full h-full bg-transparent border-none outline-none text-sm font-bold text-text-main px-6 pr-12 appearance-none cursor-pointer"
             >
               <option value="all">สถานะ: ทั้งหมด (All)</option>
               <option value="pending">สถานะ: รอการยืนยัน (Pending)</option>
               <option value="confirmed">สถานะ: ยืนยันแล้ว (Confirmed)</option>
               <option value="completed">สถานะ: เสร็จสิ้น (Completed)</option>
               <option value="cancelled">สถานะ: ยกเลิก (Cancelled)</option>
             </select>
             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filtered.map(booking => (
            <motion.div
              layout
              key={booking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card flex flex-col justify-between group hover:border-primary/40 transition-all duration-500 overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border flex items-center gap-2 ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    <span className="uppercase tracking-[0.15em]">{booking.status}</span>
                  </div>
                  <div className="text-[10px] text-text-muted font-bold uppercase tracking-widest opacity-60 italic">
                    {booking.createdAt ? new Date(booking.createdAt.toDate()).toLocaleDateString() : 'New'}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
                      <User size={24} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-xl text-text-main group-hover:text-primary transition-colors">{booking.memberName}</h4>
                      <a 
                        href={`tel:${booking.memberPhone}`} 
                        className="flex items-center gap-2 text-xs text-text-muted mt-1 font-medium hover:text-primary hover:underline transition-all w-fit"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone size={12} className="opacity-60" />
                        {booking.memberPhone}
                      </a>
                    </div>
                  </div>

                  <div className="bg-bg/40 p-5 rounded-[24px] space-y-4 border border-border/40 group-hover:bg-white transition-colors duration-500">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <p className="text-[9px] uppercase font-black text-text-muted/60 tracking-widest">วันที่นัดหมาย</p>
                           <div className="flex items-center gap-2 text-sm font-bold">
                              <Calendar size={14} className="text-primary/70" />
                              {new Date(booking.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}
                           </div>
                        </div>
                        <div className="space-y-1">
                           <p className="text-[9px] uppercase font-black text-text-muted/60 tracking-widest">เวลา</p>
                           <div className="flex items-center gap-2 text-sm font-bold">
                              <Clock size={14} className="text-primary/70" />
                              {booking.timeSlot} น.
                           </div>
                        </div>
                     </div>
                     <div className="pt-3 border-t border-border/40">
                        <p className="text-[9px] uppercase font-black text-text-muted/60 tracking-widest mb-2">บริการ & สถานที่</p>
                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-xs font-bold text-primary">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                              {booking.serviceName}
                           </div>
                           <div className="flex items-center gap-2 text-xs text-text-muted font-bold">
                              <MapPin size={12} className="opacity-60" />
                              {booking.branchName}
                           </div>
                        </div>
                     </div>
                     {booking.notes && (
                        <div className="pt-3 border-t border-border/40">
                           <p className="text-[9px] uppercase font-black text-text-muted/60 tracking-widest mb-1.5">Note</p>
                           <p className="text-xs italic text-text-muted bg-white p-3 rounded-xl border border-border/30 leading-relaxed truncate group-hover:whitespace-normal transition-all">"{booking.notes}"</p>
                        </div>
                     )}
                  </div>
                </div>
              </div>

              <div className="px-8 py-5 bg-bg/20 border-t border-border/40 flex items-center justify-between group-hover:bg-primary/5 transition-colors duration-500">
                <div className="flex gap-3">
                   {booking.status === 'pending' && (
                     <button 
                       onClick={() => onUpdateStatus(booking.id, 'confirmed')}
                       className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 active:scale-95 transition-all"
                     >
                       ยืนยันนัดหมาย
                     </button>
                   )}
                   {booking.status === 'confirmed' && (
                     <button 
                       onClick={() => onUpdateStatus(booking.id, 'completed')}
                       className="px-6 py-2.5 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600 shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                     >
                       สำเร็จแล้ว
                     </button>
                   )}
                   {(booking.status === 'pending' || booking.status === 'confirmed') && (
                     <button 
                       onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                       className="px-6 py-2.5 bg-white text-red-500 border border-red-100 text-xs font-bold rounded-xl hover:bg-red-50 transition-all"
                     >
                       ยกเลิก
                     </button>
                   )}
                </div>
                
                <button 
                  onClick={() => {
                    if(window.confirm('ยืนยันการลบประวัติการจองนี้?')) onDelete(booking.id);
                  }}
                  className="p-3 text-text-muted hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 bg-white rounded-xl border border-transparent hover:border-red-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-[40px] border border-dashed border-border flex flex-col items-center justify-center">
             <Calendar size={48} className="text-neutral-100 mb-4" />
             <p className="text-text-muted italic">ไม่พบรายการจองตามเงื่อนไขที่กำหนด</p>
          </div>
        )}
      </div>
    </div>
  );
};
